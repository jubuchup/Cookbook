import React, { useState } from 'react';
import { X, Plus, Trash2, Camera, Sparkles, Check, ClipboardPaste, Copy, AlertCircle } from 'lucide-react';
import { Recipe, MealType, Difficulty, Ingredient, RecipeStep, IngredientCategory } from '../types';
import { haptics } from '../hooks/useHaptics';

interface AddRecipeModalProps {
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
}

// Prompt template the user copies into a free chat UI (ChatGPT/Claude web
// app) along with a recipe or URL. The chat produces JSON matching this
// exact shape, which the "Paste Recipe JSON" tab below parses directly —
// no AI API call is ever made by this app itself.
const AI_PROMPT_TEMPLATE = `Turn the following recipe (or the recipe at this URL) into a single JSON object with exactly this shape — no markdown fences, no extra commentary, just the raw JSON object:

{
  "title": string,
  "description": string,
  "imageUrl": string (a public image URL, or leave as ""),
  "mealType": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert",
  "difficulty": "Easy" | "Medium" | "Hard",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "calories": number (kcal per serving),
  "macros": { "protein": number, "carbs": number, "fat": number, "fiber": number },
  "ingredients": [
    { "name": string, "amount": number, "unit": string, "category": "Produce" | "Meat & Poultry" | "Seafood" | "Dairy & Eggs" | "Pantry & Grains" | "Spices & Oils", "notes": string }
  ],
  "steps": [
    { "title": string, "instruction": string, "durationMinutes": number, "tip": string }
  ],
  "tags": [string]
}

Recipe / URL:
`;

