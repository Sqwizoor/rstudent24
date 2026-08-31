import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all managers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get status filter from query params if present
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeDemo = searchParams.get('includeDemo') === 'true';

    // Build where clause to exclude demo data unless explicitly requested
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (!includeDemo) {
      whereClause.AND = [
        {
          email: {
            not: {
              contains: 'example.com'
            }
          }
        },
        {
          email: {
            not: {
              contains: '@demo'
            }
          }
        }
      ];
    }

    // Fetch managers from Prisma
    let managers = await prisma.manager.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Also fetch managers from Convex
    try {
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://hardy-bird-543.convex.cloud';
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "users:getAllManagers", args: {} }),
      });
      const data = await res.json();
      if (Array.isArray(data?.value)) {
        const existingEmails = new Set(managers.map((m: any) => m.email?.toLowerCase()));
        for (const cm of data.value) {
          if (cm.email && !existingEmails.has(cm.email.toLowerCase())) {
            existingEmails.add(cm.email.toLowerCase());
            managers.push({
              id: Number(cm._id) || Math.floor(Math.random() * 100000),
              cognitoId: cm.userId || cm._id,
              name: cm.name || cm.email,
              email: cm.email,
              phoneNumber: cm.phoneNumber || null,
              status: cm.status || "Active",
              createdAt: new Date(cm.createdAt || Date.now()),
              updatedAt: new Date(),
            } as any);
          }
        }
      }
    } catch (e) {
      console.warn("Convex manager merge warning:", e);
    }

    console.log(`Admin managers - GET: Found ${managers.length} landlord/manager records`);
    
    return NextResponse.json(managers);
  } catch (error: any) {
    console.error("Error retrieving managers:", error);
    return NextResponse.json(
      { message: `Error retrieving managers: ${error.message}` },
      { status: 500 }
    );
  }
}
