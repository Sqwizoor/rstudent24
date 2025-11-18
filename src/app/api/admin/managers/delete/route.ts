import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Handler for removing managers (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request, ['admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from URL
    const url = new URL(request.url);
    const cognitoId = url.searchParams.get('cognitoId');
    
    console.log(`Attempting to delete manager with cognitoId: ${cognitoId}`);

    // Validate required fields
    if (!cognitoId) {
      return NextResponse.json({ 
        message: "Missing required cognitoId parameter"
      }, { status: 400 });
    }

    // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { cognitoId },
    });

    if (!existingManager) {
      return NextResponse.json({ 
        message: "Manager not found"
      }, { status: 404 });
    }

    console.log(`Deleting manager ${existingManager.name} (${cognitoId}) with email ${existingManager.email}`);
    
    // Special handling for demo account
    if (existingManager.email === 'manager@example.com') {
      console.log('Detected demo account - using special cleanup procedure');
    }
    
    // Find any properties related to this manager
    const properties = await prisma.property.findMany({
      where: { managerCognitoId: cognitoId },
      select: { id: true }
    });
    
    console.log(`Found ${properties.length} properties to clean up`);
    
    // Delete related data for each property
    for (const property of properties) {
      try {
        // Delete rooms associated with properties
        await prisma.room.deleteMany({
          where: { propertyId: property.id }
        });
        
        // Remove favorite associations
        await prisma.property.update({
          where: { id: property.id },
          data: { favoritedBy: { set: [] } }
        });
      } catch (propertyError) {
        console.error(`Error cleaning up property ${property.id}:`, propertyError);
        // Continue with other properties
      }
    }
    
    // Delete all properties
    if (properties.length > 0) {
      try {
        await prisma.property.deleteMany({
          where: { managerCognitoId: cognitoId }
        });
        console.log('Successfully deleted all properties');
      } catch (propertiesError) {
        console.error('Error deleting properties:', propertiesError);
        // Continue with manager deletion
      }
    }
    
    // Finally delete the manager
    try {
      const deletedManager = await prisma.manager.delete({
        where: { cognitoId }
      });
      
      console.log(`Successfully deleted manager ${deletedManager.name}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Manager ${deletedManager.name} successfully deleted`,
        deletedManager
      });
    } catch (error) {
      console.error('Error deleting manager:', error);
      return NextResponse.json(
        { message: `Error deleting manager: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unhandled error in manager deletion:", error);
    return NextResponse.json(
      { message: `Error deleting manager: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
