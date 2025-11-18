// src/pages/RecipeDetailPage.jsx
import { useState } from 'react';
import { useRecipe } from '../hooks/useRecipes';
import { useReviews, useCreateReview } from '../hooks/useReviews';
import { useIsFavorited } from '../hooks/useFavorites';
import { getUserIdentifier } from '../hooks/useFavorites';
import { formatDate, getDifficultyColor, getStarRating } from '../utils/helpers';
import { Heart, Clock, Users, ChefHat } from 'lucide-react';

export default function RecipeDetailPage({ recipeId, onBack }) {
  const { recipe, loading: recipeLoading, error: recipeError } = useRecipe(recipeId);
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(recipeId);
  const { createReview, loading: createLoading } = useCreateReview();
  const { isFavorited, loading: favLoading, toggleFavorite } = useIsFavorited(recipeId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const reviewData = {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    };

    const result = await createReview(recipeId, reviewData);
    if (result) {
      setComment('');
      setRating(5);
      refetchReviews();
    }
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite();
  };

  if (recipeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat resep...</p>
        </div>
      </div>
    );
  }

  if (recipeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {recipeError}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Resep tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Kembali
          </button>
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className={`p-2 rounded-full transition-colors ${
              isFavorited 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Heart className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Recipe Image */}
        <div className="mb-8">
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>

        {/* Recipe Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {recipe.name}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {recipe.category}
            </span>
            {recipe.is_featured && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ⭐ Featured
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6">{recipe.description}</p>

          {/* Recipe Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Persiapan</p>
                <p className="font-semibold">{recipe.prep_time} menit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Memasak</p>
                <p className="font-semibold">{recipe.cook_time} menit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Porsi</p>
                <p className="font-semibold">{recipe.servings} orang</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-semibold">{recipe.average_rating?.toFixed(1) || 'N/A'} ({recipe.review_count})</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bahan-bahan</h2>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ingredient, index) => (
              <li key={ingredient.id || index} className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">
                  {ingredient.name} - {ingredient.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Langkah-langkah</h2>
          <ol className="space-y-4">
            {recipe.steps?.map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {step.step_number}
                </span>
                <p className="text-gray-700 flex-1 pt-1">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ulasan</h2>
          
          {/* Create Review Form */}
          <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Tulis Ulasan</h3>
            
            {/* Rating Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komentar (Opsional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Bagikan pengalaman Anda dengan resep ini..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {comment.length}/500 karakter
              </p>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </form>

          {/* Reviews List */}
          {reviewsLoading ? (
            <p className="text-gray-500">Memuat ulasan...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">Belum ada ulasan</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{review.user_identifier}</p>
                      <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                    </div>
                    <div className="text-yellow-400">
                      {getStarRating(review.rating)}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}