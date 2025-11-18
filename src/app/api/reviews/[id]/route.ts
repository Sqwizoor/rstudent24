import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/reviews/[id] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviewId = parseInt(id);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { message: `Error fetching review: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id);
    const body = await request.json();
    const { rating, comment } = body;

    // Find the existing review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns this review
    if (existingReview.tenantCognitoId !== authResult.userId) {
      return NextResponse.json(
        { message: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating: parseInt(rating) }),
        ...(comment !== undefined && { comment }),
        updatedAt: new Date(),
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

    // Recalculate property average rating
    const allReviews = await prisma.review.findMany({
      where: { propertyId: existingReview.propertyId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;

    await prisma.property.update({
      where: { id: existingReview.propertyId },
      data: {
        averageRating: avgRating,
      },
    });

    return NextResponse.json(updatedReview);
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { message: `Error updating review: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reviewId = parseInt(id);

    // Find the existing review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { message: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user owns this review or is an admin
    if (existingReview.tenantCognitoId !== authResult.userId && authResult.userRole !== 'admin') {
      return NextResponse.json(
        { message: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate property average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { propertyId: existingReview.propertyId },
      select: { rating: true },
    });

    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length
      : 0;

    await prisma.property.update({
      where: { id: existingReview.propertyId },
      data: {
        averageRating: avgRating,
        numberOfReviews: allReviews.length,
      },
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { message: `Error deleting review: ${error.message}` },
      { status: 500 }
    );
  }
}
