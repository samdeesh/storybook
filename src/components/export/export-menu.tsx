import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import { useStory } from "../../state/story-context";
import type { PageSizePreset, StoryDocument } from "../../types/story";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";

const PRESETS: { id: PageSizePreset; width: number; height: number; label: string }[] = [
  { id: "800x1280", width: 800, height: 1280, label: "800 × 1280" },
  { id: "1024x1366", width: 1024, height: 1366, label: "1024 × 1366" },
  { id: "1080x1350", width: 1080, height: 1350, label: "1080 × 1350" }
];

async function exportPagesToPng(story: StoryDocument, preset: PageSizePreset) {
  const presetConfig = PRESETS.find((item) => item.id === preset) ?? PRESETS[0];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "-10000px";
  container.style.width = `${presetConfig.width}px`;
  container.style.height = `${presetConfig.height}px`;
  container.style.background = "white";
  document.body.appendChild(container);

  const pngFiles: { fileName: string; dataUrl: string }[] = [];

  for (let index = 0; index < story.pages.length; index++) {
    const page = story.pages[index];
    const pageElement = document.createElement("div");
    pageElement.style.width = "100%";
    pageElement.style.height = "100%";
    pageElement.style.padding = "48px";
    pageElement.style.display = "flex";
    pageElement.style.flexDirection = "column";
    pageElement.style.gap = "24px";
    pageElement.style.fontFamily = "'Inter', sans-serif";
    pageElement.innerHTML = `
      <h2 style="font-size:28px;font-weight:700;margin:0;">${page.title ?? `Page ${index + 1}`}</h2>
      <div style="display:flex;gap:24px;flex:1;">
        ${
          page.image && page.image.placement === "left"
            ? `<div style="flex:1;display:flex;align-items:center;justify-content:center;"><img src="${page.image.dataUrl}" alt="${page.image.alt}" style="max-width:100%;max-height:100%;object-fit:${page.image.fitMode === "letterbox" ? "contain" : page.image.fitMode};border-radius:16px;"/></div>`
            : ""
        }
        <div style="flex:1;font-size:18px;line-height:1.6;">${page.html}</div>
        ${
          page.image && page.image.placement === "right"
            ? `<div style="flex:1;display:flex;align-items:center;justify-content:center;"><img src="${page.image.dataUrl}" alt="${page.image.alt}" style="max-width:100%;max-height:100%;object-fit:${page.image.fitMode === "letterbox" ? "contain" : page.image.fitMode};border-radius:16px;"/></div>`
            : ""
        }
      </div>
    `;
    container.appendChild(pageElement);
    const dataUrl = await toPng(pageElement, { width: presetConfig.width, height: presetConfig.height });
    pngFiles.push({ fileName: `page-${index + 1}.png`, dataUrl });
    container.removeChild(pageElement);
  }
  document.body.removeChild(container);
  return pngFiles;
}

async function exportWebBundle(story: StoryDocument) {
  const zip = new JSZip();
  const indexHtml = `<!doctype html>
<html lang="${story.meta.language}">
<head>
<meta charset="utf-8" />
<title>${story.meta.title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
body { font-family: 'Inter', sans-serif; background: #f4f4f9; color: #1a1a1a; margin: 0; padding: 24px; }
main { max-width: 960px; margin: 0 auto; background: white; padding: 48px; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); }
.page { margin-bottom: 64px; page-break-after: always; }
.page:last-child { page-break-after: auto; }
.page img { max-width: 100%; border-radius: 16px; }
.page h2 { font-size: 28px; margin-bottom: 24px; }
.page .content { font-size: 18px; line-height: 1.7; }
</style>
</head>
<body>
<main>
  <header>
    <h1>${story.cover.title}</h1>
    <p>${story.cover.subtitle ?? ""}</p>
  </header>
  ${story.pages
    .map(
      (page, index) => `
      <section class="page">
        <h2>${page.title ?? `Page ${index + 1}`}</h2>
        ${
          page.image
            ? `<img src="${page.image.dataUrl}" alt="${page.image.alt}" style="object-fit:${page.image.fitMode === "letterbox" ? "contain" : page.image.fitMode};" />`
            : ""
        }
        <div class="content">${page.html}</div>
      </section>
    `
    )
    .join("\n")}
</main>
</body>
</html>`;
  zip.file("index.html", indexHtml);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${story.meta.title.replace(/\s+/g, "-").toLowerCase()}-web.zip`);
}

function downloadJson(story: StoryDocument) {
  const json = JSON.stringify(story, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  saveAs(blob, `${story.meta.title.replace(/\s+/g, "-").toLowerCase()}-story.json`);
}

export function ExportMenu() {
  const { story } = useStory();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PageSizePreset>(story.meta.pagePreset);
  const [includeCaptions, setIncludeCaptions] = useState(true);
  const [includePostscript, setIncludePostscript] = useState(true);
  const { push } = useToast();
  const workingRef = useRef(false);

  const handleExportPng = async () => {
    if (workingRef.current) return;
    workingRef.current = true;
    push({ title: t("common.exportSuccess"), description: t("common.exportPrint") });
    try {
      const pngFiles = await exportPagesToPng(story, preset);
      const zip = new JSZip();
      pngFiles.forEach((file) => {
        zip.file(file.fileName, file.dataUrl.split(",")[1], { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${story.meta.title.replace(/\s+/g, "-").toLowerCase()}-pages.zip`);
    } finally {
      workingRef.current = false;
    }
  };

  const handleExportWeb = async () => {
    if (workingRef.current) return;
    workingRef.current = true;
    push({ title: t("common.exportSuccess"), description: t("common.exportWeb") });
    try {
      await exportWebBundle(story);
    } finally {
      workingRef.current = false;
    }
  };

  const handleExportJson = () => {
    push({ title: t("common.exportSuccess"), description: t("common.exportJson") });
    downloadJson({
      ...story,
      postscript: includePostscript ? story.postscript : undefined,
      captions: includeCaptions ? story.captions : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Download className="mr-2 h-4 w-4" /> {t("common.export")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>{t("common.export")}</DialogTitle>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{t("common.exportDescription")}</p>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">{t("common.exportPrint")}</h3>
            <p className="text-xs text-muted-foreground">{t("common.prefersReducedMotion")}</p>
            <div className="mt-2 grid gap-2">
              {PRESETS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPreset(option.id)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left ${preset === option.id ? "border-primary text-primary" : "border-border"}`}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.width}×{option.height}</span>
                </button>
              ))}
            </div>
            <Button className="mt-3" onClick={handleExportPng}>{t("common.exportPrint")}</Button>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">{t("common.exportWeb")}</h3>
            <Button className="mt-3" variant="outline" onClick={handleExportWeb}>
              {t("common.exportWeb")}
            </Button>
          </div>
          <div className="rounded-md border border-border p-4">
            <h3 className="font-semibold">{t("common.exportJson")}</h3>
            <div className="flex items-center justify-between text-xs">
              <span>{t("common.captions")}</span>
              <Switch checked={includeCaptions} onCheckedChange={setIncludeCaptions} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>{t("common.postStory")}</span>
              <Switch checked={includePostscript} onCheckedChange={setIncludePostscript} />
            </div>
            <Button className="mt-3" variant="ghost" onClick={handleExportJson}>
              {t("common.exportJson")}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
