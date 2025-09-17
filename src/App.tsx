import { I18nextProvider } from "react-i18next";
import { Loader2 } from "lucide-react";
import i18n from "./i18n";
import { ThemeProvider } from "./components/theme/theme-provider";
import { ToastProvider } from "./components/ui/use-toast";
import { ToastViewport } from "./components/ui/toast-viewport";
import { StoryProvider, useStory } from "./state/story-context";
import { ComposeView } from "./components/compose/compose-view";
import { ReadView } from "./components/read/read-view";
import { ExportMenu } from "./components/export/export-menu";
import { Button } from "./components/ui/button";
import { useTranslation } from "react-i18next";

function Shell() {
  const { mode, loading, setMode } = useStory();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">{t("common.appName")}</h1>
          <p className="text-sm text-muted-foreground">{t("common.onboardingTip")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "compose" ? "default" : "ghost"}
            onClick={() => setMode("compose")}
            className="hidden sm:inline-flex"
          >
            {t("common.compose")}
          </Button>
          <Button
            variant={mode === "read" ? "default" : "ghost"}
            onClick={() => setMode("read")}
            className="hidden sm:inline-flex"
          >
            {t("common.read")}
          </Button>
          <ExportMenu />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        {mode === "compose" ? <ComposeView /> : <ReadView />}
      </main>
    </div>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ToastProvider>
          <StoryProvider>
            {children}
            <ToastViewport />
          </StoryProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default function App() {
  return (
    <Providers>
      <Shell />
    </Providers>
  );
}
