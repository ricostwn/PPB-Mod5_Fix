// src/components/home/FeaturedMinumanSection.jsx
import { Clock, Star, ChefHat, Coffee } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function FeaturedMinumanSection({ recipes, loading, error, onRecipeClick, onNavigate }) {
  const [visibleMinuman, setVisibleMinuman] = useState(new Set());
  const minumanRefs = useRef([]);

  useEffect(() => {
    const observerMinuman = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index);
          setTimeout(() => {
            setVisibleMinuman(prev => new Set(prev).add(index));
          }, index * 250);
        }
      });
    }, { threshold: 0.1 });

    minumanRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.dataset.index = index;
        observerMinuman.observe(ref);
      }
    });

    return () => {
      observerMinuman.disconnect();
    };
  }, [recipes]);

  if (loading) {
    return (
      <section>
        <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-6">Resep Minuman</h2>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat resep minuman...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-6">Resep Minuman</h2>
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </section>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <section>
        <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-6">Resep Minuman</h2>
        <div className="text-center py-12">
          <p className="text-gray-600">Belum ada resep minuman</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-slate-800">Resep Minuman</h2>
        <button 
          onClick={() => onNavigate && onNavigate('minuman')}
          className="text-slate-500 hover:text-slate-600 font-medium text-xs md:text-sm transition-colors duration-200 hover:underline"
        >
          Lihat Semua
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {recipes.map((recipe, index) => (
          <div 
            key={recipe.id}
            ref={el => minumanRefs.current[index] = el}
            className={`group transform transition-all duration-700 ${
              visibleMinuman.has(index) 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-8 opacity-0'
            }`}
          >
            <div 
              onClick={() => onRecipeClick && onRecipeClick(recipe.id)}
              className="relative bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-2xl shadow-indigo-500/5 hover:shadow-indigo-500/15 transition-all duration-500 cursor-pointer group-hover:scale-105 group-hover:bg-white/20">
              
              <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex">
                {/* Recipe Image */}
                <div className="h-29 w-28 md:h-48 md:w-48 flex-shrink-0 overflow-hidden">
                  <img 
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="relative z-10 p-4 md:p-8 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/90 px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                      Minuman
                    </span>
                    {recipe.average_rating > 0 && (
                      <div className="flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-current" />
                        <span className="text-xs md:text-sm font-semibold text-slate-700">
                          {recipe.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-2 md:mb-4 text-sm md:text-xl group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
                    {recipe.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs md:text-sm text-slate-600">
                    <div className="flex items-center space-x-1 md:space-x-2 bg-white/70 px-2 md:px-3 py-1 md:py-2 rounded-full">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="font-medium">{recipe.prep_time || 10} menit</span>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 bg-white/70 px-2 md:px-3 py-1 md:py-2 rounded-full">
                      <Coffee className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="font-medium">{recipe.difficulty || 'mudah'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}