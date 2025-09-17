import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Crop, ImageDown, Wand2 } from "lucide-react";
import { useStory, updatePage } from "../../state/story-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import type { ImageFitMode } from "../../types/story";
import { cn } from "../../lib/utils";

export function ImageToolsPanel({ selectedPageId }: { selectedPageId: string }) {
  const { story, setStory } = useStory();
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const page = useMemo(() => story.pages.find((item) => item.id === selectedPageId), [story.pages, selectedPageId]);
  const image = page?.image;

  const changeFit = useCallback(
    (fit: ImageFitMode) => {
      if (!page) return;
      setStory((current) => updatePage(current, page.id, (p) => (p.image ? { ...p, image: { ...p.image, fitMode: fit } } : p)));
    },
    [page, setStory]
  );

  const changeAlt = useCallback(
    (alt: string) => {
      if (!page) return;
      setStory((current) => updatePage(current, page.id, (p) => (p.image ? { ...p, image: { ...p.image, alt } } : p)));
    },
    [page, setStory]
  );

  const applySmartCrop = useCallback(() => {
    if (!page?.image) return;
    // Smart crop: default to cover fit
    changeFit("cover");
  }, [changeFit, page?.image]);

  const applySmartFit = useCallback(() => {
    if (!page?.image) return;
    changeFit("contain");
  }, [changeFit, page?.image]);

  return (
    <aside className="flex h-full w-full max-w-xs flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold">{t("common.imageTools")}</h2>
        <p className="text-xs text-muted-foreground">{t("common.aiPromptPlaceholder")}</p>
      </div>
      {image ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-border">
            <img
              src={image.dataUrl}
              alt={image.alt}
              className={cn(
                "w-full", image.fitMode === "letterbox" ? "bg-background object-contain" : "object-cover"
              )}
              style={{ aspectRatio: "3 / 4", objectFit: image.fitMode === "letterbox" ? "contain" : image.fitMode }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t("common.fit")}</p>
            <div className="flex flex-wrap gap-2">
              {["cover", "contain", "letterbox"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={image.fitMode === mode ? "default" : "outline"}
                  onClick={() => changeFit(mode as ImageFitMode)}
                >
                  {t(`common.${mode === "cover" ? "coverFit" : mode}`)}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button type="button" variant="outline" onClick={applySmartCrop}>
              <Crop className="mr-2 h-4 w-4" /> Smart crop
            </Button>
            <Button type="button" variant="outline" onClick={applySmartFit}>
              <ImageDown className="mr-2 h-4 w-4" /> Smart fit
            </Button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("common.altText")}</label>
            <Input value={image.alt} onChange={(event) => changeAlt(event.target.value)} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("common.upload")} / {t("common.paste")}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Wand2 className="h-4 w-4" /> {t("common.aiPromptLabel")}
        </h3>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("common.aiPromptPlaceholder") ?? ""}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {t("common.aiPromptLabel")} – {t("common.optional")}
        </p>
      </div>
    </aside>
  );
}
