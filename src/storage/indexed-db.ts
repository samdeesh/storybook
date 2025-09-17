import { openDB, type IDBPDatabase } from "idb";
import type { StoryDocument } from "../types/story";

interface StorybookDB {
  stories: {
    key: string;
    value: StoryDocument;
  };
}

const DB_NAME = "timverse-storybook";
const DB_VERSION = 1;
const DRAFT_KEY = "draft";
const PUBLISHED_KEY = "published";

async function getDb(): Promise<IDBPDatabase<StorybookDB>> {
  return openDB<StorybookDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("stories")) {
        db.createObjectStore("stories");
      }
    }
  });
}

export async function loadDraft(): Promise<StoryDocument | null> {
  const db = await getDb();
  return (await db.get("stories", DRAFT_KEY)) ?? null;
}

export async function saveDraft(story: StoryDocument) {
  const db = await getDb();
  await db.put("stories", story, DRAFT_KEY);
}

export async function loadPublished(): Promise<StoryDocument | null> {
  const db = await getDb();
  return (await db.get("stories", PUBLISHED_KEY)) ?? null;
}

export async function savePublished(story: StoryDocument) {
  const db = await getDb();
  await db.put("stories", story, PUBLISHED_KEY);
}

export async function clearAll() {
  const db = await getDb();
  await db.clear("stories");
}
