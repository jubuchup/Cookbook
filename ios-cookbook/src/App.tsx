import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  BookOpen,
  RefreshCw,
  X,
} from 'lucide-react';
import { Recipe, FilterState, MealType } from './types';
import { fetchRecipes, createRecipe, updateRecipe, toggleFavorite, deleteRecipe } from './services/recipeApi';
import { IOSTabBar, TabType } from './components/IOSTabBar';
import { Sidebar } from './components/Sidebar';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookingModeModal } from './components/CookingModeModal';
import { FilterSheet } from './components/FilterSheet';
import { AddRecipeModal } from './components/AddRecipeModal';
import { FridgeIngredientView } from './components/FridgeIngredientView';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { haptics } from './hooks/useHaptics';

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('cookbook');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingState, setCookingState] = useState<{ recipe: Recipe; servings: number } | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    mealType: 'All',
    maxPrepTime: null,
    selectedIngredients: [],
    sortBy: 'default',
    onlyFavorites: false,
  });

  // Load recipes from server database
  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Tab changes
  const handleSelectTab = (tab: TabType) => {
    if (tab === 'add') {
      setShowAddModal(true);
    } else {
      setCurrentTab(tab);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic UI update
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
    try {
      await toggleFavorite(id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Add new recipe
  const handleCreateRecipe = async (newRecipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    try {
      const created = await createRecipe(newRecipeData);
      setRecipes((prev) => [created, ...prev]);
      setCurrentTab('cookbook');
    } catch (err) {
      console.error('Failed to create recipe:', err);
    }
  };

  // Delete recipe
  const handleDeleteRecipe = async (id: string) => {
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecipe && selectedRecipe.id === id) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  // Extract all unique ingredients from database for filter suggestions
  const allAvailableIngredients = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.ingredients.forEach((i) => set.add(i.name)));
    return Array.from(set).sort();
  }, [recipes]);

  // Compute filtered & sorted recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesTags = recipe.tags.some((t) => t.toLowerCase().includes(q));
        const matchesIng = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesIng) {
          return false;
        }
      }

      // Meal Type
      if (filters.mealType !== 'All' && recipe.mealType.toLowerCase() !== filters.mealType.toLowerCase()) {
        return false;
      }

      // Max Prep Time
      if (filters.maxPrepTime !== null && recipe.prepTimeMinutes > filters.maxPrepTime) {
        return false;
      }

      // Selected Ingredients
      if (filters.selectedIngredients.length > 0) {
        const recipeIngs = recipe.ingredients.map((i) => i.name.toLowerCase());
        const hasAny = filters.selectedIngredients.some((sel) =>
          recipeIngs.some((ing) => ing.includes(sel.toLowerCase()) || sel.toLowerCase().includes(ing))
        );
        if (!hasAny) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'prep_asc') {
        return a.prepTimeMinutes - b.prepTimeMinutes;
      }
      if (filters.sortBy === 'calories_asc') {
        return a.calories - b.calories;
      }
      if (filters.sortBy === 'calories_desc') {
        return b.calories - a.calories;
      }
      if (filters.sortBy === 'protein_desc') {
        return b.macros.protein - a.macros.protein;
      }
      return 0;
    });
  }, [recipes, currentTab, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.mealType !== 'All') count++;
    if (filters.maxPrepTime !== null) count++;
    if (filters.selectedIngredients.length > 0) count += filters.selectedIngredients.length;
    if (filters.sortBy !== 'default') count++;
    return count;
  }, [filters]);

  const mealTypes: (MealType | 'All')[] = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

  return (
    <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#0B1220] font-sans antialiased md:flex">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onAddRecipe={() => setShowAddModal(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 min-h-screen flex flex-col md:max-w-4xl md:mx-auto md:w-full">
        {/* Top App Header */}
        <div className="px-5 md:px-8 pt-6 pb-3 flex items-center justify-between">
          <div className="md:hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A] dark:text-[#5B8DEF]">
              Personal Kitchen
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight">
              {currentTab === 'cookbook' ? 'Cookbook' : 'Pantry Chef'}
            </h1>
          </div>
          <h2 className="hidden md:block text-xl font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {currentTab === 'cookbook' ? 'All Recipes' : 'Pantry Chef'}
          </h2>

          <div className="flex items-center gap-2 md:hidden">
            <button
              id="open-add-recipe-top-btn"
              onClick={() => {
                haptics.tap();
                setShowAddModal(true);
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1C1C1E] shadow-xs border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#1E3A8A] dark:text-[#5B8DEF] active:scale-90 transition"
              title="Add New Recipe"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* PWA In-App Install Prompt */}
        <PWAInstallPrompt />

        {/* Search Bar & Filter Button (Only on regular tabs, not Fridge tab) */}
        {currentTab !== 'fridge' && (
          <div className="px-5 md:px-8 pb-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                id="recipe-search-input"
                type="text"
                placeholder="Search recipes, tags, ingredients..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/30 shadow-xs"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              id="open-filters-btn"
              onClick={() => {
                haptics.tap();
                setShowFilterSheet(true);
              }}
              className={`p-2.5 rounded-2xl border transition active:scale-90 relative ${
                activeFiltersCount > 0
                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Meal Type Quick Carousel (Segmented/Pills) */}
        {currentTab === 'cookbook' && (
          <div className="px-5 md:px-8 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {mealTypes.map((mt) => {
                const isSelected = filters.mealType === mt;
                return (
                  <button
                    key={mt}
                    onClick={() => {
                      haptics.tap();
                      setFilters({ ...filters, mealType: mt });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-300 border border-black/[0.05] dark:border-white/[0.08]'
                    }`}
                  >
                    {mt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filters Pill Bar (if any filters active) */}
        {activeFiltersCount > 0 && (
          <div className="px-5 md:px-8 pb-2 flex items-center justify-between text-xs text-[#1E3A8A] dark:text-[#5B8DEF] font-medium">
            <span>
              {filteredRecipes.length} of {recipes.length} recipes matched
            </span>
            <button
              id="clear-all-filters-btn"
              onClick={() => {
                haptics.tap();
                setFilters({
                  searchQuery: '',
                  mealType: 'All',
                  maxPrepTime: null,
                  selectedIngredients: [],
                  sortBy: 'default',
                  onlyFavorites: false,
                });
              }}
              className="text-xs font-bold underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Main Scroll Area */}
        <div className="flex-1 overflow-y-auto ios-scroll px-5 md:px-8 pb-28 md:pb-10 pt-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] dark:text-[#5B8DEF]" />
              <span className="text-xs font-medium">Opening your cookbook database...</span>
            </div>
          ) : currentTab === 'fridge' ? (
            /* Fridge Ingredient Matching View */
            <FridgeIngredientView
              recipes={recipes}
              onSelectRecipe={(r) => {
                setSelectedRecipe(r);
              }}
            />
          ) : filteredRecipes.length > 0 ? (
            /* Recipes Grid */
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={(r) => setSelectedRecipe(r)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                No Recipes Match Your Filter
              </h3>
              <p className="text-xs text-[#8E8E93] dark:text-[#98989D] max-w-xs mx-auto leading-relaxed">
                Try relaxing your ingredient, meal type, or prep time filters to see more dishes.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      mealType: 'All',
                      maxPrepTime: null,
                      selectedIngredients: [],
                      sortBy: 'default',
                      onlyFavorites: false,
                    })
                  }
                  className="px-4 py-2 rounded-full bg-[#1E3A8A] text-white text-xs font-bold shadow-xs active:scale-95 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* iOS Frosted Bottom Tab Bar */}
        <IOSTabBar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
        />

        {/* Recipe Detail Modal Sheet */}
        {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onToggleFavorite={handleToggleFavorite}
            onStartCooking={(recipe, servings) => {
              setSelectedRecipe(null);
              setCookingState({ recipe, servings });
            }}
            onDeleteRecipe={handleDeleteRecipe}
          />
        )}

        {/* Interactive Cooking Mode Modal */}
        {cookingState && (
          <CookingModeModal
            recipe={cookingState.recipe}
            servings={cookingState.servings}
            onClose={() => setCookingState(null)}
          />
        )}

        {/* Filter Sheet Modal */}
        {showFilterSheet && (
          <FilterSheet
            filters={filters}
            allAvailableIngredients={allAvailableIngredients}
            totalMatchesCount={filteredRecipes.length}
            onApply={(newFilters) => setFilters(newFilters)}
            onClose={() => setShowFilterSheet(false)}
          />
        )}

        {/* Add Recipe Modal */}
        {showAddModal && (
          <AddRecipeModal
            onClose={() => setShowAddModal(false)}
            onSave={handleCreateRecipe}
          />
        )}
      </div>
    </div>
  );
}
