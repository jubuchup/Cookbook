import React, { useState, useMemo } from 'react';
import { Check, Sparkles, Utensils, ArrowRight } from 'lucide-react';
import { Recipe } from '../types';
import { haptics } from '../hooks/useHaptics';

interface FridgeIngredientViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
}

const COMMON_PANTRY_ITEMS = [
  // Proteins & Seafood
  { name: 'Salmon Fillets', category: 'Proteins' },
  { name: 'Chicken Breast', category: 'Proteins' },
  { name: 'Ground Beef', category: 'Proteins' },
  { name: 'Raw Jumbo Shrimp', category: 'Proteins' },
  { name: 'Eggs', category: 'Proteins' },
  { name: 'Extra Firm Tofu', category: 'Proteins' },

  // Produce
  { name: 'Ripe Avocado', category: 'Produce' },
  { name: 'Garlic', category: 'Produce' },
  { name: 'Baby Spinach', category: 'Produce' },
  { name: 'Cherry Tomatoes', category: 'Produce' },
  { name: 'Red Bell Pepper', category: 'Produce' },
  { name: 'Persian Cucumber', category: 'Produce' },
  { name: 'Fresh Blueberries', category: 'Produce' },

  // Dairy & Staples
  { name: '0% Plain Greek Yogurt', category: 'Dairy' },
  { name: 'Feta Cheese', category: 'Dairy' },
  { name: 'Parmesan Cheese', category: 'Dairy' },
  { name: 'Heavy Cream', category: 'Dairy' },
  { name: 'Whole Milk', category: 'Dairy' },
  { name: 'Dark Chocolate', category: 'Pantry' },
  { name: 'Quinoa', category: 'Pantry' },
  { name: 'Sourdough Bread', category: 'Pantry' },
  { name: 'Pappardelle Pasta', category: 'Pantry' },
  { name: 'Chia Seeds', category: 'Pantry' },
  { name: 'Coconut Milk', category: 'Pantry' },
];

export const FridgeIngredientView: React.FC<FridgeIngredientViewProps> = ({
  recipes,
  onSelectRecipe,
}) => {
  const [selectedInFridge, setSelectedInFridge] = useState<string[]>([
    'Eggs',
    'Garlic',
    'Ripe Avocado',
    'Sourdough Bread',
  ]);

  const toggleItem = (name: string) => {
    haptics.tap();
    setSelectedInFridge((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  // Rank recipes by how many ingredients match
  const rankedRecipes = useMemo(() => {
    const fridgeLower = selectedInFridge.map((i) => i.toLowerCase());

    return recipes
      .map((r) => {
        const total = r.ingredients.length;
        const matched = r.ingredients.filter((ing) =>
          fridgeLower.some((f) => ing.name.toLowerCase().includes(f) || f.includes(ing.name.toLowerCase()))
        ).length;
        const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
        return { recipe: r, matched, total, pct };
      })
      .sort((a, b) => b.pct - a.pct || b.matched - a.matched);
  }, [recipes, selectedInFridge]);

  const categories = ['Proteins', 'Produce', 'Dairy', 'Pantry'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Intro Header */}
      <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-black/[0.05] dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2 text-[#FF3B30] mb-1 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Pantry & Fridge Chef</span>
        </div>
        <h2 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight">
          What ingredients do you have?
        </h2>
        <p className="text-xs text-[#8E8E93] dark:text-[#98989D] mt-1 leading-relaxed">
          Tap the ingredients sitting on your counter or in your fridge to discover which recipes you can whip up right now.
        </p>

        {/* Selected count badge */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {selectedInFridge.length} items checked in your kitchen
          </span>
          {selectedInFridge.length > 0 && (
            <button
              onClick={() => setSelectedInFridge([])}
              className="text-xs text-[#FF3B30] font-bold"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Ingredient Checkboxes by category */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = COMMON_PANTRY_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat} className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D] px-1">
                {cat}
              </span>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const isChecked = selectedInFridge.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleItem(item.name)}
                      className={`py-2 px-3 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isChecked
                          ? 'bg-[#FF3B30] text-white shadow-xs'
                          : 'bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matching Recipes Results */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            Matched Recipes ({rankedRecipes.filter((r) => r.matched > 0).length})
          </span>
          <span className="text-xs text-neutral-400">Sorted by match %</span>
        </div>

        <div className="space-y-2.5">
          {rankedRecipes.map(({ recipe, matched, total, pct }) => (
            <div
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="bg-white dark:bg-[#1C1C1E] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] flex items-center gap-3.5 cursor-pointer active:scale-[0.98] transition hover:shadow-xs"
            >
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                    {recipe.title}
                  </h4>
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      pct >= 80
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : pct >= 40
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {pct}% Match
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  <span>{recipe.mealType}</span>
                  <span>•</span>
                  <span>{recipe.prepTimeMinutes}m prep</span>
                  <span>•</span>
                  <span>{recipe.calories} kcal</span>
                </div>

                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-neutral-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
