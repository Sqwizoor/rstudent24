import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for exporting all referrals as CSV
export async function GET(request: NextRequest) {
  try {
    // Verify authentication - ONLY admins can export
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. Only admins can export referrals.' }, { status: 403 });
    }

    // Get all referrals with related data
    const referrals = await prisma.referral.findMany({
      where: {
        referredCognitoId: { not: null }
      },
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
        vouchers: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Define CSV headers
    const headers = [
      'Referral ID',
      'Referral Code',
      'Created Date',
      'Status',
      'Completed Date',
      'Referrer ID',
      'Referrer Name',
      'Referrer Email',
      'Referrer Phone',
      'Referred ID',
      'Referred Name',
      'Referred Email',
      'Referred Phone',
      'Voucher Generated',
      'Voucher Code',
      'Voucher Amount',
      'Voucher Status',
      'Voucher Expires'
    ];

    // Format date helper
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Escape CSV field helper
    const escapeCsvField = (field: any) => {
      if (field === null || field === undefined) return '';
      const stringValue = String(field);
      // If field contains comma, newline, or double quote, wrap in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Convert referrals to CSV rows
    type ReferralWithRelations = typeof referrals[0];

    const rows: string[] = referrals.map((referral: ReferralWithRelations): string => {
      const voucher = referral.vouchers[0]; // Get first voucher if exists
      
      const csvRow = {
        id: referral.id,
        referralCode: escapeCsvField(referral.referralCode),
        createdAt: formatDate(referral.createdAt),
        status: referral.isCompleted ? 'Completed' : 'Pending',
        completedAt: formatDate(referral.completedAt),
        referrerId: referral.referrer?.id || '',
        referrerName: escapeCsvField(referral.referrer?.name || ''),
        referrerEmail: escapeCsvField(referral.referrer?.email || ''),
        referrerPhone: escapeCsvField(referral.referrer?.phoneNumber || ''),
        referredId: referral.referred?.id || '',
        referredName: escapeCsvField(referral.referred?.name || ''),
        referredEmail: escapeCsvField(referral.referred?.email || ''),
        referredPhone: escapeCsvField(referral.referred?.phoneNumber || ''),
        voucherGenerated: referral.voucherGenerated ? 'Yes' : 'No',
        voucherCode: escapeCsvField(voucher?.code || ''),
        voucherAmount: voucher?.discountAmount || '',
        voucherStatus: voucher?.status || '',
        voucherExpires: formatDate(voucher?.expiresAt)
      };

      return Object.values(csvRow).join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Generate filename with current date
    const filename = `referrals_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error("Error exporting referrals:", err);
    return NextResponse.json(
      { message: `Error exporting referrals: ${err.message}` },
      { status: 500 }
    );
  }
}
