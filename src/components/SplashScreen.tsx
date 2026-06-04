import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const KEY = "aura-splash-shown";

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    sessionStorage.setItem(KEY, "1");
    const t1 = window.setTimeout(() => setLeaving(true), 1800);
    const t2 = window.setTimeout(() => setShow(false), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`splash-root ${leaving ? "splash-leaving" : ""}`}
      aria-hidden="true"
    >
      <div className="splash-glow" />
      <div className="splash-logo-wrap">
        <img src={logo} alt="" className="splash-logo" />
        <div className="splash-shimmer" />
      </div>
      <p className="splash-tag">A despertar a sua aura…</p>
    </div>
  );
}