const PRESET_PHOTOS = [
  { name: 'Avocado Toast', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Salmon', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Healthy Bowl', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Curry', url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=80' },
];

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ onClose, onSave }) => {
  const [mode, setMode] = useState<'manual' | 'paste'>('manual');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_PHOTOS[0].url);
  const [mealType, setMealType] = useState<MealType>('Dinner');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(15);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(20);
  const [servings, setServings] = useState(2);
  const [calories, setCalories] = useState(450);
  const [protein, setProtein] = useState(30);
  const [carbs, setCarbs] = useState(35);
  const [fat, setFat] = useState(15);
  const [tagsStr, setTagsStr] = useState('High Protein, Quick');

  // Ingredients builder
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: 'i-1', name: 'Fresh Salmon Fillet', amount: 300, unit: 'g', category: 'Seafood' },
    { id: 'i-2', name: 'Olive Oil', amount: 1, unit: 'tbsp', category: 'Spices & Oils' },
    { id: 'i-3', name: 'Garlic', amount: 2, unit: 'cloves', category: 'Produce' },
  ]);

  // Steps builder
  const [steps, setSteps] = useState<RecipeStep[]>([
    { stepNumber: 1, title: 'Prep Ingredients', instruction: 'Rinse and dry salmon. Mince garlic.', durationMinutes: 5 },
    { stepNumber: 2, title: 'Cook', instruction: 'Heat olive oil in pan and sear for 4 minutes per side.', durationMinutes: 8 },
  ]);

  const addIngredient = () => {
    haptics.tap();
    setIngredients((prev) => [
      ...prev,
      { id: `i-${Date.now()}`, name: '', amount: 1, unit: 'piece', category: 'Produce' },
    ]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, val: any) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeIngredient = (index: number) => {
    haptics.tap();
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addStep = () => {
    haptics.tap();
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        title: `Step ${prev.length + 1}`,
        instruction: '',
        durationMinutes: 5,
      },
    ]);
  };

  const updateStep = (index: number, field: keyof RecipeStep, val: any) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeStep = (index: number) => {
    haptics.tap();
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    haptics.success();
    const cleanTags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      description: description.trim() || 'A delicious homemade recipe.',
      imageUrl: imageUrl.trim() || PRESET_PHOTOS[0].url,
      mealType,
      difficulty,
      prepTimeMinutes: Number(prepTimeMinutes) || 10,
      cookTimeMinutes: Number(cookTimeMinutes) || 15,
      servings: Number(servings) || 2,
      calories: Number(calories) || 400,
      macros: {
        protein: Number(protein) || 25,
        carbs: Number(carbs) || 30,
        fat: Number(fat) || 15,
      },
      ingredients: ingredients.filter((i) => i.name.trim() !== ''),
      steps: steps.filter((s) => s.instruction.trim() !== ''),
      isFavorite: false,
      tags: cleanTags,
    });
    onClose();
  };

  const handleCopyPrompt = async () => {
    haptics.tap();
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // clipboard API unavailable; user can still select the text manually
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasteError(null);

    let parsed: any;
    try {
      parsed = JSON.parse(pasteText.trim());
    } catch {
      setPasteError('That doesn\'t look like valid JSON. Make sure you pasted the whole object the chat gave you, with no extra text before/after it.');
      return;
    }

    if (!parsed.title || typeof parsed.title !== 'string') {
      setPasteError('Missing required field "title".');
      return;
    }

    haptics.success();

    const parsedIngredients: Ingredient[] = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((ing: any, idx: number) => ({
          id: `i-${Date.now()}-${idx}`,
          name: String(ing.name ?? ''),
          amount: Number(ing.amount) || 0,
          unit: String(ing.unit ?? ''),
          category: (ing.category as IngredientCategory) ?? 'Pantry & Grains',
          notes: ing.notes ? String(ing.notes) : undefined,
        }))
      : [];

    const parsedSteps: RecipeStep[] = Array.isArray(parsed.steps)
      ? parsed.steps.map((s: any, idx: number) => ({
          stepNumber: idx + 1,
          title: String(s.title ?? `Step ${idx + 1}`),
          instruction: String(s.instruction ?? ''),
          durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : undefined,
          tip: s.tip ? String(s.tip) : undefined,
        }))
      : [];

    onSave({
      title: String(parsed.title).trim(),
      description: String(parsed.description ?? 'A delicious homemade recipe.'),
      imageUrl: String(parsed.imageUrl ?? '') || PRESET_PHOTOS[0].url,
      mealType: (parsed.mealType as MealType) ?? 'Dinner',
      difficulty: (parsed.difficulty as Difficulty) ?? 'Easy',
      prepTimeMinutes: Number(parsed.prepTimeMinutes) || 10,
      cookTimeMinutes: Number(parsed.cookTimeMinutes) || 15,
      servings: Number(parsed.servings) || 2,
      calories: Number(parsed.calories) || 400,
      macros: {
        protein: Number(parsed.macros?.protein) || 0,
        carbs: Number(parsed.macros?.carbs) || 0,
        fat: Number(parsed.macros?.fat) || 0,
        fiber: parsed.macros?.fiber !== undefined ? Number(parsed.macros.fiber) : undefined,
      },
      ingredients: parsedIngredients,
      steps: parsedSteps,
      isFavorite: false,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-auto bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[32px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Pull handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Cancel
          </button>
          <h2 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            New Recipe
          </h2>
          {mode === 'manual' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="text-xs font-bold text-[#FF3B30] disabled:opacity-40"
            >
              Save
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="text-xs font-bold text-[#FF3B30] disabled:opacity-40"
            >
              Create
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-1">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setMode('manual');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'manual'
                ? 'bg-[#FF3B30] text-white shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-black/[0.06] dark:border-white/[0.08]'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              setMode('paste');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              mode === 'paste'
                ? 'bg-[#FF3B30] text-white shadow-xs'
                : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border border-black/[0.06] dark:border-white/[0.08]'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Paste from AI Chat
          </button>
        </div>

        {mode === 'paste' ? (
          /* Paste Recipe JSON Flow */
          <div className="overflow-y-auto ios-scroll p-5 space-y-4 pb-24">
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-[#FF3B30] font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Step 1 — Get the JSON from a chat AI</span>
              </div>
              <p className="text-xs text-[#8E8E93] dark:text-[#98989D] leading-relaxed">
                Copy this prompt, paste it into ChatGPT, Claude, or another free chat app along with a recipe or a link to one, then copy the JSON it gives back.
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition"
              >
                {promptCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Prompt Template
                  </>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center gap-2 text-[#FF3B30] font-bold text-xs uppercase tracking-wider">
                <ClipboardPaste className="w-4 h-4" />
                <span>Step 2 — Paste the JSON here</span>
              </div>
              <textarea
                rows={10}
                placeholder='{"title": "...", "ingredients": [...], "steps": [...], ...}'
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setPasteError(null);
                }}
                className="w-full text-xs font-mono p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
              />
              {pasteError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pasteError}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="w-full py-4 rounded-2xl bg-[#FF3B30] text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-40 transition"
              >
                Create Recipe from Pasted JSON
              </button>
            </div>
          </div>
        ) : (
        /* Scrollable Form */
        <form onSubmit={handleSubmit} className="overflow-y-auto ios-scroll p-5 space-y-6 pb-24">
          {/* Title & Description */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lemon Rosemary Roast Chicken"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1.5 focus:outline-hidden focus:border-[#FF3B30]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="A brief culinary note..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs text-[#1C1C1E] dark:text-[#F2F2F7] bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-1 focus:outline-hidden focus:border-[#FF3B30]"
              />
            </div>
          </div>

          {/* Photo Selection */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Recipe Photo
            </label>

            {/* Preview image */}
            <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
              <img src={imageUrl} alt="Recipe Preview" className="w-full h-full object-cover" />
            </div>

            {/* Preset photo pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-400 font-medium">Quick Photo Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      haptics.tap();
                      setImageUrl(p.url);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                      imageUrl === p.url
                        ? 'bg-[#FF3B30] text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="url"
              placeholder="Or paste custom image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
            />
          </div>

          {/* Meal Type & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="w-full text-xs font-semibold bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7] focus:outline-hidden"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
                <option value="Dessert">Dessert</option>
              </select>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full text-xs font-semibold bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7] focus:outline-hidden"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Prep (min)</span>
              <input
                type="number"
                min={1}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="w-full text-center text-base font-bold bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7]"
              />
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Cook (min)</span>
              <input
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="w-full text-center text-base font-bold bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7]"
              />
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] text-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Servings</span>
              <input
                type="number"
                min={1}
                max={12}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full text-center text-base font-bold bg-transparent text-[#1C1C1E] dark:text-[#F2F2F7]"
              />
            </div>
          </div>

          {/* Calories & Macros */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Nutrition per Serving
            </label>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-xl text-center">
                <span className="text-[9px] font-bold text-orange-600 uppercase block">Kcal</span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-orange-700 dark:text-orange-300 bg-transparent"
                />
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                <span className="text-[9px] font-bold text-blue-600 uppercase block">Protein (g)</span>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-blue-700 dark:text-blue-300 bg-transparent"
                />
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-center">
                <span className="text-[9px] font-bold text-amber-600 uppercase block">Carbs (g)</span>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-amber-700 dark:text-amber-300 bg-transparent"
                />
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-center">
                <span className="text-[9px] font-bold text-rose-600 uppercase block">Fat (g)</span>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full text-center font-bold text-sm text-rose-700 dark:text-rose-300 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Ingredients Builder */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Ingredients ({ingredients.length})
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-xs font-bold text-[#FF3B30] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient (e.g. Eggs)"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    className="flex-2 text-xs p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
                  />
                  <input
                    type="number"
                    placeholder="Amt"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                    className="w-16 text-xs p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="w-16 text-xs p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(idx)}
                    className="p-1.5 text-neutral-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Builder */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Cooking Steps ({steps.length})
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-xs font-bold text-[#FF3B30] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((s, idx) => (
                <div key={s.stepNumber} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF3B30]">Step {s.stepNumber}</span>
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="text-neutral-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Step Title (e.g. Sauté Veggies)"
                    value={s.title}
                    onChange={(e) => updateStep(idx, 'title', e.target.value)}
                    className="w-full text-xs font-medium p-2 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[#1C1C1E] dark:text-[#F2F2F7]"
                  />
                  <textarea
                    rows={2}
                    placeholder="Detailed cooking instructions..."
                    value={s.instruction}
                    onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-[#1C1C1E] dark:text-[#F2F2F7]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">Timer (min):</span>
                    <input
                      type="number"
                      min={0}
                      value={s.durationMinutes || 0}
                      onChange={(e) => updateStep(idx, 'durationMinutes', Number(e.target.value))}
                      className="w-16 text-xs p-1 rounded-md bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. High Protein, Keto, Meal Prep"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#1C1C1E] dark:text-[#F2F2F7]"
            />
          </div>

          <button
            type="submit"
            id="save-recipe-submit-btn"
            disabled={!title.trim()}
            className="w-full py-4 rounded-2xl bg-[#FF3B30] text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-40 transition"
          >
            Save Recipe to Database
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
