import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryCache } from "@/lib/queryCache";

// ✅ ISR: Cache analytics for 6 hours (less volatile)
export const revalidate = 21600;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for time range
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || 'month';
    
    // ✅ Step 2: Check cache first
    const cacheKey = queryCache.getKey('analytics', { timeRange });
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // First try basic counts to see if database is accessible
    console.log("Testing database connection...");
    
    const totalProperties = await prisma.property.count();
    console.log("Properties count:", totalProperties);
    
    const totalManagers = await prisma.manager.count({
      where: {
        AND: [
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
        ]
      }
    });
    console.log("Managers count:", totalManagers);
    
    const totalTenants = await prisma.tenant.count();
    console.log("Tenants count:", totalTenants);
    
    const totalLeases = await prisma.lease.count({
      where: {
        endDate: {
          gte: now
        }
      }
    });
    console.log("Active leases count:", totalLeases);

    // Get property types distribution
    const propertyTypes = await prisma.property.groupBy({
      by: ['propertyType'],
      _count: {
        id: true
      }
    });
    console.log("Property types:", propertyTypes);

    // Get city distribution
    const cityDistribution = await prisma.location.findMany({
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      },
      orderBy: {
        properties: {
          _count: 'desc'
        }
      },
      take: 6
    });
    console.log("City distribution:", cityDistribution);

    // Get room prices for price range distribution
    const roomPrices = await prisma.room.findMany({
      select: {
        pricePerMonth: true
      }
    });
    console.log("Room prices count:", roomPrices.length);

    // Get manager activity data
    const managerStats = await prisma.manager.findMany({
      where: {
        AND: [
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
        ]
      },
      select: {
        id: true,
        name: true,
        managedProperties: {
          select: {
            id: true,
            applications: {
              select: {
                id: true
              }
            },
            leases: {
              select: {
                id: true
              },
              where: {
                endDate: {
                  gte: now
                }
              }
            }
          }
        }
      },
      orderBy: {
        managedProperties: {
          _count: 'desc'
        }
      },
      take: 5
    });
    console.log("Manager stats count:", managerStats.length);

    // Get student activity over time
    const studentActivity = await prisma.application.groupBy({
      by: ['applicationDate'],
      _count: {
        id: true
      },
      where: {
        applicationDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 4, 1)
        }
      }
    });
    console.log("Student activity entries:", studentActivity.length);

    // Get property status data
    const propertyStatus = await prisma.property.findMany({
      select: {
        id: true,
        leases: {
          where: {
            endDate: {
              gte: now
            }
          }
        }
      }
    });
    console.log("Property status entries:", propertyStatus.length);

    // Process price ranges
    const priceRangeData = [
      { name: 'R0-R2,000', count: 0 },
      { name: 'R2,001-R4,000', count: 0 },
      { name: 'R4,001-R6,000', count: 0 },
      { name: 'R6,001-R8,000', count: 0 },
      { name: 'R8,001-R10,000', count: 0 },
      { name: 'R10,001+', count: 0 },
    ];

    roomPrices.forEach((room: { pricePerMonth: number | null }) => {
      if (room.pricePerMonth !== null && room.pricePerMonth !== undefined) {
        const price = room.pricePerMonth;
        if (price <= 2000) priceRangeData[0].count++;
        else if (price <= 4000) priceRangeData[1].count++;
        else if (price <= 6000) priceRangeData[2].count++;
        else if (price <= 8000) priceRangeData[3].count++;
        else if (price <= 10000) priceRangeData[4].count++;
        else priceRangeData[5].count++;
      }
    });

    // Process landlord stats
    const landlordActivityData = managerStats.map((manager: any) => {
      const properties = manager.managedProperties.length;
      const applications = manager.managedProperties.reduce((sum: number, prop: any) => sum + prop.applications.length, 0);
      const leases = manager.managedProperties.reduce((sum: number, prop: any) => sum + prop.leases.length, 0);
      
      return {
        name: manager.name || `Manager ${manager.id}`,
        properties,
        applications,
        leases
      };
    });

    // Process student activity data (group by month)
    const monthlyActivity = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]}`;
      monthlyActivity.set(monthKey, { month: monthKey, applications: 0, favorites: 0, leases: 0 });
    }

    // Count applications by month
    studentActivity.forEach((item: any) => {
      const month = months[new Date(item.applicationDate).getMonth()];
      if (monthlyActivity.has(month)) {
        monthlyActivity.get(month).applications += item._count.id;
      }
    });

    // Get lease data for the same period
    const leasesByMonth = await prisma.lease.groupBy({
      by: ['startDate'],
      _count: {
        id: true
      },
      where: {
        startDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 4, 1)
        }
      }
    });

    // Add leases to monthly activity
    leasesByMonth.forEach((item: any) => {
      const month = months[new Date(item.startDate).getMonth()];
      if (monthlyActivity.has(month)) {
        monthlyActivity.get(month).leases += item._count.id;
      }
    });

    const studentActivityData = Array.from(monthlyActivity.values());

    // Process property types
    const propertyData = propertyTypes.map((type: any) => ({
      name: type.propertyType || 'Unknown',
      count: type._count.id
    }));

    // Process city data
    const cityData = cityDistribution.map((location: any) => ({
      name: location.city || 'Unknown',
      count: location._count.properties
    }));

    // Get manager status distribution - exclude demo data
    const managerStatusData = await prisma.manager.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        AND: [
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
        ]
      }
    });

    const landlordStatusData = managerStatusData.map((status: any) => ({
      name: status.status || 'Unknown',
      value: status._count.id
    }));

    // Process property status based on lease data
    const availableCount = propertyStatus.filter((property: any) => property.leases.length === 0).length;
    const occupiedCount = propertyStatus.filter((property: any) => property.leases.length > 0).length;
    
    const propertyStatusData = [
      { name: 'Available', value: availableCount },
      { name: 'Occupied', value: occupiedCount },
      { name: 'Under Maintenance', value: 0 } // This would need to be tracked in your system
    ];

    console.log("Successfully processed all analytics data");

    const analyticsData = {
      summary: {
        totalProperties,
        totalLandlords: totalManagers,
        totalTenants,
        totalLeases
      },
      propertyData,
      cityData,
      priceRangeData,
      landlordActivityData,
      studentActivityData,
      landlordStatusData,
      propertyStatusData
    };
    
    // ✅ Step 4: Store in cache for 6 hours
    queryCache.set(cacheKey, analyticsData, 21600);
    
    // ✅ Step 5: Return with cache headers
    return NextResponse.json(analyticsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
