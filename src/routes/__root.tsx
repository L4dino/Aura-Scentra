import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { useReferral } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, ThemePrompt, useTheme } from "@/lib/theme";
import { SplashScreen } from "@/components/SplashScreen";
import { RealtimeNotifier } from "@/components/RealtimeNotifier";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { activateServiceWorker } from "@/lib/pwa";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AURA SCENTRA — Perfumes Premium em Moçambique" },
      { name: "description", content: "Perfumes premium originais entregues em todo Moçambique. Descubra a sua assinatura olfativa com a AURA SCENTRA." },
      { name: "author", content: "AURA SCENTRA" },
      { property: "og:title", content: "AURA SCENTRA — Perfumes Premium" },
      { property: "og:description", content: "Perfumes premium originais em Moçambique." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "AURA SCENTRA" },
      { property: "og:image", content: "/__l5e/assets-v1/a3642fe5-316a-421c-bdf3-eb6c7c221ed7/aura-scentra-logo.png" },
      { name: "twitter:image", content: "/__l5e/assets-v1/a3642fe5-316a-421c-bdf3-eb6c7c221ed7/aura-scentra-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1d1a15" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "AURA SCENTRA" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "AURA SCENTRA" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest", type: "application/manifest+json" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const setRef = useReferral((s) => s.setRef);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const r = p.get("ref");
    if (r) setRef(r);
  }, [setRef]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <ToasterThemed />
          <ThemePrompt />
          <PwaRegistration />
          <SplashScreen />
          <RealtimeNotifier />
          <PwaInstallPrompt />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ToasterThemed() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-center" richColors />;
}

function PwaRegistration() {
  useEffect(() => {
    activateServiceWorker();
  }, []);
  return null;
}
