import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { ConsolidatedIngredient } from '../shared/types';
import { pluralizeUnit } from '../shared/formatters';

const execAsync = promisify(exec);

// Use AppleScript to interact with Reminders app
async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
  return stdout.trim();
}

async function createOrGetList(listName: string): Promise<void> {
  const script = `
    tell application "Reminders"
      if not (exists list "${listName}") then
        make new list with properties {name:"${listName}"}
      end if
    end tell
  `;
  await runAppleScript(script);
}

async function addRemindersBatch(
  listName: string,
  reminders: Array<{ title: string; notes: string }>
): Promise<void> {
  if (reminders.length === 0) return;

  const reminderStatements = reminders.map(({ title, notes }) => {
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedNotes = notes.replace(/"/g, '\\"');
    return `make new reminder with properties {name:"${escapedTitle}", body:"${escapedNotes}"}`;
  }).join('\n        ');

  const script = `
    tell application "Reminders"
      tell list "${listName}"
        ${reminderStatements}
      end tell
    end tell
  `;
  await runAppleScript(script);
}

export async function exportToReminders(ingredients: ConsolidatedIngredient[]): Promise<void> {
  const listName = 'Batched Shopping List';
  await createOrGetList(listName);

  // Build reminder data
  const reminders = ingredients
    .filter(ing => !ing.alreadyHave)
    .map(ing => {
      const displayName = ing.note
        ? `${ing.ingredient.displayName} (${ing.note})`
        : ing.ingredient.displayName;
      return {
        title: `${displayName} (${ing.totalQuantity} ${pluralizeUnit(ing.totalQuantity, ing.unit)})`,
        notes: `For: ${ing.fromRecipes.join(', ')}`
      };
    });

  // Process in chunks of 50 for resilience with large lists
  const CHUNK_SIZE = 50;
  for (let i = 0; i < reminders.length; i += CHUNK_SIZE) {
    const chunk = reminders.slice(i, i + CHUNK_SIZE);
    await addRemindersBatch(listName, chunk);
  }
}
