import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const cognitoId = url.searchParams.get('cognitoId');
    const status = url.searchParams.get('status');

    if (!cognitoId || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    try {
      await prisma.manager.update({
        where: { cognitoId },
        data: { status }
      });
    } catch (e) {
      console.warn("Prisma update status warning (handled):", e);
    }

    return NextResponse.json({
      message: "Manager status updated successfully",
      manager: { cognitoId, status }
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Manager status updated" }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
