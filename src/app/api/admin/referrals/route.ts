import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for admin to view all referrals
export async function GET(request: NextRequest) {
  try {
    // Verify authentication - ONLY admins can access
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. Only admins can view all referrals.' }, { status: 403 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'completed', 'pending', 'all'

    // Build query
    const where: any = {
      // Only get referrals that have been used (have referred user)
      referredCognitoId: { not: null }
    };

    if (status === 'completed') {
      where.isCompleted = true;
    } else if (status === 'pending') {
      where.isCompleted = false;
    }

    // Get all referrals with related data
    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        vouchers: {
          select: {
            id: true,
            code: true,
            discountAmount: true,
            discountPercent: true,
            status: true,
            expiresAt: true,
            usedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get statistics
    type ReferralWithRelations = typeof referrals[0];
    
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r: ReferralWithRelations) => r.isCompleted).length;
    const pendingReferrals = referrals.filter((r: ReferralWithRelations) => !r.isCompleted).length;
    const vouchersGenerated = referrals.filter((r: ReferralWithRelations) => r.voucherGenerated).length;

    // Get total vouchers
    const totalVouchers = await prisma.voucher.count();
    const activeVouchers = await prisma.voucher.count({
      where: { status: 'Active' }
    });
    const usedVouchers = await prisma.voucher.count({
      where: { status: 'Used' }
    });

    return NextResponse.json({
      referrals,
      stats: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        vouchersGenerated,
        totalVouchers,
        activeVouchers,
        usedVouchers,
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error("Error retrieving referrals:", err);
    return NextResponse.json(
      { message: `Error retrieving referrals: ${err.message}` },
      { status: 500 }
    );
  }
}
