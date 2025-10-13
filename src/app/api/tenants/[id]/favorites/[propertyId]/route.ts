import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST handler for adding a property to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract parameters - make sure to await them as per Next.js App Router requirements
    const { id, propertyId } = await params;
    
    // Validate parameters
    if (!id || !propertyId) {
      return NextResponse.json(
        { message: 'Missing required parameters: id and propertyId' },
        { status: 400 }
      );
    }
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
      include: { favorites: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) }
    });
    
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if already in favorites
    const alreadyFavorite = tenant.favorites.some((fav: { id: number }) => fav.id === parseInt(propertyId));
    
    if (alreadyFavorite) {
      return NextResponse.json(
        { message: 'Property already in favorites' },
        { status: 200 }
      );
    }
    
    // Add to favorites
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId: id },
      data: {
        favorites: {
          connect: { id: parseInt(propertyId) }
        }
      },
      include: { favorites: true }
    });
    
    return NextResponse.json(updatedTenant);
  } catch (err: any) {
    console.error("Error adding to favorites:", err);
    return NextResponse.json(
      { message: `Error adding to favorites: ${err.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for removing a property from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; propertyId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract parameters - make sure to await them as per Next.js App Router requirements
    const { id, propertyId } = await params;
    
    // Validate parameters
    if (!id || !propertyId) {
      return NextResponse.json(
        { message: 'Missing required parameters: id and propertyId' },
        { status: 400 }
      );
    }
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId: id },
      include: { favorites: true }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) }
    });
    
    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }
    
    // Check if in favorites
    const isFavorite = tenant.favorites.some((fav: { id: number }) => fav.id === parseInt(propertyId));
    
    if (!isFavorite) {
      return NextResponse.json(
        { message: 'Property not in favorites' },
        { status: 200 }
      );
    }
    
    // Remove from favorites
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId: id },
      data: {
        favorites: {
          disconnect: { id: parseInt(propertyId) }
        }
      },
      include: { favorites: true }
    });
    
    return NextResponse.json(updatedTenant);
  } catch (err: any) {
    console.error("Error removing from favorites:", err);
    return NextResponse.json(
      { message: `Error removing from favorites: ${err.message}` },
      { status: 500 }
    );
  }
}
