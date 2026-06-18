export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SW_RELOAD_KEY = "aura-pwa-sw-reload";

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

export function shouldRegisterServiceWorker(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  try {
    if (window.self !== window.top) return false;
  } catch {
    return false;
  }

  const host = window.location.hostname;
  return !host.includes("id-preview--") && !host.includes("lovableproject.com");
}

export function hasServiceWorkerControl(): boolean {
  return typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller;
}

/** Registers SW and reloads once so the page is SW-controlled (required for real PWA install). */
export async function activateServiceWorker(): Promise<boolean> {
  if (!shouldRegisterServiceWorker()) {
    await navigator.serviceWorker.getRegistrations().then((regs) =>
      Promise.all(regs.map((r) => r.unregister())),
    );
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    await navigator.serviceWorker.ready;

    if (!navigator.serviceWorker.controller) {
      if (!sessionStorage.getItem(SW_RELOAD_KEY)) {
        sessionStorage.setItem(SW_RELOAD_KEY, "1");
        window.location.reload();
        return false;
      }
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 3000);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
      });
    }

    return hasServiceWorkerControl();
  } catch {
    return false;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterServiceWorker()) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export function supportsNativePwaInstall(): boolean {
  if (typeof window === "undefined") return false;
  return "onbeforeinstallprompt" in window;
}
