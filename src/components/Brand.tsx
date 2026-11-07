import { MapPin } from "lucide-react";
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-uc-gold text-uc-dark"><MapPin size={20} strokeWidth={2.5} /></span>
      <span><span className={`block text-lg font-bold leading-none ${light ? "text-white" : "text-uc-dark"}`}>UCme</span>
        <span className={`text-[11px] ${light ? "text-blue-200" : "text-uc-muted"}`}>Lost &amp; Found Portal</span></span>
    </span>
  );
}
