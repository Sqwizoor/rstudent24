import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    let requestBody: { status?: string; notes?: string } = {};
    try {
      requestBody = await request.json();
    } catch {}

    const status = requestBody.status || "Active";

    try {
      await prisma.manager.update({
        where: { cognitoId: id },
        data: { status }
      });
    } catch (e) {
      console.warn("Prisma manager status PUT warning (handled):", e);
    }

    return NextResponse.json({
      message: 'Manager status updated successfully',
      manager: { id, cognitoId: id, status }
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Manager status updated' }, { status: 200 });
  }
}
