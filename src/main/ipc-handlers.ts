import { ipcMain } from 'electron';
import { IPC } from '../shared/ipc-channels';
import * as db from './database';
import { consolidateIngredients } from './consolidator';
import { exportToReminders } from './reminders';
import type { RecipeIngredient, ConsolidatedIngredient } from '../shared/types';

export function registerIpcHandlers(): void {
  // Recipe handlers
  ipcMain.handle(IPC.RECIPES.GET_ALL, () => {
    return db.getAllRecipes();
  });

  ipcMain.handle(IPC.RECIPES.GET_ONE, (_, id: string) => {
    return db.getRecipe(id);
  });

  ipcMain.handle(
    IPC.RECIPES.CREATE,
    (
      _,
      data: {
        id: string;
        name: string;
        instructions: string | null;
        steps?: { content: string }[];
        ingredients: Partial<RecipeIngredient>[];
      }
    ) => {
      return db.createRecipe(data);
    }
  );

  ipcMain.handle(
    IPC.RECIPES.UPDATE,
    (
      _,
      data: {
        id: string;
        name: string;
        instructions: string | null;
        steps?: { content: string }[];
        ingredients: Partial<RecipeIngredient>[];
      }
    ) => {
      return db.updateRecipe(data);
    }
  );

  ipcMain.handle(IPC.RECIPES.DELETE, (_, id: string) => {
    db.deleteRecipe(id);
  });

  ipcMain.handle(IPC.RECIPES.DELETE_BULK, (_, ids: string[]) => {
    return db.deleteRecipesBulk(ids);
  });

  // Ingredient handlers
  ipcMain.handle(IPC.INGREDIENTS.GET_ALL, () => {
    return db.getAllIngredients();
  });

  ipcMain.handle(IPC.INGREDIENTS.SEARCH, (_, query: string) => {
    return db.searchIngredients(query);
  });

  // Shopping handlers
  ipcMain.handle(IPC.SHOPPING.CONSOLIDATE, (_, recipeIds: string[]) => {
    return consolidateIngredients(recipeIds);
  });

  ipcMain.handle(IPC.SHOPPING.EXPORT_REMINDERS, async (_, ingredients: ConsolidatedIngredient[]) => {
    await exportToReminders(ingredients);
  });
}
