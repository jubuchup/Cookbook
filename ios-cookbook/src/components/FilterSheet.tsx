import React, { useState } from 'react';
import { X, Clock, Check, RotateCcw, Utensils } from 'lucide-react';
import { FilterState, MealType } from '../types';
import { haptics } from '../hooks/useHaptics';

interface FilterSheetProps {
  filters: FilterState;
  allAvailableIngredients: string[];
  totalMatchesCount: number;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  filters,
  allAvailableIngredients,
  totalMatchesCount,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>({ ...filters });
  const [ingredientSearch, setIngredientSearch] = useState('');

  const mealTypes: (MealType | 'All')[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
  const prepTimeOptions = [
    { label: 'Any', value: null },
    { label: '≤ 10m', value: 10 },
    { label: '≤ 15m', value: 15 },
    { label: '≤ 20m', value: 20 },
    { label: '≤ 30m', value: 30 },
  ];

  const handleToggleIngredient = (name: string) => {
    haptics.tap();
    const current = [...localFilters.selectedIngredients];
    const idx = current.indexOf(name);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(name);
    }
    setLocalFilters({ ...localFilters, selectedIngredients: current });
  };

  const handleReset = () => {
    haptics.tap();
    setLocalFilters({
      searchQuery: '',
      mealType: 'All',
      maxPrepTime: null,
      selectedIngredients: [],
      sortBy: 'default',
      onlyFavorites: false,
    });
  };

  const handleSave = () => {
    haptics.tap();
    onApply(localFilters);
    onClose();
  };

  const filteredIngredientSuggestions = allAvailableIngredients.filter((ing) =>
    ing.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-auto bg-[#F5F6F8] dark:bg-[#1C1C1E] rounded-t-[32px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Pull handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <button
            id="reset-filter-btn"
            onClick={handleReset}
            className="text-xs font-semibold text-[#1E3A8A] dark:text-[#5B8DEF] flex items-center gap-1 active:opacity-60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <span className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            Filter Recipes
          </span>

          <button
            id="close-filter-btn"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-200/80 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filter Options */}
        <div className="overflow-y-auto ios-scroll p-5 space-y-6">
          {/* Meal Type Option */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
              Meal Type
            </span>
            <div className="grid grid-cols-3 gap-2">
              {mealTypes.map((mt) => {
                const isSelected = localFilters.mealType === mt;
                return (
                  <button
                    key={mt}
                    onClick={() => {
                      haptics.tap();
                      setLocalFilters({ ...localFilters, mealType: mt });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition active:scale-95 text-center ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.05] dark:border-white/[0.08]'
                    }`}
                  >
                    {mt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prep Time Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                Max Prep Time
              </span>
              {localFilters.maxPrepTime && (
                <span className="text-xs font-semibold text-[#1E3A8A]">
                  Within {localFilters.maxPrepTime} mins
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {prepTimeOptions.map((opt) => {
                const isSelected = localFilters.maxPrepTime === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      haptics.tap();
                      setLocalFilters({ ...localFilters, maxPrepTime: opt.value });
                    }}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition active:scale-95 text-center ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.05] dark:border-white/[0.08]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
                Filter by Ingredients ({localFilters.selectedIngredients.length} selected)
              </span>
            </div>

            {/* Search ingredient */}
            <input
              type="text"
              placeholder="Search ingredient (e.g. Salmon, Avocado, Eggs)..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] focus:outline-hidden focus:ring-1 focus:ring-[#1E3A8A]"
            />

            {/* Selected Pills */}
            {localFilters.selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {localFilters.selectedIngredients.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleToggleIngredient(name)}
                    className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-[#1E3A8A] text-white shadow-xs"
                  >
                    <span>{name}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Suggested Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
              {filteredIngredientSuggestions.map((ing) => {
                const isSelected = localFilters.selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    onClick={() => handleToggleIngredient(ing)}
                    className={`py-1 px-2.5 rounded-full text-xs font-medium transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08] hover:bg-neutral-50'
                    }`}
                  >
                    {ing}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#98989D]">
              Sort By
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'default', label: 'Featured' },
                { id: 'prep_asc', label: 'Quickest Prep' },
                { id: 'calories_asc', label: 'Lowest Calories' },
                { id: 'protein_desc', label: 'Highest Protein' },
              ].map((s) => {
                const isSelected = localFilters.sortBy === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      haptics.tap();
                      setLocalFilters({ ...localFilters, sortBy: s.id as any });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-[#1C1C1E] dark:text-[#F2F2F7] border border-black/[0.05] dark:border-white/[0.08]'
                    }`}
                  >
                    <span>{s.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Apply Bar */}
        <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            id="apply-filter-btn"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-[#1E3A8A] text-white font-bold text-sm shadow-md active:scale-[0.98] transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
