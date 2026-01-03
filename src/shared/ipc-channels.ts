export const IPC = {
  RECIPES: {
    GET_ALL: 'recipes:getAll',
    GET_ONE: 'recipes:getOne',
    CREATE: 'recipes:create',
    UPDATE: 'recipes:update',
    DELETE: 'recipes:delete',
    DELETE_BULK: 'recipes:deleteBulk',
  },
  INGREDIENTS: {
    SEARCH: 'ingredients:search',
    GET_ALL: 'ingredients:getAll',
  },
  SHOPPING: {
    CONSOLIDATE: 'shopping:consolidate',
    EXPORT_REMINDERS: 'shopping:exportReminders',
  },
  APP: {
    GET_VERSION: 'app:getVersion',
  },
} as const;
