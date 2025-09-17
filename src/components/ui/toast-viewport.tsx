import { cn } from "../../lib/utils";
import { useToast } from "./use-toast";
import { buttonVariants } from "./button";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-md border border-border bg-background p-4 shadow-lg",
            toast.variant === "destructive" && "border-destructive/80 bg-destructive/10",
            toast.variant === "success" && "border-emerald-500/70 bg-emerald-500/10"
          )}
          role="status"
        >
          <div className="flex items-start justify-between space-x-4">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-muted-foreground">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-m-2 text-muted-foreground")}
              onClick={() => dismiss(toast.id)}
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
