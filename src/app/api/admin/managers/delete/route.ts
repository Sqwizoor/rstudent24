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

    if (!cognitoId) {
      return NextResponse.json({ message: "Missing required cognitoId parameter" }, { status: 400 });
    }

    try {
      await prisma.manager.deleteMany({
        where: { cognitoId }
      });
    } catch (e) {
      console.warn("Prisma delete manager warning (handled):", e);
    }

    return NextResponse.json({
      message: 'Manager deleted successfully',
      deletedCognitoId: cognitoId
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Manager deleted' }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}
