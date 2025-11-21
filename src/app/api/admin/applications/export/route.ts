import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for exporting all applications as CSV
export async function GET(request: NextRequest) {
  try {
    // Verify authentication - ONLY admins can export
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (authResult.userRole !== 'admin') {
      return NextResponse.json({ message: 'Forbidden. Only admins can export applications.' }, { status: 403 });
    }

    // Get all applications with related data
    const applications = await prisma.application.findMany({
      include: {
        property: {
          include: {
            location: true,
            manager: true
          }
        },
        room: true,
        tenant: true
      },
      orderBy: {
        applicationDate: 'desc'
      }
    });

    // Define CSV headers
    const headers = [
      'Application ID',
      'Application Date',
      'Status',
      'Applicant Name',
      'Applicant Email',
      'Applicant Phone',
      'Student ID',
      'Student Name',
      'Property ID',
      'Property Name',
      'Property Type',
      'Property Price',
      'Room ID',
      'Room Name',
      'Room Price',
      'Property Address',
      'City',
      'Suburb',
      'State',
      'Postal Code',
      'Manager Name',
      'Manager Email',
      'Manager Phone',
      'Message'
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

    // Convert applications to CSV rows
    type ApplicationWithRelations = typeof applications[0];

    const rows: string[] = applications.map((app: ApplicationWithRelations): string => {
      const csvRow = {
        id: app.id,
        applicationDate: formatDate(app.applicationDate),
        status: app.status,
        name: escapeCsvField(app.name),
        email: escapeCsvField(app.email),
        phoneNumber: escapeCsvField(app.phoneNumber),
        tenantId: app.tenant?.id || '',
        tenantName: escapeCsvField(app.tenant?.name || ''),
        propertyId: app.propertyId,
        propertyName: escapeCsvField(app.property?.name || ''),
        propertyType: app.property?.propertyType || '',
        propertyPrice: app.property?.pricePerMonth || '',
        roomId: app.roomId || '',
        roomName: escapeCsvField(app.room?.name || ''),
        roomPrice: app.room?.pricePerMonth || '',
        propertyAddress: escapeCsvField(app.property?.location?.address || ''),
        city: escapeCsvField(app.property?.location?.city || ''),
        suburb: escapeCsvField(app.property?.location?.suburb || ''),
        state: escapeCsvField(app.property?.location?.state || ''),
        postalCode: escapeCsvField(app.property?.location?.postalCode || ''),
        managerName: escapeCsvField(app.property?.manager?.name || ''),
        managerEmail: escapeCsvField(app.property?.manager?.email || ''),
        managerPhone: escapeCsvField(app.property?.manager?.phoneNumber || ''),
        message: escapeCsvField(app.message || '')
      };

      return Object.values(csvRow).join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Generate filename with current date
    const filename = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;

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
    console.error("Error exporting applications:", err);
    return NextResponse.json(
      { message: `Error exporting applications: ${err.message}` },
      { status: 500 }
    );
  }
}
