import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/reviews?propertyId=123 - Get all reviews for a property
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { message: 'Property ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        propertyId: parseInt(propertyId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        tenantName: true,
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { message: `Error fetching reviews: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only tenants can create reviews
    if (authResult.userRole !== 'tenant') {
      return NextResponse.json(
        { message: 'Only students/tenants can create reviews' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, rating, comment } = body;

    // Validate required fields
    if (!propertyId || !rating) {
      return NextResponse.json(
        { message: 'Property ID and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
    });

    if (!property) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    // Get tenant information
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId: authResult.userId },
    });

    if (!tenant) {
      return NextResponse.json(
        { message: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        propertyId_tenantCognitoId: {
          propertyId: parseInt(propertyId),
          tenantCognitoId: authResult.userId!,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: 'You have already reviewed this property' },
        { status: 409 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        propertyId: parseInt(propertyId),
        tenantCognitoId: authResult.userId!,
        tenantName: tenant.name,
        rating: parseInt(rating),
        comment: comment || null,
      },
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Update property's average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { propertyId: parseInt(propertyId) },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;

    await prisma.property.update({
      where: { id: parseInt(propertyId) },
      data: {
        averageRating: avgRating,
        numberOfReviews: allReviews.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { message: `Error creating review: ${error.message}` },
      { status: 500 }
    );
  }
}
