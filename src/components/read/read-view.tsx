import { useEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import screenfull from "screenfull";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Info,
  Maximize,
  Minimize,
  Pause,
  Play,
  Table,
  Volume2
} from "lucide-react";
import { useStory } from "../../state/story-context";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { formatTime } from "../../lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.1, 1.25];

type FlipBookRef = {
  pageFlip: () => {
    flip: (pageIndex: number) => void;
  };
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ReadView() {
  const { story, markers, setMode } = useStory();
  const { t } = useTranslation();
  const bookRef = useRef<FlipBookRef | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [autoFlip, setAutoFlip] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [spread, setSpread] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 900 : true));

  const bookAudio = useMemo(() => story.audio?.find((track) => track.scope === "book"), [story.audio]);
  const hasAudio = Boolean(bookAudio);

  useEffect(() => {
    const onResize = () => setSpread(window.innerWidth > 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!screenfull.isEnabled) return;
    const handler = () => setIsFullscreen(screenfull.isFullscreen);
    screenfull.on("change", handler);
    return () => {
      screenfull.off("change", handler);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      if (!syncEnabled || !autoFlip) return;
      const time = audio.currentTime;
      const sorted = [...markers].sort((a, b) => a.time - b.time);
      for (let i = sorted.length - 1; i >= 0; i--) {
        const marker = sorted[i];
        if (time >= marker.time - 0.2) {
          const pageIndex = story.pages.findIndex((page) => page.id === marker.pageId);
          if (pageIndex !== -1 && pageIndex !== currentPage) {
            bookRef.current?.pageFlip().flip(pageIndex);
            setCurrentPage(pageIndex);
          }
          break;
        }
      }
    };
    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, [autoFlip, currentPage, markers, story.pages, syncEnabled]);

  const goToPage = (index: number) => {
    bookRef.current?.pageFlip().flip(index);
    setCurrentPage(index);
  };

  const toggleFullscreen = () => {
    if (!screenfull.isEnabled) return;
    screenfull.toggle(document.documentElement as HTMLElement);
  };

  const handlePlay = () => {
    if (!hasAudio) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const totalPages = story.pages.length;
  const motionDisabled = prefersReducedMotion();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{story.meta.title}</h1>
          <p className="text-sm text-muted-foreground">{story.meta.author}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setMode("compose")}>{t("common.compose")}</Button>
          <Button variant="outline" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize className="mr-2 h-4 w-4" /> {t("common.exitFullscreen")}
              </>
            ) : (
              <>
                <Maximize className="mr-2 h-4 w-4" /> {t("common.fullscreen")}
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center gap-4">
          <HTMLFlipBook
            ref={bookRef}
            className="shadow-xl"
            style={{}}
            width={spread ? 520 : 360}
            height={spread ? 520 * 1.2 : 360 * 1.4}
            minWidth={280}
            maxWidth={620}
            minHeight={360}
            maxHeight={960}
            size="stretch"
            usePortrait={!spread}
            startPage={currentPage}
            drawShadow={!motionDisabled}
            flippingTime={motionDisabled ? 1 : 800}
            startZIndex={1}
            autoSize
            maxShadowOpacity={0.4}
            showCover
            mobileScrollSupport
            clickEventForward
            useMouseEvents
            swipeDistance={30}
            showPageCorners={!motionDisabled}
            disableFlipByClick={false}
          >
            {story.pages.map((page, index) => (
              <article
                key={page.id}
                className="relative flex h-full w-full flex-col gap-4 bg-white p-10 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-50"
              >
                <header>
                  <h2 className="text-xl font-semibold">{page.title ?? `${t("common.page")} ${index + 1}`}</h2>
                </header>
                <div className="flex h-full gap-6">
                  {page.image && page.image.placement === "left" && (
                    <img
                      src={page.image.dataUrl}
                      alt={page.image.alt}
                      className="h-full max-h-[80%] w-1/2 rounded-md object-cover"
                      style={{ objectFit: page.image.fitMode === "letterbox" ? "contain" : page.image.fitMode }}
                    />
                  )}
                  <div
                    className="prose prose-neutral max-w-none overflow-y-auto text-base leading-relaxed dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: page.html }}
                  />
                  {page.image && page.image.placement === "right" && (
                    <img
                      src={page.image.dataUrl}
                      alt={page.image.alt}
                      className="h-full max-h-[80%] w-1/2 rounded-md object-cover"
                      style={{ objectFit: page.image.fitMode === "letterbox" ? "contain" : page.image.fitMode }}
                    />
                  )}
                </div>
              </article>
            ))}
          </HTMLFlipBook>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(Math.max(currentPage - 1, 0))}>
              <ChevronLeft className="mr-2 h-4 w-4" /> {t("common.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("common.page")} {currentPage + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => goToPage(Math.min(currentPage + 1, totalPages - 1))}>
              {t("common.next")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Table className="mr-2 h-4 w-4" /> {t("common.tableOfContents")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogTitle>{t("common.tableOfContents")}</DialogTitle>
                <ul className="space-y-2">
                  {story.pages.map((page, index) => (
                    <li key={page.id}>
                      <button
                        type="button"
                        className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => goToPage(index)}
                      >
                        {page.title ?? `${t("common.page")} ${index + 1}`}
                      </button>
                    </li>
                  ))}
                </ul>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <aside className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("common.playback")}</h3>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={handlePlay} disabled={!hasAudio}>
                {audioRef.current?.paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />} 
                {audioRef.current?.paused ? t("common.play") : t("common.pause")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.currentTime = 0;
                  if (!audio.paused) audio.pause();
                }}
                disabled={!hasAudio}
              >
                <Headphones className="mr-2 h-4 w-4" /> Sync test
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatTime(audioRef.current?.currentTime ?? 0)}</span>
              <span>{formatTime(bookAudio?.duration ?? 0)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={bookAudio?.duration ?? 0}
              value={audioRef.current?.currentTime ?? 0}
              onChange={(event) => {
                const audio = audioRef.current;
                if (audio) audio.currentTime = Number(event.target.value);
              }}
              aria-label="Seek audio"
              disabled={!hasAudio}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="font-semibold">{t("common.speed")}</label>
              <select
                className="h-8 rounded-md border border-border bg-transparent px-2"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                {SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value.toFixed(2)}x
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" /> {t("common.audio")}
              </span>
              <Switch
                checked={audioEnabled}
                onCheckedChange={(checked) => {
                  setAudioEnabled(checked);
                  const audio = audioRef.current;
                  if (!audio) return;
                  audio.muted = !checked;
                }}
                disabled={!hasAudio}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{t("common.syncToggle")}</span>
              <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{t("common.autoFlip")}</span>
              <Switch checked={autoFlip} onCheckedChange={setAutoFlip} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>{t("common.captions")}</span>
              <Switch checked={showCaptions} onCheckedChange={setShowCaptions} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4" /> {t("common.toggles.readTips")}
            </h3>
            <p className="text-xs text-muted-foreground">
              Use arrow keys or tap edges to flip pages. Adjust speed for younger readers.
            </p>
            {story.captions && showCaptions && (
              <p className="rounded-md border border-border bg-background/80 p-3 text-xs leading-relaxed">
                {story.captions}
              </p>
            )}
          </div>
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold">Markers</h4>
            <ul className="space-y-1">
              {markers.map((marker) => {
                const pageIndex = story.pages.findIndex((page) => page.id === marker.pageId);
                return (
                  <li key={marker.id} className="flex items-center justify-between">
                    <span>
                      {formatTime(marker.time)} → {t("common.page")} {pageIndex + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (pageIndex >= 0) goToPage(pageIndex);
                      }}
                    >
                      {t("common.go")}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
      {bookAudio && <audio ref={audioRef} src={bookAudio.dataUrl} preload="metadata" autoPlay={false} />}
    </div>
  );
}
