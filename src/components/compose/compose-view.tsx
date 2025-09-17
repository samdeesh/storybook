import { useTranslation } from "react-i18next";
import { ChevronRight, Save, ShieldCheck } from "lucide-react";
import { MetaPanel } from "./meta-panel";
import { PageList } from "./page-list";
import { ImageToolsPanel } from "./image-tools-panel";
import { AudioPanel } from "./audio-panel";
import { useStory, createPage, reorderPages } from "../../state/story-context";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import type { StoryDocument } from "../../types/story";
import { uuid } from "../../lib/utils";

export function ComposeView() {
  const { story, setStory, selectedPageId, setSelectedPageId, persistDraft, validate, setMode } = useStory();
  const { t } = useTranslation();
  const { push } = useToast();

  const handleAddPage = () => {
    const newPage = createPage();
    setStory((current) => ({
      ...current,
      pages: [...current.pages, newPage],
      updatedAt: Date.now()
    }));
    setSelectedPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (story.pages.length <= 1) return;
    const index = story.pages.findIndex((page) => page.id === pageId);
    const nextPages = story.pages.filter((page) => page.id !== pageId);
    setStory((current) => ({
      ...current,
      pages: current.pages.filter((page) => page.id !== pageId),
      updatedAt: Date.now()
    }));
    const fallbackIndex = Math.min(Math.max(index - 1, 0), nextPages.length - 1);
    const fallback = nextPages[fallbackIndex];
    if (fallback) {
      setSelectedPageId(fallback.id);
    }
  };

  const handleDuplicate = (pageId: string) => {
    const target = story.pages.find((page) => page.id === pageId);
    if (!target) return;
    const copy = {
      ...target,
      id: uuid("page"),
      image: target.image ? { ...target.image, id: uuid("img") } : undefined,
      audio: target.audio
        ? { ...target.audio, id: uuid("audio"), dataUrl: target.audio.dataUrl }
        : undefined
    };
    setStory((current) => ({
      ...current,
      pages: [...current.pages, copy],
      updatedAt: Date.now()
    }));
    setSelectedPageId(copy.id);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setStory((current) => reorderPages(current, fromIndex, toIndex));
  };

  const handleChange = (updater: (story: StoryDocument) => StoryDocument) => {
    setStory((current) => updater(current));
  };

  const handleValidate = () => {
    if (validate()) {
      push({ title: t("common.validationSuccess"), variant: "success" });
    } else {
      push({ title: t("common.validationIssues"), variant: "destructive" });
    }
  };

  const handleSaveDraft = async () => {
    await persistDraft();
    push({ title: t("common.draftSaved"), variant: "success" });
  };

  const handleContinue = async () => {
    const ok = validate();
    if (!ok) {
      push({ title: t("common.validationIssues"), variant: "destructive" });
      return;
    }
    await persistDraft();
    setMode("read");
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid flex-1 gap-4 xl:grid-cols-[320px_1fr_280px]">
        <MetaPanel />
        <div className="flex flex-col gap-4">
          <PageList
            pages={story.pages}
            selectedPageId={selectedPageId}
            onSelect={setSelectedPageId}
            onChange={handleChange}
            onAdd={handleAddPage}
            onDelete={handleDeletePage}
            onDuplicate={handleDuplicate}
            onReorder={handleReorder}
          />
          <AudioPanel selectedPageId={selectedPageId} />
        </div>
        <ImageToolsPanel selectedPageId={selectedPageId} />
      </div>
      <div className="sticky bottom-0 flex items-center justify-between rounded-lg border border-border bg-card/80 p-3 backdrop-blur">
        <div className="text-xs text-muted-foreground">{t("common.onboardingTip")}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={handleValidate}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {t("common.validate")}
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" /> {t("common.saveDraft")}
          </Button>
          <Button type="button" onClick={handleContinue}>
            {t("common.continue")}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
