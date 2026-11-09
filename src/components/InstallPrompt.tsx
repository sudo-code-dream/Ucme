"use client";
import { useEffect, useState } from "react";
import { MoreVertical, PlusSquare, Share, Smartphone, X } from "lucide-react";

type Mode = "ios" | "android" | "other";
interface InstallEvent extends Event { prompt: () => Promise<void> }
const KEY = "ucme-install-dismissed";

/** Dashboard card that explains how to add UCme to the home screen. Hidden once installed or dismissed. */
export default function InstallPrompt({ forceShow = false }: { forceShow?: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    if (installed) return;
    let dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === "1"; } catch {}
    if (dismissed && !forceShow) return;
    const ua = navigator.userAgent;
    const ipad = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1; // iPadOS reports as a Mac
    const m: Mode = /iphone|ipad|ipod/i.test(ua) || ipad ? "ios" : /android/i.test(ua) ? "android" : "other";
    if (m === "other" && !forceShow) return; // only nudge phone users
    setMode(m);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [forceShow]);

  if (!mode) return null;
  const dismiss = () => { try { localStorage.setItem(KEY, "1"); } catch {} setMode(null); };
  const steps = mode === "ios"
    ? [<>Open UCme in <b>Safari</b>.</>, <>Tap the <Share size={14} className="inline" /> <b>Share</b> button.</>, <>Choose <PlusSquare size={14} className="inline" /> <b>Add to Home Screen</b>, then <b>Add</b>.</>, <>Open UCme from your home screen.</>]
    : [<>Tap the <MoreVertical size={14} className="inline" /> menu at the top right of Chrome.</>, <>Choose <b>Install app</b> or <b>Add to Home screen</b>.</>, <>Confirm, then open UCme from your home screen.</>];

  return (
    <section className="card border-l-4 border-l-uc-gold p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-uc"><Smartphone size={20} /></span>
          <div><h2 className="font-bold text-uc-dark">Add UCme to your home screen</h2><p className="text-sm text-uc-muted">Open it like an app, straight from your home screen.</p></div></div>
        {!forceShow && <button onClick={dismiss} aria-label="Dismiss" className="rounded p-1 text-uc-muted hover:bg-uc-bg"><X size={18} /></button>}
      </div>
      <ol className="mt-3 list-decimal space-y-1 pl-9 text-sm">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      {mode === "android" && deferred && <button className="btn mt-3" onClick={() => deferred.prompt()}>Install now</button>}
      {mode === "other" && <p className="mt-2 text-sm text-uc-muted">On a phone, open this site and use your browser&apos;s &ldquo;Add to Home Screen&rdquo; option.</p>}
    </section>
  );
}
