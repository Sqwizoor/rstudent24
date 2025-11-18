import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAuth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - Get user's vouchers
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;

    const vouchers = await prisma.voucher.findMany({
      where: { ownerCognitoId: userId },
      include: {
        referral: {
          include: {
            referred: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vouchers });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

// POST - Validate or use a voucher
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { voucherCode, action } = body;

    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Invalid voucher code" },
        { status: 404 }
      );
    }

    if (action === "validate") {
      // Check if voucher is valid
      if (voucher.status !== "Active") {
        return NextResponse.json(
          { error: "Voucher has already been used or expired" },
          { status: 400 }
        );
      }

      if (new Date() > voucher.expiresAt) {
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: "Expired" },
        });
        return NextResponse.json(
          { error: "Voucher has expired" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        voucher: {
          code: voucher.code,
          discountAmount: voucher.discountAmount,
          discountPercent: voucher.discountPercent,
          expiresAt: voucher.expiresAt,
        },
      });
    }

    if (action === "use") {
      // Use the voucher
      if (voucher.status !== "Active") {
        return NextResponse.json(
          { error: "Voucher has already been used or expired" },
          { status: 400 }
        );
      }

      if (new Date() > voucher.expiresAt) {
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: "Expired" },
        });
        return NextResponse.json(
          { error: "Voucher has expired" },
          { status: 400 }
        );
      }

      const updatedVoucher = await prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          status: "Used",
          usedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Voucher applied successfully",
        voucher: updatedVoucher,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing voucher:", error);
    return NextResponse.json(
      { error: "Failed to process voucher" },
      { status: 500 }
    );
  }
}
