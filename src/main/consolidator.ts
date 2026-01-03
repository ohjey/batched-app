import type { Recipe, ConsolidatedIngredient, StandardUnit } from '../shared/types';
import * as db from './database';

// Unit conversion tables
const VOLUME_TO_TSP: Record<string, number> = {
  tsp: 1,
  tbsp: 3,
  'fl oz': 6,
  cup: 48,
};

const WEIGHT_TO_OZ: Record<string, number> = {
  oz: 1,
  lb: 16,
  g: 0.035274,
  kg: 35.274,
};

type UnitFamily = 'volume' | 'weight' | 'count';

function getUnitFamily(unit: StandardUnit): UnitFamily {
  if (VOLUME_TO_TSP[unit]) return 'volume';
  if (WEIGHT_TO_OZ[unit]) return 'weight';
  return 'count';
}

function toBestVolumeUnit(tsp: number): { amount: number; unit: StandardUnit } {
  if (tsp >= 48) return { amount: Math.round((tsp / 48) * 100) / 100, unit: 'cup' };
  if (tsp >= 3) return { amount: Math.round((tsp / 3) * 100) / 100, unit: 'tbsp' };
  return { amount: Math.round(tsp * 100) / 100, unit: 'tsp' };
}

function toBestWeightUnit(oz: number): { amount: number; unit: StandardUnit } {
  if (oz >= 16) return { amount: Math.round((oz / 16) * 100) / 100, unit: 'lb' };
  return { amount: Math.round(oz * 100) / 100, unit: 'oz' };
}

export function consolidateIngredients(recipeIds: string[]): ConsolidatedIngredient[] {
  // Get all recipes
  const recipes: Recipe[] = recipeIds
    .map((id) => db.getRecipe(id))
    .filter((r): r is Recipe => r !== null);

  // Group ingredients by canonical name + note (so "Onion (Red)" and "Onion (White)" are separate)
  const ingredientMap = new Map<
    string,
    {
      ingredient: { id: string; canonicalName: string; displayName: string };
      note?: string;
      occurrences: Array<{ quantity: number; unit: StandardUnit; recipeName: string }>;
    }
  >();

  for (const recipe of recipes) {
    for (const ri of recipe.ingredients) {
      // Include note in the key to keep variants separate
      const key = `${ri.ingredient.canonicalName}:${ri.note || ''}`;

      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          ingredient: ri.ingredient,
          note: ri.note,
          occurrences: [],
        });
      }

      ingredientMap.get(key)!.occurrences.push({
        quantity: ri.quantity,
        unit: ri.unit,
        recipeName: recipe.name,
      });
    }
  }

  // Consolidate each ingredient
  const consolidated: ConsolidatedIngredient[] = [];

  for (const [, data] of ingredientMap) {
    // Group occurrences by unit family
    const byFamily: Record<UnitFamily, typeof data.occurrences> = {
      volume: [],
      weight: [],
      count: [],
    };

    for (const occ of data.occurrences) {
      const family = getUnitFamily(occ.unit);
      byFamily[family].push(occ);
    }

    // Process each unit family
    for (const [family, occurrences] of Object.entries(byFamily) as [UnitFamily, typeof data.occurrences][]) {
      if (occurrences.length === 0) continue;

      let totalQuantity: number;
      let finalUnit: StandardUnit;
      const fromRecipes = occurrences.map((o) => o.recipeName);

      if (family === 'volume') {
        // Convert all to tsp, sum, convert back
        const totalTsp = occurrences.reduce((sum, o) => sum + o.quantity * (VOLUME_TO_TSP[o.unit] || 1), 0);
        const best = toBestVolumeUnit(totalTsp);
        totalQuantity = best.amount;
        finalUnit = best.unit;
      } else if (family === 'weight') {
        // Convert all to oz, sum, convert back
        const totalOz = occurrences.reduce((sum, o) => sum + o.quantity * (WEIGHT_TO_OZ[o.unit] || 1), 0);
        const best = toBestWeightUnit(totalOz);
        totalQuantity = best.amount;
        finalUnit = best.unit;
      } else {
        // Count: group by exact unit
        const byUnit = new Map<StandardUnit, { quantity: number; recipes: string[] }>();

        for (const occ of occurrences) {
          if (!byUnit.has(occ.unit)) {
            byUnit.set(occ.unit, { quantity: 0, recipes: [] });
          }
          const entry = byUnit.get(occ.unit)!;
          entry.quantity += occ.quantity;
          entry.recipes.push(occ.recipeName);
        }

        // Add each unit group as a separate consolidated item
        for (const [unit, { quantity, recipes }] of byUnit) {
          consolidated.push({
            ingredient: data.ingredient,
            totalQuantity: Math.round(quantity * 100) / 100,
            unit,
            fromRecipes: [...new Set(recipes)],
            alreadyHave: false,
            note: data.note,
          });
        }
        continue; // Skip the normal push below
      }

      consolidated.push({
        ingredient: data.ingredient,
        totalQuantity,
        unit: finalUnit,
        fromRecipes: [...new Set(fromRecipes)],
        alreadyHave: false,
        note: data.note,
      });
    }
  }

  // Sort alphabetically
  consolidated.sort((a, b) => a.ingredient.displayName.localeCompare(b.ingredient.displayName));

  return consolidated;
}
