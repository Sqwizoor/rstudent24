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

    // Fetch managers ONLY from manager table
    const managers = await prisma.manager.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

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
