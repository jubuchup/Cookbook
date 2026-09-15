import { Recipe } from '../types';
import { supabase } from './supabaseClient';

// This file talks directly to the Supabase `recipes` table from the
// browser using the public anon key (see supabaseClient.ts) — there is no
// backend/API layer in this phase. The Recipe type used throughout the UI
// is camelCase; the Supabase table uses snake_case column names (extended
// per docs/supabase-schema-migration.sql), so this module maps between the
// two shapes at the boundary.

// Shape of a row as it comes back from/goes to Supabase.
interface RecipeRow {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
  description: string | null;
  image_url: string | null;
  difficulty: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  ingredients: Recipe['ingredients'] | null;
  steps: Recipe['steps'] | null;
  notes: string | null;
  total_kcal: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  fiber: number | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  owner_email: string | null;
  visibility: string | null;
  created_at: string;
}

function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    prepTimeMinutes: row.prep_time_minutes ?? 0,
    cookTimeMinutes: row.cook_time_minutes ?? 0,
    servings: row.servings ?? 1,
    mealType: (row.category as Recipe['mealType']) ?? 'Dinner',
    difficulty: (row.difficulty as Recipe['difficulty']) ?? 'Easy',
    calories: row.total_kcal ?? 0,
    macros: {
      protein: row.total_protein ?? 0,
      carbs: row.total_carbs ?? 0,
      fat: row.total_fat ?? 0,
      fiber: row.fiber ?? undefined,
    },
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    isFavorite: row.is_favorite ?? false,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

// Partial<Recipe> -> partial row, used for both create and update.
function recipeToRow(recipe: Partial<Recipe>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (recipe.title !== undefined) row.name = recipe.title;
  if (recipe.description !== undefined) row.description = recipe.description;
  if (recipe.imageUrl !== undefined) row.image_url = recipe.imageUrl;
  if (recipe.mealType !== undefined) row.category = recipe.mealType;
  if (recipe.difficulty !== undefined) row.difficulty = recipe.difficulty;
  if (recipe.servings !== undefined) row.servings = recipe.servings;
  if (recipe.prepTimeMinutes !== undefined) row.prep_time_minutes = recipe.prepTimeMinutes;
  if (recipe.cookTimeMinutes !== undefined) row.cook_time_minutes = recipe.cookTimeMinutes;
  if (recipe.ingredients !== undefined) row.ingredients = recipe.ingredients;
  if (recipe.steps !== undefined) row.steps = recipe.steps;
  if (recipe.calories !== undefined) row.total_kcal = recipe.calories;
  if (recipe.macros?.protein !== undefined) row.total_protein = recipe.macros.protein;
  if (recipe.macros?.carbs !== undefined) row.total_carbs = recipe.macros.carbs;
  if (recipe.macros?.fat !== undefined) row.total_fat = recipe.macros.fat;
  if (recipe.macros?.fiber !== undefined) row.fiber = recipe.macros.fiber;
  if (recipe.tags !== undefined) row.tags = recipe.tags;
  if (recipe.isFavorite !== undefined) row.is_favorite = recipe.isFavorite;
  return row;
}

const ROW_SELECT =
  'id,name,category,status,description,image_url,difficulty,servings,prep_time_minutes,cook_time_minutes,ingredients,steps,notes,total_kcal,total_protein,total_carbs,total_fat,fiber,tags,is_favorite,owner_email,visibility,created_at';

export async function fetchRecipes(params?: {
  search?: string;
  mealType?: string;
  maxPrepTime?: number | null;
  ingredient?: string;
  favorites?: boolean;
}): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select(ROW_SELECT)
    .order('created_at', { ascending: false });

  if (params?.mealType && params.mealType !== 'All') {
    query = query.ilike('category', params.mealType);
  }
  if (params?.maxPrepTime) {
    query = query.lte('prep_time_minutes', params.maxPrepTime);
  }
  if (params?.favorites) {
    query = query.eq('is_favorite', true);
  }
  if (params?.search) {
    // Simple search across title/description; ingredient/tag text search
    // inside jsonb/array columns is left to client-side filtering in App.tsx.
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase error fetching recipes:', error);
    throw error;
  }
  return (data as RecipeRow[]).map(rowToRecipe);
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
  const row = recipeToRow(recipe);
  const { data, error } = await supabase
    .from('recipes')
    .insert(row)
    .select(ROW_SELECT)
    .single();

  if (error) {
    console.error('Supabase error creating recipe:', error);
    throw error;
  }
  return rowToRecipe(data as RecipeRow);
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
  const row = recipeToRow(updates);
  const { data, error } = await supabase
    .from('recipes')
    .update(row)
    .eq('id', id)
    .select(ROW_SELECT)
    .single();

  if (error) {
    console.error('Supabase error updating recipe:', error);
    throw error;
  }
  return rowToRecipe(data as RecipeRow);
}

export async function toggleFavorite(id: string): Promise<Recipe> {
  // Read current value first since Supabase doesn't support "toggle" server-side.
  const { data: current, error: fetchError } = await supabase
    .from('recipes')
    .select('is_favorite')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Supabase error reading favorite state:', fetchError);
    throw fetchError;
  }

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_favorite: !current.is_favorite })
    .eq('id', id)
    .select(ROW_SELECT)
    .single();

  if (error) {
    console.error('Supabase error toggling favorite:', error);
    throw error;
  }
  return rowToRecipe(data as RecipeRow);
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) {
    console.error('Supabase error deleting recipe:', error);
    throw error;
  }
}
