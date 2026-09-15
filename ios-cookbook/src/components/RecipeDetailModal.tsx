import React, { useState } from 'react';
import {
  X,
  Heart,
  Clock,
  Flame,
  Minus,
  Plus,
  Play,
  Share2,
  Trash2,
  ChefHat,
  CheckCircle2,
  Circle,
  Copy,
  Check
} from 'lucide-react';
import { Recipe } from '../types';
import { haptics } from '../hooks/useHaptics';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onStartCooking: (recipe: Recipe, scaledServings: number) => void;
  onDeleteRecipe: (id: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onToggleFavorite,
  onStartCooking,
  onDeleteRecipe,
}) => {
  const [servings, setServings] = useState(recipe.servings);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Scaling factor
  const scale = servings / (recipe.servings || 1);

  const scaledCalories = Math.round(recipe.calories * scale);
  const scaledProtein = Math.round(recipe.macros.protein * scale);
  const scaledCarbs = Math.round(recipe.macros.carbs * scale);
  const scaledFat = Math.round(recipe.macros.fat * scale);
  const scaledFiber = recipe.macros.fiber ? Math.round(recipe.macros.fiber * scale) : undefined;

  const handleServingChange = (delta: number) => {
    const next = Math.max(1, Math.min(12, servings + delta));
    if (next !== servings) {
      haptics.tap();
      setServings(next);
    }
  };

  const toggleIngredientCheck = (id: string) => {
    haptics.tap();
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyIngredients = () => {
    haptics.tap();
    const text = recipe.ingredients
      .map((i) => {
        const scaledAmt = Math.round((i.amount * scale) * 10) / 10;
        return `• ${scaledAmt} ${i.unit} ${i.name}${i.notes ? ` (${i.notes})` : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(`${recipe.title} (${servings} servings)\n\nIngredients:\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group ingredients by category
  const categories = Array.from(new Set(recipe.ingredients.map((i) => i.category)));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Sheet */}
      <div className="relative w-full max-w-lg md:max-w-5xl mx-auto bg-[#F5F6F8] dark:bg-[#0B1220] rounded-t-[32px] md:rounded-[32px] max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden shadow-2xl transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 md:px-6 pt-4 pb-2 z-20">
          <button
            id="close-recipe-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-700 dark:text-neutral-200 active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              id="copy-ingredients-btn"
              onClick={copyIngredients}
              className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-700 dark:text-neutral-200 active:scale-90 transition-transform"
              title="Copy ingredients list"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              id="favorite-recipe-detail-btn"
              onClick={() => {
                haptics.tap();
                onToggleFavorite(recipe.id);
              }}
              className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  recipe.isFavorite ? 'fill-[#FACC15] text-[#FACC15]' : 'text-neutral-700 dark:text-neutral-200'
                }`}
              />
            </button>

            <button
              id="delete-recipe-btn"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="mx-5 mb-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              Delete this recipe permanently?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-neutral-200 dark:bg-neutral-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  haptics.tap();
                  onDeleteRecipe(recipe.id);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-medium shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Content: single column on mobile, 2/3 + 1/3 split on desktop */}
        <div className="flex-1 overflow-hidden md:flex md:flex-row">
        {/* Left column (2/3 on desktop): photo, title, macros, method — blue on desktop */}
        <div className="overflow-y-auto ios-scroll px-5 pb-28 md:pb-8 space-y-5 md:w-2/3 md:bg-[#1E3A8A] md:px-6 md:pt-2">
          {/* Hero Image */}
          <div className="relative rounded-3xl overflow-hidden aspect-16/10 shadow-sm">
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
              <span className="backdrop-blur-md bg-black/40 px-3 py-1 rounded-full text-xs font-semibold">
                {recipe.mealType} • {recipe.difficulty}
              </span>
              <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3 py-1 rounded-full text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Prep {recipe.prepTimeMinutes}m • Cook {recipe.cookTimeMinutes}m</span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h1 className="text-2xl font-black text-[#1C1C1E] dark:text-[#F2F2F7] md:text-white tracking-tight">
              {recipe.title}
            </h1>
            <p className="text-sm text-[#8E8E93] dark:text-[#98989D] md:text-blue-100/80 mt-1.5 leading-relaxed">
              {recipe.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium bg-neutral-200/70 dark:bg-neutral-800/80 md:bg-white/15 text-neutral-700 dark:text-neutral-300 md:text-white px-2.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Servings Scaler (iOS Stepper) */}
          <div className="bg-white dark:bg-[#1C1C1E] md:bg-white/10 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] md:border-white/15 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] md:text-blue-100/70 font-bold">
                Servings
              </span>
              <p className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] md:text-white">
                {servings} {servings === 1 ? 'portion' : 'portions'}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 md:bg-white/10 px-3 py-1.5 rounded-full">
              <button
                id="serving-minus-btn"
                onClick={() => handleServingChange(-1)}
                disabled={servings <= 1}
                className="w-7 h-7 rounded-full bg-white dark:bg-neutral-700 md:bg-white/90 shadow-xs flex items-center justify-center text-neutral-700 dark:text-neutral-200 md:text-[#1E3A8A] disabled:opacity-40 active:scale-90 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-bold text-sm text-[#1C1C1E] dark:text-[#F2F2F7] md:text-white">
                {servings}
              </span>
              <button
                id="serving-plus-btn"
                onClick={() => handleServingChange(1)}
                disabled={servings >= 12}
                className="w-7 h-7 rounded-full bg-white dark:bg-neutral-700 md:bg-white/90 shadow-xs flex items-center justify-center text-neutral-700 dark:text-neutral-200 md:text-[#1E3A8A] disabled:opacity-40 active:scale-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Macros Dashboard */}
          <div className="bg-white dark:bg-[#1C1C1E] md:bg-white/10 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] md:border-white/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] md:text-blue-100/70 font-bold">
                Nutrition & Macros
              </span>
              <span className="text-xs text-neutral-400 md:text-blue-100/60">Total for {servings} {servings === 1 ? 'serving' : 'servings'}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Calories */}
              <div className="bg-orange-50 dark:bg-orange-950/30 p-2.5 rounded-xl border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                  Kcal
                </span>
                <span className="text-base font-black text-orange-700 dark:text-orange-300">
                  {scaledCalories}
                </span>
              </div>

              {/* Protein */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Protein
                </span>
                <span className="text-base font-black text-blue-700 dark:text-blue-300">
                  {scaledProtein}g
                </span>
              </div>

              {/* Carbs */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Carbs
                </span>
                <span className="text-base font-black text-amber-700 dark:text-amber-300">
                  {scaledCarbs}g
                </span>
              </div>

              {/* Fat */}
              <div className="bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  Fat
                </span>
                <span className="text-base font-black text-rose-700 dark:text-rose-300">
                  {scaledFat}g
                </span>
              </div>
            </div>
          </div>

          {/* Steps Overview */}
          <div className="bg-white dark:bg-[#1C1C1E] md:bg-white/10 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] md:border-white/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] md:text-blue-100/70 font-bold">
                Cooking Steps ({recipe.steps.length})
              </span>
            </div>

            <div className="space-y-4">
              {recipe.steps.map((step) => (
                <div key={step.stepNumber} className="flex gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#1E3A8A]/10 md:bg-white/15 text-[#1E3A8A] dark:text-[#5B8DEF] md:text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] md:text-white">
                        {step.title}
                      </h4>
                      {step.durationMinutes && (
                        <span className="text-xs text-neutral-400 md:text-blue-100/70 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {step.durationMinutes}m
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8E93] dark:text-[#98989D] md:text-blue-100/80 mt-1 leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.tip && (
                      <div className="mt-2 text-[11px] p-2 bg-amber-50 dark:bg-amber-950/30 md:bg-white/10 text-amber-800 dark:text-amber-300 md:text-amber-200 rounded-xl border border-amber-200/50 md:border-white/15">
                        💡 <strong className="font-semibold">Chef's Tip:</strong> {step.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (1/3 on desktop): Ingredients — white background, own scroll */}
        <div className="overflow-y-auto ios-scroll px-5 pb-28 md:pb-6 space-y-5 md:w-1/3 md:bg-white md:px-5 md:pt-5 md:border-l md:border-black/[0.06]">
          {/* Ingredients Section */}
          <div className="bg-white dark:bg-[#1C1C1E] md:bg-transparent p-4 md:p-0 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] md:border-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] font-bold">
                Ingredients ({recipe.ingredients.length})
              </span>
              <span className="text-[11px] text-[#8E8E93] dark:text-[#98989D]">
                Tap to check off
              </span>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const items = recipe.ingredients.filter((i) => i.category === cat);
                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      {cat}
                    </h4>
                    <div className="space-y-1.5">
                      {items.map((ing) => {
                        const isChecked = checkedIngredients[ing.id];
                        const scaledAmount = Math.round((ing.amount * scale) * 10) / 10;
                        return (
                          <div
                            key={ing.id}
                            id={`ingredient-row-${ing.id}`}
                            onClick={() => toggleIngredientCheck(ing.id)}
                            className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition ${
                              isChecked
                                ? 'bg-neutral-100 dark:bg-neutral-800/40 opacity-50'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 shrink-0" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  isChecked
                                    ? 'line-through text-neutral-400'
                                    : 'text-[#1C1C1E] dark:text-[#F2F2F7]'
                                }`}
                              >
                                {ing.name}
                                {ing.notes && (
                                  <span className="text-neutral-400 font-normal ml-1">
                                    ({ing.notes})
                                  </span>
                                )}
                              </span>
                            </div>

                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                              {scaledAmount} {ing.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        {/* Floating Bottom Action: Start Cooking */}
        <div className="absolute bottom-0 left-0 right-0 md:left-auto md:w-1/3 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#1c1c1e] dark:via-[#1c1c1e]/95 md:dark:from-white md:dark:via-white/95">
          <button
            id="start-cooking-mode-btn"
            onClick={() => {
              haptics.tap();
              onStartCooking(recipe, servings);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-[#16306E] active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-[#1E3A8A]/30 flex items-center justify-center gap-2 transition"
          >
            <ChefHat className="w-5 h-5" />
            <span>Start Cooking ({recipe.steps.length} Steps)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
