export interface RecipeStep {
  id: string;
  stepNumber: number;
  content: string;
}

export interface Recipe {
  id: string;
  name: string;
  instructions: string | null;
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  createdAt: number;
  updatedAt: number;
}

export interface Ingredient {
  id: string;
  canonicalName: string;
  displayName: string;
  slug?: string;
  image?: string;
}

export interface FoodComboIngredient {
  name: string;
  slug: string;
  image: string;
  category: string;
}

export interface RecipeIngredient {
  id: string;
  ingredient: Ingredient;
  quantity: number;
  unit: StandardUnit;
  note?: string;
}

export type StandardUnit =
  | 'piece'
  | 'clove'
  | 'bunch'
  | 'head'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'fl oz'
  | 'oz'
  | 'lb'
  | 'g'
  | 'kg';

export const UNIT_OPTIONS: { value: StandardUnit; label: string }[] = [
  { value: 'piece', label: 'piece(s)' },
  { value: 'clove', label: 'clove(s)' },
  { value: 'bunch', label: 'bunch' },
  { value: 'head', label: 'head' },
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'fl oz', label: 'fl oz' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
];

export interface ConsolidatedIngredient {
  ingredient: Ingredient;
  totalQuantity: number;
  unit: StandardUnit;
  fromRecipes: string[];
  alreadyHave: boolean;
  note?: string;
}

export interface ShoppingSession {
  selectedRecipeIds: string[];
  consolidatedIngredients: ConsolidatedIngredient[];
}
