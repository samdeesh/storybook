export type ImageFitMode = "cover" | "contain" | "letterbox";
export type ImagePlacement = "left" | "right";

export interface PageImage {
  id: string;
  dataUrl: string;
  alt: string;
  width: number;
  height: number;
  fitMode: ImageFitMode;
  placement: ImagePlacement;
  preset: PageSizePreset;
}

export interface PageAudio {
  id: string;
  dataUrl: string;
  fileName: string;
  duration: number;
}

export interface StoryPage {
  id: string;
  title?: string;
  html: string;
  image?: PageImage;
  audio?: PageAudio;
}

export interface StoryMeta {
  title: string;
  subtitle?: string;
  author?: string;
  language: string;
  theme: "aurora" | "midnight" | "sunrise";
  pagePreset: PageSizePreset;
}

export type PageSizePreset = "800x1280" | "1024x1366" | "1080x1350";

export interface CoverDesign {
  title: string;
  subtitle?: string;
  author?: string;
  backgroundImage?: string;
  badges: string[];
}

export interface AudioTrack {
  id: string;
  scope: "book" | "page";
  targetPageId?: string;
  dataUrl: string;
  fileName: string;
  duration: number;
}

export interface Marker {
  id: string;
  time: number;
  pageId: string;
}

export interface StoryDocument {
  id: string;
  status: "draft" | "published";
  meta: StoryMeta;
  cover: CoverDesign;
  pages: StoryPage[];
  postscript?: {
    credits?: string;
    aboutAuthor?: string;
    callToAction?: string;
  };
  audio?: AudioTrack[];
  markers: Marker[];
  captions?: string;
  updatedAt: number;
}

export interface StoryExportOptions {
  preset: PageSizePreset;
  includeCaptions: boolean;
  includePostscript: boolean;
}
