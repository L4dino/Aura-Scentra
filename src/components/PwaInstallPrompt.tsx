import { useEffect, useState } from "react";
import { X, Download, Share2 } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "aura-pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

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
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || isDismissed()) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/MSStream/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS doesn't fire beforeinstallprompt — show manual hint
    if (isIOS && isSafari) {
      const t = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
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
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setShow(false);
      } else {
        dismiss();
      }
    } catch {
      /* ignore */
    } finally {
      setDeferred(null);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Instalar AURA SCENTRA</p>
            {iosHint ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Toque em <Share2 className="mx-1 inline h-3.5 w-3.5" /> Partilhar e depois
                em <strong>Adicionar ao Ecrã Principal</strong>.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Tenha acesso rápido e a melhor experiência diretamente do seu ecrã principal.
              </p>
            )}
            {!iosHint && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={install}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Instalar
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Agora não
                </button>
              </div>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}