"use client";

import { useState } from "react";
import { Star, StarHalf, User, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListItemSkeleton } from "@/components/ui/skeletons";
import ReviewForm from "./ReviewForm";
import { useGetReviewsQuery, useDeleteReviewMutation } from "@/state/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface PropertyReviewsProps {
  propertyId: number;
}

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user: authUser } = useUnifiedAuth();
  const { data: reviewData, isLoading, refetch } = useGetReviewsQuery(propertyId);
  const [deleteReview] = useDeleteReviewMutation();

  const reviews = reviewData?.reviews || [];
  const averageRating = reviewData?.averageRating || 0;
  const totalReviews = reviewData?.totalReviews || 0;

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    refetch();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteReview({ id: reviewId, propertyId }).unwrap();
        refetch();
      } catch (error) {
        console.error("Failed to delete review:", error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <div className="mt-8 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Student Reviews
        </h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {renderStars(averageRating)}
          </div>
          <span className="text-lg font-medium text-gray-800">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>

      {/* Only show review form if user hasn't reviewed yet */}
      {!showReviewForm && authUser?.role === 'student' && !reviews.some(r => r.tenant.email === authUser?.email) && (
        <Button 
          onClick={() => setShowReviewForm(true)}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Write a Review
        </Button>
      )}

      {showReviewForm && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <ReviewForm 
            propertyId={propertyId} 
            onReviewSubmitted={handleReviewSubmitted} 
          />
          <Button 
            variant="outline" 
            onClick={() => setShowReviewForm(false)}
            className="mt-2"
          >
            Cancel
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to review this property!
            </p>
          ) : (
            reviews.map((review) => {
              const isOwnReview = authUser?.email === review.tenant.email;
              return (
                <div 
                  key={review.id} 
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {review.tenantName || review.tenant.name}
                          {isOwnReview && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                          )}
                        </h4>
                        <div className="flex items-center mt-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(review.createdAt)}
                      </div>
                      {isOwnReview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-4 text-gray-700 dark:text-gray-300">{review.comment}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyReviews;
