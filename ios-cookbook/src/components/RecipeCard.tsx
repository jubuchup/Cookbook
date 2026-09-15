import React from 'react';
import { Clock, Heart, Flame } from 'lucide-react';
import { Recipe } from '../types';
import { haptics } from '../hooks/useHaptics';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onToggleFavorite,
}) => {
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    onToggleFavorite(recipe.id, e);
  };

  const handleCardClick = () => {
    haptics.tap();
    onSelect(recipe);
  };

  return (
    <div
      id={`recipe-card-${recipe.id}`}
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-[#1C1C1E] rounded-3xl overflow-hidden shadow-xs hover:shadow-md border border-black/[0.04] dark:border-white/[0.08] transition-all duration-200 active:scale-[0.98] cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="backdrop-blur-md bg-black/40 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {recipe.mealType}
          </span>
          <button
            id={`fav-btn-${recipe.id}`}
            onClick={handleFavorite}
            className="w-8 h-8 rounded-full backdrop-blur-md bg-black/40 flex items-center justify-center text-white active:scale-80 transition-transform"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                recipe.isFavorite ? 'fill-[#FACC15] text-[#FACC15]' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Overlay Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{recipe.prepTimeMinutes}m prep</span>
          </div>

          <div className="flex items-center gap-1 backdrop-blur-md bg-black/40 px-2.5 py-1 rounded-full font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{recipe.calories} kcal</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] line-clamp-1 tracking-tight">
          {recipe.title}
        </h3>
        <p className="text-xs text-[#8E8E93] dark:text-[#98989D] line-clamp-2 mt-1 leading-relaxed">
          {recipe.description}
        </p>

        {/* Macro breakdown pills */}
        <div className="mt-3.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="font-semibold text-[#1C1C1E] dark:text-neutral-200">
                {recipe.macros.protein}g
              </span>
              <span className="text-neutral-400 text-[10px]">Protein</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="font-semibold text-[#1C1C1E] dark:text-neutral-200">
                {recipe.macros.carbs}g
              </span>
              <span className="text-neutral-400 text-[10px]">Carbs</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-semibold text-[#1C1C1E] dark:text-neutral-200">
                {recipe.macros.fat}g
              </span>
              <span className="text-neutral-400 text-[10px]">Fat</span>
            </div>
          </div>

          <span className="text-[11px] font-medium text-[#1E3A8A] dark:text-[#5B8DEF]">
            {recipe.ingredients.length} ingr.
          </span>
        </div>
      </div>
    </div>
  );
};
