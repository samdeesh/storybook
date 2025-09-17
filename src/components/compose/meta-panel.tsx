import { type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Palette, Sparkles } from "lucide-react";
import { useTheme } from "../theme/theme-provider";
import { useStory } from "../../state/story-context";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { readFileAsDataUrl } from "../../lib/media";
import type { PageSizePreset } from "../../types/story";
import { cn } from "../../lib/utils";

const PRESETS: { id: PageSizePreset; label: string }[] = [
  { id: "800x1280", label: "800 × 1280" },
  { id: "1024x1366", label: "1024 × 1366" },
  { id: "1080x1350", label: "1080 × 1350" }
];

const THEMES = [
  { id: "aurora", label: "Aurora", swatch: "bg-gradient-to-r from-purple-500 via-violet-500 to-sky-500" },
  { id: "midnight", label: "Midnight", swatch: "bg-gradient-to-r from-slate-900 via-indigo-900 to-black" },
  { id: "sunrise", label: "Sunrise", swatch: "bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500" }
];

const BADGES = ["TimVerse", "New", "Limited", "Classic"];

export function MetaPanel() {
  const { story, setStory } = useStory();
  const { t } = useTranslation();
  const { theme, setTheme, highContrast, toggleHighContrast } = useTheme();

  const updateMeta = (field: string, value: string) => {
    setStory((current) => ({
      ...current,
      meta: { ...current.meta, [field]: value },
      cover: field === "title" || field === "subtitle" || field === "author"
        ? { ...current.cover, [field]: value }
        : current.cover,
      updatedAt: Date.now()
    }));
  };

  const updatePreset = (preset: PageSizePreset) => {
    setStory((current) => ({
      ...current,
      meta: { ...current.meta, pagePreset: preset },
      pages: current.pages.map((page) =>
        page.image ? { ...page, image: { ...page.image, preset } } : page
      ),
      updatedAt: Date.now()
    }));
  };

  const handleCoverBackground = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setStory((current) => ({
      ...current,
      cover: { ...current.cover, backgroundImage: dataUrl },
      updatedAt: Date.now()
    }));
  };

  const toggleBadge = (badge: string) => {
    setStory((current) => {
      const badges = current.cover.badges ?? [];
      const exists = badges.includes(badge);
      return {
        ...current,
        cover: {
          ...current.cover,
          badges: exists ? badges.filter((item) => item !== badge) : [...badges, badge]
        },
        updatedAt: Date.now()
      };
    });
  };

  return (
    <aside className="flex h-full w-full max-w-xs flex-col gap-6 overflow-y-auto rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold">{t("common.metadata")}</h2>
        <p className="text-xs text-muted-foreground">{t("common.onboardingTip")}</p>
      </div>
      <div className="space-y-3">
        <div>
          <Label htmlFor="story-title" requiredIndicator>
            {t("common.title")}
          </Label>
          <Input
            id="story-title"
            value={story.meta.title}
            onChange={(event) => updateMeta("title", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="story-subtitle">{t("common.subtitle")}</Label>
          <Input
            id="story-subtitle"
            value={story.meta.subtitle ?? ""}
            onChange={(event) => updateMeta("subtitle", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="story-author">{t("common.author")}</Label>
          <Input
            id="story-author"
            value={story.meta.author ?? ""}
            onChange={(event) => updateMeta("author", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="story-language">{t("common.language")}</Label>
          <Input
            id="story-language"
            value={story.meta.language}
            onChange={(event) => updateMeta("language", event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("common.theme")}</Label>
          <span className="text-xs text-muted-foreground capitalize">{theme}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {(["light", "dark", "system"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTheme(item)}
              className={cn(
                "rounded-md border border-border px-2 py-1 capitalize",
                theme === item && "border-primary text-primary"
              )}
            >
              {t(`common.${item}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border border-border p-2 text-xs",
                story.meta.theme === item.id && "border-primary text-primary"
              )}
              onClick={() =>
                setStory((current) => ({
                  ...current,
                  meta: { ...current.meta, theme: item.id as typeof story.meta.theme },
                  updatedAt: Date.now()
                }))
              }
            >
              <span className={cn("h-10 w-full rounded-md", item.swatch)} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-2">
          <div>
            <p className="text-sm font-medium">{t("common.highContrast")}</p>
            <p className="text-xs text-muted-foreground">{t("common.prefersReducedMotion")}</p>
          </div>
          <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />
        </div>
      </div>
      <div className="space-y-3">
        <Label>{t("common.pagePreset")}</Label>
        <div className="grid gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cn(
                "flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm",
                story.meta.pagePreset === preset.id && "border-primary text-primary"
              )}
              onClick={() => updatePreset(preset.id)}
            >
              <span>{preset.label}</span>
              <span className="text-xs text-muted-foreground">{preset.id}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4" /> {t("common.coverDesigner")}
        </h3>
        <div className="space-y-2">
          <Label>{t("common.coverBackground")}</Label>
          <Button variant="outline" size="sm" type="button" className="w-full">
            <label className="flex w-full cursor-pointer items-center justify-center gap-2" htmlFor="cover-bg">
              <ImagePlus className="h-4 w-4" /> {t("common.upload")}
            </label>
          </Button>
          <input id="cover-bg" type="file" accept="image/*" className="hidden" onChange={handleCoverBackground} />
          {story.cover.backgroundImage && (
            <img
              src={story.cover.backgroundImage}
              alt="Cover background"
              className="h-32 w-full rounded-md object-cover"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("common.badges")}</Label>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((badge) => (
              <button
                key={badge}
                type="button"
                onClick={() => toggleBadge(badge)}
                className={cn(
                  "rounded-full border border-border px-3 py-1 text-xs font-semibold",
                  story.cover.badges?.includes(badge) && "border-primary bg-primary/10 text-primary"
                )}
              >
                <Sparkles className="mr-1 inline h-3 w-3" /> {badge}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("common.postStory")}</Label>
          <Textarea
            placeholder={t("common.credits") ?? ""}
            value={story.postscript?.credits ?? ""}
            onChange={(event) =>
              setStory((current) => ({
                ...current,
                postscript: { ...current.postscript, credits: event.target.value },
                updatedAt: Date.now()
              }))
            }
          />
          <Textarea
            placeholder={t("common.aboutAuthor") ?? ""}
            value={story.postscript?.aboutAuthor ?? ""}
            onChange={(event) =>
              setStory((current) => ({
                ...current,
                postscript: { ...current.postscript, aboutAuthor: event.target.value },
                updatedAt: Date.now()
              }))
            }
          />
          <Textarea
            placeholder={t("common.callToAction") ?? ""}
            value={story.postscript?.callToAction ?? ""}
            onChange={(event) =>
              setStory((current) => ({
                ...current,
                postscript: { ...current.postscript, callToAction: event.target.value },
                updatedAt: Date.now()
              }))
            }
          />
        </div>
      </div>
    </aside>
  );
}
