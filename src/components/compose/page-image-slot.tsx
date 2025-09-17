import { useCallback, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { readFileAsDataUrl, getImageDimensions } from "../../lib/media";
import { cn, uuid } from "../../lib/utils";
import type { ImageFitMode, PageImage, PageSizePreset } from "../../types/story";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface PageImageSlotProps {
  image?: PageImage;
  preset: PageSizePreset;
  onChange: (image?: PageImage) => void;
}

const recommendedRange = {
  minWidth: 800,
  maxWidth: 1080,
  minHeight: 1280,
  maxHeight: 1366
};

export function PageImageSlot({ image, onChange, preset }: PageImageSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const presetLabel = useMemo(() => {
    const map: Record<PageSizePreset, string> = {
      "800x1280": "800 × 1280",
      "1024x1366": "1024 × 1366",
      "1080x1350": "1080 × 1350"
    };
    return map[preset];
  }, [preset]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      const dataUrl = await readFileAsDataUrl(file);
      const dimensions = await getImageDimensions(dataUrl);
      const newImage: PageImage = {
        id: uuid("img"),
        dataUrl,
        alt: image?.alt ?? file.name.replace(/\.[^.]+$/, ""),
        width: dimensions.width,
        height: dimensions.height,
        fitMode: image?.fitMode ?? "cover",
        placement: image?.placement ?? "right",
        preset
      };
      if (
        dimensions.width < recommendedRange.minWidth ||
        dimensions.width > recommendedRange.maxWidth ||
        dimensions.height < recommendedRange.minHeight ||
        dimensions.height > recommendedRange.maxHeight
      ) {
        setWarning(
          `Image size ${dimensions.width}×${dimensions.height} is outside the recommended range. Consider cropping or selecting a preset.`
        );
      } else {
        setWarning(null);
      }
      onChange(newImage);
    },
    [image?.alt, image?.fitMode, image?.placement, onChange, preset]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>) => {
      const file = Array.from(event.clipboardData.files).find((item) =>
        ACCEPTED_TYPES.includes(item.type)
      );
      if (file) {
        event.preventDefault();
        await handleFile(file);
      }
    },
    [handleFile]
  );

  const changeFitMode = (mode: ImageFitMode) => {
    if (!image) return;
    onChange({ ...image, fitMode: mode });
  };

  const changeAlt = (alt: string) => {
    if (!image) return;
    onChange({ ...image, alt });
  };

  const removeImage = () => onChange(undefined);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 p-4 text-center transition hover:border-primary",
          dragging && "border-primary/80 bg-primary/10"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {image ? (
          <img
            src={image.dataUrl}
            alt={image.alt}
            className="h-full w-full rounded-md object-cover"
            style={{ objectFit: image.fitMode === "letterbox" ? "contain" : image.fitMode }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
            <p>Drop or upload an illustration ({presetLabel})</p>
            <Button variant="secondary" size="sm" type="button">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await handleFile(file);
            }
          }}
        />
      </div>
      {warning && <p className="text-xs text-amber-600">{warning}</p>}
      {image && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-xs text-muted-foreground">
            {image.width} × {image.height}px • {image.fitMode}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <Button
              variant={image.fitMode === "cover" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => changeFitMode("cover")}
            >
              Cover
            </Button>
            <Button
              variant={image.fitMode === "contain" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => changeFitMode("contain")}
            >
              Contain
            </Button>
            <Button
              variant={image.fitMode === "letterbox" ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => changeFitMode("letterbox")}
            >
              Letterbox
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={removeImage}>
              Remove
            </Button>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Alt text</label>
            <Input value={image.alt} onChange={(event) => changeAlt(event.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
