// src/components/common/FavoriteButton.jsx
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useIsFavorited } from '../../hooks/useFavorites';

/**
 * FavoriteButton Component
 * Uses server-backed favorites via `useIsFavorited` hook so state
 * remains consistent with the Profile favorites section.
 */
export default function FavoriteButton({ recipeId, onToggle, showCount = false, initialCount = 0, size = 'md' }) {
  const { isFavorited, loading, toggleFavorite } = useIsFavorited(recipeId);
  const [favoriteCount, setFavoriteCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  // Size variants
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (loading) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const result = await toggleFavorite();

    // Optimistically update count if toggle succeeded
    if (result) {
      const newState = !isFavorited;
      setFavoriteCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
      if (onToggle) onToggle(recipeId, newState);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center gap-1.5
        transition-all duration-200 
        ${isFavorited 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-white/90 hover:bg-white text-slate-700 hover:text-red-500'
        }
        backdrop-blur-sm shadow-md hover:shadow-lg
        ${isAnimating ? 'scale-125' : 'scale-100'}
        group
      `}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`
          ${iconSizes[size]} 
          transition-all duration-200
          ${isFavorited ? 'fill-current' : ''}
          ${isAnimating ? 'animate-pulse' : ''}
        `} 
      />
      {showCount && favoriteCount > 0 && (
        <span className="text-xs font-semibold">
          {favoriteCount > 999 ? '999+' : favoriteCount}
        </span>
      )}
    </button>
  );
}