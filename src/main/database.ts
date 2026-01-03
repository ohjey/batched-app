import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import { v4 as uuid } from 'uuid';
import type { Recipe, Ingredient, RecipeIngredient, StandardUnit, FoodComboIngredient } from '../shared/types';
import foodComboIngredients from '../data/ingredients.json';

// Build a lookup map for ingredient images by slug (primary key)
const ingredientImageMap = new Map<string, string>();
for (const item of foodComboIngredients as FoodComboIngredient[]) {
  ingredientImageMap.set(item.slug.toLowerCase(), item.image);
}

// Helper to normalize ingredient names for canonical storage
function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Simple singularization
  const irregulars: Record<string, string> = {
    potatoes: 'potato',
    tomatoes: 'tomato',
    leaves: 'leaf',
    halves: 'half',
    loaves: 'loaf',
  };

  if (irregulars[normalized]) {
    return irregulars[normalized];
  }

  if (normalized.endsWith('ies')) {
    normalized = normalized.slice(0, -3) + 'y';
  } else if (normalized.endsWith('es') && normalized.length > 3) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith('s') && !normalized.endsWith('ss') && normalized.length > 2) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'batched.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  createTables();
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      instructions TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      canonical_name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_ingredients_canonical ON ingredients(canonical_name);

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      content TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
  `);

  // Migration: Add note column if it doesn't exist (for existing databases)
  const recipeIngTableInfo = db.prepare("PRAGMA table_info(recipe_ingredients)").all() as { name: string }[];
  const hasNoteColumn = recipeIngTableInfo.some(col => col.name === 'note');
  if (!hasNoteColumn) {
    db.exec('ALTER TABLE recipe_ingredients ADD COLUMN note TEXT');
  }

  // Migration: Add slug column to ingredients table
  const ingredientsTableInfo = db.prepare("PRAGMA table_info(ingredients)").all() as { name: string }[];
  const hasSlugColumn = ingredientsTableInfo.some(col => col.name === 'slug');
  if (!hasSlugColumn) {
    db.exec('ALTER TABLE ingredients ADD COLUMN slug TEXT');
  }

  // Migration: Convert existing instructions to steps
  migrateInstructionsToSteps();
}

function migrateInstructionsToSteps(): void {
  // Find recipes with instructions but no steps yet
  const recipesWithInstructions = db.prepare(`
    SELECT r.id, r.instructions
    FROM recipes r
    WHERE r.instructions IS NOT NULL
      AND r.instructions != ''
      AND NOT EXISTS (SELECT 1 FROM recipe_steps rs WHERE rs.recipe_id = r.id)
  `).all() as { id: string; instructions: string }[];

  if (recipesWithInstructions.length === 0) return;

  const insertStep = db.prepare(`
    INSERT INTO recipe_steps (id, recipe_id, step_number, content)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (const recipe of recipesWithInstructions) {
      const lines = recipe.instructions
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      lines.forEach((content, index) => {
        insertStep.run(uuid(), recipe.id, index + 1, content);
      });
    }
  });

  transaction();
}

// Get or create an ingredient
function getOrCreateIngredient(displayName: string, slug?: string): Ingredient {
  const canonicalName = normalizeIngredientName(displayName);

  const existing = db
    .prepare('SELECT id, canonical_name, display_name, slug FROM ingredients WHERE canonical_name = ?')
    .get(canonicalName) as { id: string; canonical_name: string; display_name: string; slug: string | null } | undefined;

  if (existing) {
    // If we have a slug (from JSON), update slug and display_name to match JSON exactly
    if (slug) {
      db.prepare('UPDATE ingredients SET slug = ?, display_name = ? WHERE id = ?')
        .run(slug, displayName, existing.id);
      existing.slug = slug;
      existing.display_name = displayName;
    }
    return {
      id: existing.id,
      canonicalName: existing.canonical_name,
      displayName: existing.display_name,
      slug: existing.slug ?? undefined,
    };
  }

  const id = uuid();

  db.prepare('INSERT INTO ingredients (id, canonical_name, display_name, slug) VALUES (?, ?, ?, ?)').run(
    id,
    canonicalName,
    displayName,
    slug ?? null
  );

  return {
    id,
    canonicalName,
    displayName,
    slug,
  };
}

