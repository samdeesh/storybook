/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { type Marker, type StoryDocument, type StoryPage } from "../types/story";
import { loadDraft, loadPublished, saveDraft, savePublished } from "../storage/indexed-db";
import { uuid } from "../lib/utils";

const pageSchema = z.object({
  id: z.string(),
  html: z.string().min(1),
  image: z
    .object({
      dataUrl: z.string().optional(),
      alt: z.string().optional()
    })
    .passthrough()
    .optional()
});

const storySchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    language: z.string().min(2),
    theme: z.enum(["aurora", "midnight", "sunrise"]),
    pagePreset: z.enum(["800x1280", "1024x1366", "1080x1350"])
  }),
  cover: z.object({
    title: z.string().min(1)
  }),
  pages: z.array(pageSchema).min(1)
});

type StoryMode = "compose" | "read";

type StoryContextValue = {
  story: StoryDocument;
  setStory: React.Dispatch<React.SetStateAction<StoryDocument>>;
  mode: StoryMode;
  setMode: (mode: StoryMode) => void;
  selectedPageId: string;
  setSelectedPageId: (id: string) => void;
  markers: Marker[];
  setMarkers: (markers: Marker[]) => void;
  validate: () => boolean;
  persistDraft: () => Promise<void>;
  publish: () => Promise<void>;
  reset: () => Promise<void>;
  published?: StoryDocument | null;
  loading: boolean;
};

const StoryContext = createContext<StoryContextValue | null>(null);

function createBlankStory(t: ReturnType<typeof useTranslation>["t"]): StoryDocument {
  const pages: StoryPage[] = [
    {
      id: uuid("page"),
      html: `<p>${t("common.sampleStoryPage1")}</p>`,
      image: undefined
    },
    {
      id: uuid("page"),
      html: `<p>${t("common.sampleStoryPage2")}</p>`
    },
    {
      id: uuid("page"),
      html: `<p>${t("common.sampleStoryPage3")}</p>`
    }
  ];

  const now = Date.now();
  return {
    id: uuid("story"),
    status: "draft",
    meta: {
      title: t("common.sampleStoryTitle"),
      subtitle: "",
      author: t("common.sampleStoryAuthor"),
      language: "en",
      theme: "aurora",
      pagePreset: "1024x1366"
    },
    cover: {
      title: t("common.sampleStoryTitle"),
      subtitle: "",
      author: t("common.sampleStoryAuthor"),
      badges: ["TimVerse"]
    },
    pages,
    markers: [],
    audio: [],
    postscript: {
      credits: "",
      aboutAuthor: "",
      callToAction: ""
    },
    captions: "",
    updatedAt: now
  };
}

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [story, setStory] = useState<StoryDocument>(() => createBlankStory(t));
  const [mode, setMode] = useState<StoryMode>("compose");
  const [selectedPageId, setSelectedPageId] = useState(() => story.pages[0]?.id ?? "");
  const [markers, setMarkersState] = useState<Marker[]>([]);
  const [published, setPublished] = useState<StoryDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const [draft, publishedStory] = await Promise.all([loadDraft(), loadPublished()]);
        if (cancelled) return;
        if (draft) {
          setStory(draft);
          setSelectedPageId(draft.pages[0]?.id ?? "");
          setMarkersState(draft.markers ?? []);
        }
        if (publishedStory) {
          setPublished(publishedStory);
        }
      } catch (error) {
        console.error("Failed to load stories", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMarkersState(story.markers ?? []);
  }, [story.markers]);

  const setMarkers = useCallback((markersList: Marker[]) => {
    setMarkersState(markersList);
    setStory((current) => ({ ...current, markers: markersList, updatedAt: Date.now() }));
  }, []);

  const validate = useCallback(() => {
    const result = storySchema.safeParse(story);
    return result.success;
  }, [story]);

  const persistDraft = useCallback(async () => {
    const payload: StoryDocument = { ...story, updatedAt: Date.now(), status: "draft" };
    await saveDraft(payload);
  }, [story]);

  const publish = useCallback(async () => {
    const payload: StoryDocument = { ...story, updatedAt: Date.now(), status: "published" };
    await Promise.all([saveDraft(payload), savePublished(payload)]);
    setPublished(payload);
  }, [story]);

  const reset = useCallback(async () => {
    const next = createBlankStory(t);
    setStory(next);
    setSelectedPageId(next.pages[0]?.id ?? "");
    setMarkersState([]);
    await Promise.all([saveDraft(next), savePublished(next)]);
  }, [t]);

  const value = useMemo<StoryContextValue>(
    () => ({
      story,
      setStory,
      mode,
      setMode,
      selectedPageId,
      setSelectedPageId,
      markers,
      setMarkers,
      validate,
      persistDraft,
      publish,
      reset,
      published,
      loading
    }),
    [story, mode, selectedPageId, markers, setMarkers, validate, persistDraft, publish, reset, published, loading]
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory() {
  const ctx = useContext(StoryContext);
  if (!ctx) {
    throw new Error("useStory must be used inside StoryProvider");
  }
  return ctx;
}

export function usePage(pageId: string | undefined) {
  const { story } = useStory();
  return useMemo(() => story.pages.find((page) => page.id === pageId), [pageId, story.pages]);
}

export function updatePage(
  story: StoryDocument,
  pageId: string,
  update: (page: StoryPage) => StoryPage
): StoryDocument {
  return {
    ...story,
    pages: story.pages.map((page) => (page.id === pageId ? update(page) : page)),
    updatedAt: Date.now()
  };
}

export function reorderPages(story: StoryDocument, from: number, to: number): StoryDocument {
  const pages = [...story.pages];
  const [moved] = pages.splice(from, 1);
  pages.splice(to, 0, moved);
  return { ...story, pages, updatedAt: Date.now() };
}

export function createPage(): StoryPage {
  return {
    id: uuid("page"),
    html: "<p></p>",
    image: undefined,
    audio: undefined
  };
}
