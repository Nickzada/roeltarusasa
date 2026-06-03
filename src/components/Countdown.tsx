import { useEffect, useState } from "react";

interface Props {
  target: Date;
  className?: string;
}

function getDiff(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s };
}

export function Countdown({ target, className }: Props) {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(getDiff(target));
    const id = setInterval(() => setT(getDiff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) {
    return <div className={className} style={{ minHeight: 64 }} />;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={className}>
      <div className="flex items-center gap-2 sm:gap-3 justify-center">
        <Box value={pad(t.h)} label="horas" />
        <span className="text-2xl sm:text-3xl font-display font-bold text-gold">:</span>
        <Box value={pad(t.m)} label="min" />
        <span className="text-2xl sm:text-3xl font-display font-bold text-gold">:</span>
        <Box value={pad(t.s)} label="seg" />
      </div>
    </div>
  );
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[56px] sm:min-w-[72px] px-3 py-2 rounded-xl bg-card border border-gold/40 font-display text-2xl sm:text-3xl font-bold text-gold tabular-nums shadow-gold">
        {value}
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