// Recipe CRUD operations
export function getAllRecipes(): Recipe[] {
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY updated_at DESC').all() as {
    id: string;
    name: string;
    instructions: string | null;
    created_at: number;
    updated_at: number;
  }[];

  return recipes.map((r) => ({
    id: r.id,
    name: r.name,
    instructions: r.instructions,
    steps: getRecipeSteps(r.id),
    ingredients: getRecipeIngredients(r.id),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getRecipe(id: string): Recipe | null {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as {
    id: string;
    name: string;
    instructions: string | null;
    created_at: number;
    updated_at: number;
  } | null;

  if (!recipe) return null;

  return {
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions,
    steps: getRecipeSteps(recipe.id),
    ingredients: getRecipeIngredients(recipe.id),
    createdAt: recipe.created_at,
    updatedAt: recipe.updated_at,
  };
}

function getRecipeIngredients(recipeId: string): RecipeIngredient[] {
  const rows = db
    .prepare(
      `SELECT ri.id, ri.quantity, ri.unit, ri.note, i.id as ingredient_id, i.canonical_name, i.display_name, i.slug
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = ?`
    )
    .all(recipeId) as {
    id: string;
    quantity: number;
    unit: string;
    note: string | null;
    ingredient_id: string;
    canonical_name: string;
    display_name: string;
    slug: string | null;
  }[];

  return rows.map((row) => {
    // Look up image by slug (primary) - this is the stable identifier
    const image = row.slug
      ? ingredientImageMap.get(row.slug.toLowerCase())
      : undefined;

    return {
      id: row.id,
      quantity: row.quantity,
      unit: row.unit as StandardUnit,
      note: row.note ?? undefined,
      ingredient: {
        id: row.ingredient_id,
        canonicalName: row.canonical_name,
        displayName: row.display_name,
        slug: row.slug ?? undefined,
        image,
      },
    };
  });
}

interface RecipeStepRow {
  id: string;
  recipe_id: string;
  step_number: number;
  content: string;
}

function getRecipeSteps(recipeId: string): { id: string; stepNumber: number; content: string }[] {
  const rows = db.prepare(`
    SELECT id, recipe_id, step_number, content
    FROM recipe_steps
    WHERE recipe_id = ?
    ORDER BY step_number ASC
  `).all(recipeId) as RecipeStepRow[];

  return rows.map(row => ({
    id: row.id,
    stepNumber: row.step_number,
    content: row.content,
  }));
}

function saveRecipeSteps(recipeId: string, steps: { content: string }[]): void {
  // Delete existing steps
  db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(recipeId);

  // Insert new steps
  const insertStep = db.prepare(`
    INSERT INTO recipe_steps (id, recipe_id, step_number, content)
    VALUES (?, ?, ?, ?)
  `);

  steps.forEach((step, index) => {
    if (step.content.trim()) {
      insertStep.run(uuid(), recipeId, index + 1, step.content.trim());
    }
  });
}

export function createRecipe(data: {
  id: string;
  name: string;
  instructions: string | null;
  steps?: { content: string }[];
  ingredients: Partial<RecipeIngredient>[];
}): Recipe {
  const now = Date.now();

  db.prepare('INSERT INTO recipes (id, name, instructions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
    data.id,
    data.name,
    data.instructions,
    now,
    now
  );

  // Save steps if provided
  if (data.steps && data.steps.length > 0) {
    saveRecipeSteps(data.id, data.steps);
  }

  for (const ing of data.ingredients) {
    if (!ing.ingredient?.displayName) continue;

    const ingredient = getOrCreateIngredient(ing.ingredient.displayName, ing.ingredient.slug);
    const riId = ing.id || uuid();

    db.prepare('INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, note) VALUES (?, ?, ?, ?, ?, ?)').run(
      riId,
      data.id,
      ingredient.id,
      ing.quantity ?? 1,
      ing.unit ?? 'piece',
      ing.note ?? null
    );
  }

  return getRecipe(data.id)!;
}

export function updateRecipe(data: {
  id: string;
  name: string;
  instructions: string | null;
  steps?: { content: string }[];
  ingredients: Partial<RecipeIngredient>[];
}): Recipe {
  const now = Date.now();

  db.prepare('UPDATE recipes SET name = ?, instructions = ?, updated_at = ? WHERE id = ?').run(
    data.name,
    data.instructions,
    now,
    data.id
  );

  // Save steps if provided
  if (data.steps) {
    saveRecipeSteps(data.id, data.steps);
  }

  // Delete old ingredients and re-add
  db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(data.id);

  for (const ing of data.ingredients) {
    if (!ing.ingredient?.displayName) continue;

    const ingredient = getOrCreateIngredient(ing.ingredient.displayName, ing.ingredient.slug);
    const riId = uuid();

    db.prepare('INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, note) VALUES (?, ?, ?, ?, ?, ?)').run(
      riId,
      data.id,
      ingredient.id,
      ing.quantity ?? 1,
      ing.unit ?? 'piece',
      ing.note ?? null
    );
  }

  return getRecipe(data.id)!;
}

export function deleteRecipe(id: string): void {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
}

export function deleteRecipesBulk(ids: string[]): number {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`DELETE FROM recipes WHERE id IN (${placeholders})`);
  return stmt.run(...ids).changes;
}

// Ingredient operations
export function getAllIngredients(): Ingredient[] {
  const rows = db.prepare('SELECT id, canonical_name, display_name, slug FROM ingredients ORDER BY display_name').all() as {
    id: string;
    canonical_name: string;
    display_name: string;
    slug: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    slug: row.slug ?? undefined,
  }));
}

export function searchIngredients(query: string): Ingredient[] {
  const rows = db
    .prepare('SELECT id, canonical_name, display_name, slug FROM ingredients WHERE display_name LIKE ? LIMIT 10')
    .all(`%${query}%`) as {
    id: string;
    canonical_name: string;
    display_name: string;
    slug: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name,
    slug: row.slug ?? undefined,
  }));
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
