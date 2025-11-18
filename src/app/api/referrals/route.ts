import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// Generate unique referral code
function generateReferralCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

// GET - Get user's referral information
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;

    // Get user's referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerCognitoId: userId },
      include: {
        referred: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user's vouchers
    const vouchers = await prisma.voucher.findMany({
      where: { ownerCognitoId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Get or create user's referral code
    let userReferralCode = await prisma.referral.findFirst({
      where: {
        referrerCognitoId: userId,
        referredCognitoId: null,
      },
    });

    if (!userReferralCode) {
      // Get user details to generate referral code
      const tenant = await prisma.tenant.findUnique({
        where: { cognitoId: userId },
      });

      if (tenant) {
        const code = generateReferralCode(tenant.name);
        userReferralCode = await prisma.referral.create({
          data: {
            referralCode: code,
            referrerCognitoId: userId,
          },
        });
      }
    }

    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter((r) => r.isCompleted).length,
      pendingReferrals: referrals.filter((r) => !r.isCompleted).length,
      totalVouchers: vouchers.length,
      activeVouchers: vouchers.filter((v) => v.status === "Active").length,
    };

    return NextResponse.json({
      referralCode: userReferralCode?.referralCode,
      referrals,
      vouchers,
      stats,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

// POST - Create a new referral or validate referral code
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;

    const body = await request.json();
    const { referralCode, action } = body;

    if (action === "validate") {
      // Validate referral code
      const referral = await prisma.referral.findUnique({
        where: { referralCode },
      });

      if (!referral) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 404 }
        );
      }

      if (referral.referrerCognitoId === userId) {
        return NextResponse.json(
          { error: "You cannot use your own referral code" },
          { status: 400 }
        );
      }

      return NextResponse.json({ valid: true, referral });
    }

    if (action === "apply") {
      // Apply referral code to new user
      const referral = await prisma.referral.findUnique({
        where: { referralCode },
      });

      if (!referral) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 404 }
        );
      }

      // Update the referral with the new user's info
      const updatedReferral = await prisma.referral.create({
        data: {
          referralCode: referral.referralCode,
          referrerCognitoId: referral.referrerCognitoId,
          referredCognitoId: userId,
          isCompleted: false,
        },
      });

      // Update tenant with referral code
      await prisma.tenant.update({
        where: { cognitoId: userId },
        data: { referredBy: referralCode },
      });

      return NextResponse.json({
        message: "Referral code applied successfully",
        referral: updatedReferral,
      });
    }

    if (action === "complete") {
      // Mark referral as completed and generate voucher
      const { referralId } = body;

      const referral = await prisma.referral.findUnique({
        where: { id: referralId },
      });

      if (!referral) {
        return NextResponse.json(
          { error: "Referral not found" },
          { status: 404 }
        );
      }

      // Update referral
      await prisma.referral.update({
        where: { id: referralId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          voucherGenerated: true,
        },
      });

      // Generate voucher for referrer
      const voucherCode = `REFER${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const voucher = await prisma.voucher.create({
        data: {
          code: voucherCode,
          ownerCognitoId: referral.referrerCognitoId,
          discountAmount: 500, // R500 discount
          discountPercent: 10, // or 10% off
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          referralId: referralId,
        },
      });

      return NextResponse.json({
        message: "Referral completed and voucher generated",
        voucher,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing referral:", error);
    return NextResponse.json(
      { error: "Failed to process referral" },
      { status: 500 }
    );
  }
}
