import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { GripVertical, Plus, Trash2, Copy } from "lucide-react";
import type { StoryDocument, StoryPage } from "../../types/story";
import { RichTextEditor } from "./rich-text-editor";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { PageImageSlot } from "./page-image-slot";
import { Input } from "../ui/input";
import { useStory, updatePage } from "../../state/story-context";
import { SortablePageItem } from "./sortable-page-item";
import { Switch } from "../ui/switch";

interface PageListProps {
  pages: StoryPage[];
  selectedPageId: string;
  onSelect: (pageId: string) => void;
  onChange: (updater: (story: StoryDocument) => StoryDocument) => void;
  onAdd: () => void;
  onDelete: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function PageList({
  pages,
  selectedPageId,
  onSelect,
  onChange,
  onAdd,
  onDelete,
  onDuplicate,
  onReorder
}: PageListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { story } = useStory();
  const { t } = useTranslation();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pages.findIndex((page) => page.id === active.id);
    const newIndex = pages.findIndex((page) => page.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId), [pages, selectedPageId]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("common.pages")}</h2>
        <Button onClick={onAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {t("common.newPage")}
        </Button>
      </div>
      <div className="flex gap-4 overflow-hidden">
        <div className="w-56 overflow-hidden rounded-lg border border-border bg-card">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={pages.map((page) => page.id)} strategy={verticalListSortingStrategy}>
              <ol className="max-h-[480px] overflow-y-auto">
                {pages.map((page, index) => (
                  <SortablePageItem key={page.id} id={page.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm",
                        selectedPageId === page.id && "bg-primary/10 text-primary"
                      )}
                      onClick={() => onSelect(page.id)}
                    >
                      <span className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {t("common.page")} {index + 1}
                      </span>
                    </button>
                  </SortablePageItem>
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </div>
        <div className="flex-1 space-y-4">
          {selectedPage ? (
            <div className="space-y-4 rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <Input
                  value={selectedPage.title ?? ""}
                  onChange={(event) =>
                    onChange((current) =>
                      updatePage(current, selectedPage.id, (page) => ({
                        ...page,
                        title: event.target.value
                      }))
                    )
                  }
                  placeholder={`${t("common.page")} ${pages.indexOf(selectedPage) + 1}`}
                />
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => onDuplicate(selectedPage.id)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{t("common.duplicatePage")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => onDelete(selectedPage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("common.deletePage")}</span>
                  </Button>
                </div>
              </div>
              <div>
                <RichTextEditor
                  value={selectedPage.html}
                  onChange={(html) =>
                    onChange((current) =>
                      updatePage(current, selectedPage.id, (page) => ({
                        ...page,
                        html
                      }))
                    )
                  }
                  placeholder={t("common.text") ?? ""}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <PageImageSlot
                  image={selectedPage.image}
                  preset={story.meta.pagePreset}
                  onChange={(image) =>
                    onChange((current) =>
                      updatePage(current, selectedPage.id, (page) => ({
                        ...page,
                        image
                      }))
                    )
                  }
                />
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{t("common.imagePlacement")}</span>
                    <span className="text-xs text-muted-foreground">{selectedPage.image?.placement ?? "right"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">{t("common.left")}</span>
                    <Switch
                      checked={selectedPage.image?.placement !== "left"}
                      onCheckedChange={(checked) =>
                        onChange((current) =>
                          updatePage(current, selectedPage.id, (page) => ({
                            ...page,
                            image: page.image
                              ? { ...page.image, placement: checked ? "right" : "left" }
                              : page.image
                          }))
                        )
                      }
                    />
                    <span className="text-sm">{t("common.right")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.imageTools")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-8 text-muted-foreground">
              {t("common.onboardingTip")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
