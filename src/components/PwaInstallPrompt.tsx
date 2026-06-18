import { useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  type BeforeInstallPromptEvent,
  hasServiceWorkerControl,
  isStandalonePwa,
  supportsNativePwaInstall,
} from "@/lib/pwa";

const DISMISS_KEY = "aura-pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = Number(v);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 86400_000;
  } catch {
    return false;
  }
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [swReady, setSwReady] = useState(() => hasServiceWorkerControl());
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalonePwa() || isDismissed() || !supportsNativePwaInstall()) return;

    let promptEvent: BeforeInstallPromptEvent | null = null;

    const maybeShow = () => {
      if (promptEvent && hasServiceWorkerControl()) {
        setSwReady(true);
        setDeferred(promptEvent);
        setShow(true);
      }
    };

    const onControl = () => {
      if (hasServiceWorkerControl()) {
        setSwReady(true);
        maybeShow();
      }
    };

    const onBIP = (e: Event) => {
      e.preventDefault();
      promptEvent = e as BeforeInstallPromptEvent;
      maybeShow();
    };

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
      setInstalling(false);
      toast.success("App instalada com sucesso");
    };

    onControl();
    navigator.serviceWorker?.addEventListener("controllerchange", onControl);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControl);
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShow(false);
    setInstalling(false);
  };

  const install = async () => {
    if (!deferred || installing) return;
    if (!hasServiceWorkerControl()) {
      toast.error("A app ainda está a preparar a instalação. Recarregue a página e tente novamente.");
      return;
    }

    setInstalling(true);

    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;

      if (choice.outcome === "accepted") {
        setShow(false);
      } else {
        dismiss();
      }
    } catch {
      toast.error("Não foi possível instalar. Use o menu do browser: Instalar app.");
    } finally {
      setDeferred(null);
      setInstalling(false);
    }
  };

  if (!show || !deferred || !swReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Instalar AURA SCENTRA</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instalação nativa no telemóvel ou PC — abre em ecrã completo, como uma app.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={install}
                disabled={installing}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {installing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {installing ? "A instalar…" : "Instalar app"}
              </button>
              <button
                onClick={dismiss}
                disabled={installing}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            disabled={installing}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
