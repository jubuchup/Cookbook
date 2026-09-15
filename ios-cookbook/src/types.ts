export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type IngredientCategory = 
  | 'Produce'
  | 'Meat & Poultry'
  | 'Seafood'
  | 'Dairy & Eggs'
  | 'Pantry & Grains'
  | 'Spices & Oils';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  notes?: string;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

export interface Macros {
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  fiber?: number;  // in grams
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  mealType: MealType;
  difficulty: Difficulty;
  calories: number; // kcal per serving
  macros: Macros;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  mealType: MealType | 'All';
  maxPrepTime: number | null; // minutes or null for any
  selectedIngredients: string[];
  sortBy: 'default' | 'calories_asc' | 'calories_desc' | 'protein_desc' | 'prep_asc';
  onlyFavorites: boolean;
}
