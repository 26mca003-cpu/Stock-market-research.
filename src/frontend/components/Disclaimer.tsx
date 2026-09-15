import React from "react";
import { ShieldCheck } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants";

export default function Disclaimer() {
  return (
    <footer className="mt-10 pt-5 pb-8 border-t border-border text-center">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary-muted uppercase tracking-wider mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>SEBI Educational Disclosure</span>
        </div>
        <p className="text-xs text-primary-muted/90 leading-snug font-normal">
          {DISCLAIMER_TEXT}
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          © {new Date().getFullYear()} VRIDDHI. Built with precision for Indian retail investors.
        </p>
      </div>
    </footer>
  );
}
