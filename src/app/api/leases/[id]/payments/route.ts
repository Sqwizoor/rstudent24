import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Validate and parse the lease ID
    const leaseId = parseInt(id, 10);
    if (isNaN(leaseId)) {
      return NextResponse.json({ message: 'Invalid lease ID' }, { status: 400 });
    }

    // Check if the lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
    });

    if (!lease) {
      return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
    }

    // Fetch all payments for the lease
    const payments = await prisma.payment.findMany({
      where: { leaseId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching lease payments:', error);
    return NextResponse.json({
      message: 'Error fetching lease payments',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
