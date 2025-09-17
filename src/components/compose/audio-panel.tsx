import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play, Trash2, Upload } from "lucide-react";
import { useStory } from "../../state/story-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { extractAudioMetadata, createWaveformSamples } from "../../lib/media";
import type { AudioTrack, Marker } from "../../types/story";
import { formatTime, parseTimeMarker, uuid } from "../../lib/utils";

interface WaveformProps {
  samples: number[];
  duration: number;
  currentTime: number;
  markers: Marker[];
  onSeek: (time: number) => void;
}

function Waveform({ samples, duration, currentTime, markers, onSeek }: WaveformProps) {
  return (
    <div
      className="relative flex h-20 cursor-pointer items-end gap-[2px] rounded-md border border-border bg-muted/40 p-2"
      onClick={(event) => {
        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        onSeek(ratio * duration);
      }}
      role="presentation"
    >
      {samples.map((sample, index) => (
        <span
          key={index}
          className="flex-1 rounded-full bg-primary/60"
          style={{ height: `${Math.max(sample * 100, 4)}%` }}
        />
      ))}
      <span
        className="absolute bottom-2 top-2 w-[2px] rounded bg-emerald-500"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
      {markers.map((marker) => (
        <span
          key={marker.id}
          className="absolute inset-y-1 w-[2px] bg-amber-500"
          style={{ left: `${(marker.time / duration) * 100}%` }}
        />
      ))}
    </div>
  );
}

function useWaveform(dataUrl: string | undefined) {
  const [samples, setSamples] = useState<number[]>([]);
  useEffect(() => {
    let active = true;
    if (!dataUrl) {
      setSamples([]);
      return;
    }
    createWaveformSamples(dataUrl, 120)
      .then((next) => {
        if (active) setSamples(next);
      })
      .catch((error) => {
        console.error(error);
      });
    return () => {
      active = false;
    };
  }, [dataUrl]);
  return samples;
}

