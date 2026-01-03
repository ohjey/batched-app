import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './shared/ipc-channels';
import type { Recipe, Ingredient, RecipeIngredient, ConsolidatedIngredient } from './shared/types';

const api = {
  recipes: {
    getAll: (): Promise<Recipe[]> => ipcRenderer.invoke(IPC.RECIPES.GET_ALL),
    getOne: (id: string): Promise<Recipe | null> => ipcRenderer.invoke(IPC.RECIPES.GET_ONE, id),
    create: (data: {
      id: string;
      name: string;
      instructions: string | null;
      steps?: { content: string }[];
      ingredients: Partial<RecipeIngredient>[];
    }): Promise<Recipe> => ipcRenderer.invoke(IPC.RECIPES.CREATE, data),
    update: (data: {
      id: string;
      name: string;
      instructions: string | null;
      steps?: { content: string }[];
      ingredients: Partial<RecipeIngredient>[];
    }): Promise<Recipe> => ipcRenderer.invoke(IPC.RECIPES.UPDATE, data),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.RECIPES.DELETE, id),
    deleteBulk: (ids: string[]): Promise<number> => ipcRenderer.invoke(IPC.RECIPES.DELETE_BULK, ids),
  },
  ingredients: {
    getAll: (): Promise<Ingredient[]> => ipcRenderer.invoke(IPC.INGREDIENTS.GET_ALL),
    search: (query: string): Promise<Ingredient[]> => ipcRenderer.invoke(IPC.INGREDIENTS.SEARCH, query),
  },
  shopping: {
    consolidate: (recipeIds: string[]): Promise<ConsolidatedIngredient[]> =>
      ipcRenderer.invoke(IPC.SHOPPING.CONSOLIDATE, recipeIds),
    exportReminders: (ingredients: ConsolidatedIngredient[]): Promise<void> =>
      ipcRenderer.invoke(IPC.SHOPPING.EXPORT_REMINDERS, ingredients),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Type declaration for the renderer
declare global {
  interface Window {
    api: typeof api;
  }
}