export function AudioPanel({ selectedPageId }: { selectedPageId: string }) {
  const { story, setStory, markers, setMarkers } = useStory();
  const { t } = useTranslation();
  const [bookPlayerTime, setBookPlayerTime] = useState(0);
  const [pagePlayerTime, setPagePlayerTime] = useState(0);
  const bookAudio = story.audio?.find((track) => track.scope === "book");
  const pageAudio = story.audio?.find((track) => track.scope === "page" && track.targetPageId === selectedPageId);
  const bookSamples = useWaveform(bookAudio?.dataUrl);
  const pageSamples = useWaveform(pageAudio?.dataUrl);
  const bookAudioRef = useRef<HTMLAudioElement>(null);
  const pageAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const bookEl = bookAudioRef.current;
    if (!bookEl) return;
    const update = () => setBookPlayerTime(bookEl.currentTime);
    bookEl.addEventListener("timeupdate", update);
    return () => bookEl.removeEventListener("timeupdate", update);
  }, [bookAudioRef]);

  useEffect(() => {
    const pageEl = pageAudioRef.current;
    if (!pageEl) return;
    const update = () => setPagePlayerTime(pageEl.currentTime);
    pageEl.addEventListener("timeupdate", update);
    return () => pageEl.removeEventListener("timeupdate", update);
  }, [pageAudioRef]);

  const uploadBookAudio = async (file: File) => {
    const { duration, dataUrl } = await extractAudioMetadata(file);
    const track: AudioTrack = {
      id: uuid("audio"),
      dataUrl,
      fileName: file.name,
      duration,
      scope: "book"
    };
    setStory((current) => ({
      ...current,
      audio: [track, ...(current.audio?.filter((item) => item.scope !== "book") ?? [])],
      updatedAt: Date.now()
    }));
  };

  const uploadPageAudio = async (file: File) => {
    const { duration, dataUrl } = await extractAudioMetadata(file);
    const track: AudioTrack = {
      id: uuid("audio"),
      dataUrl,
      fileName: file.name,
      duration,
      scope: "page",
      targetPageId: selectedPageId
    };
    setStory((current) => ({
      ...current,
      audio: [
        ...(current.audio?.filter((item) => item.scope !== "page" || item.targetPageId !== selectedPageId) ?? []),
        track
      ],
      updatedAt: Date.now()
    }));
  };

  const removeTrack = (trackId: string) => {
    setStory((current) => ({
      ...current,
      audio: current.audio?.filter((item) => item.id !== trackId),
      updatedAt: Date.now()
    }));
  };

  const handleAddMarker = () => {
    setMarkers([
      ...markers,
      {
        id: uuid("marker"),
        time: 0,
        pageId: selectedPageId
      }
    ]);
  };

  const handleMarkerUpdate = (markerId: string, field: "time" | "pageId", value: string) => {
    setMarkers(
      markers.map((marker) =>
        marker.id === markerId
          ? {
              ...marker,
              [field]: field === "time" ? parseTimeMarker(value) ?? marker.time : value
            }
          : marker
      )
    );
  };

  const handleMarkerDelete = (markerId: string) => {
    setMarkers(markers.filter((marker) => marker.id !== markerId));
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("common.audio")}</h2>
        <Button type="button" size="sm" onClick={handleAddMarker}>
          {t("common.addMarker")}
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Book narration</h3>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <Upload className="h-3 w-3" />
            <input
              type="file"
              accept="audio/mpeg,audio/wav"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) await uploadBookAudio(file);
              }}
            />
          </label>
        </div>
        {bookAudio ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{bookAudio.fileName}</span>
              <span>{formatTime(bookAudio.duration)}</span>
            </div>
            <Waveform
              samples={bookSamples}
              duration={bookAudio.duration}
              currentTime={bookPlayerTime}
              markers={markers}
              onSeek={(time) => {
                const el = bookAudioRef.current;
                if (el) el.currentTime = time;
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const el = bookAudioRef.current;
                  if (!el) return;
                  if (el.paused) {
                    void el.play();
                  } else {
                    el.pause();
                  }
                }}
              >
                {bookAudioRef.current?.paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />} 
                {bookAudioRef.current?.paused ? t("common.play") : t("common.pause")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeTrack(bookAudio.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> {t("common.remove")}
              </Button>
            </div>
            <audio ref={bookAudioRef} src={bookAudio.dataUrl} preload="metadata" />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Upload MP3 or WAV narration for the entire book.
          </p>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Page narration</h3>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <Upload className="h-3 w-3" />
            <input
              type="file"
              accept="audio/mpeg,audio/wav"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) await uploadPageAudio(file);
              }}
            />
          </label>
        </div>
        {pageAudio ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pageAudio.fileName}</span>
              <span>{formatTime(pageAudio.duration)}</span>
            </div>
            <Waveform
              samples={pageSamples}
              duration={pageAudio.duration}
              currentTime={pagePlayerTime}
              markers={markers.filter((marker) => marker.pageId === selectedPageId)}
              onSeek={(time) => {
                const el = pageAudioRef.current;
                if (el) el.currentTime = time;
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const el = pageAudioRef.current;
                  if (!el) return;
                  if (el.paused) {
                    void el.play();
                  } else {
                    el.pause();
                  }
                }}
              >
                {pageAudioRef.current?.paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />} 
                {pageAudioRef.current?.paused ? t("common.play") : t("common.pause")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeTrack(pageAudio.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> {t("common.remove")}
              </Button>
            </div>
            <audio ref={pageAudioRef} src={pageAudio.dataUrl} preload="metadata" />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Upload narration specific to this page to support accessible playback.
          </p>
        )}
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t("common.markers")}</h3>
        <div className="space-y-2">
          {markers.length === 0 && (
            <p className="text-xs text-muted-foreground">Add markers to sync auto page flips.</p>
          )}
          {markers.map((marker) => (
            <div key={marker.id} className="flex items-center gap-2 text-xs">
              <Input
                className="w-20"
                value={formatTime(marker.time)}
                onChange={(event) => handleMarkerUpdate(marker.id, "time", event.target.value)}
                placeholder={t("common.markerPlaceholder") ?? ""}
              />
              <select
                className="h-9 rounded-md border border-border bg-transparent px-2"
                value={marker.pageId}
                onChange={(event) => handleMarkerUpdate(marker.id, "pageId", event.target.value)}
              >
                {story.pages.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    {t("common.page")} {idx + 1}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" variant="ghost" onClick={() => handleMarkerDelete(marker.id)}>
                <Trash2 className="h-3 w-3" />
                <span className="sr-only">{t("common.removeMarker")}</span>
              </Button>
            </div>
          ))}
        </div>
        <Textarea
          rows={3}
          value={story.captions ?? ""}
          placeholder={t("common.captionsPlaceholder") ?? ""}
          onChange={(event) =>
            setStory((current) => ({
              ...current,
              captions: event.target.value,
              updatedAt: Date.now()
            }))
          }
        />
      </div>
    </section>
  );
}
