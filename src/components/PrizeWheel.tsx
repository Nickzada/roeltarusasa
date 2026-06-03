import { useState, useRef } from "react";
import { Sparkles } from "lucide-react";
import xiaomi from "@/assets/xiaomi-hero.jpg";
import cash from "@/assets/prize-cash.png";
import plush from "@/assets/prize-plush.png";
import smartwatch from "@/assets/prize-smartwatch.png";
import headphones from "@/assets/prize-headphones.png";
import giftcard from "@/assets/prize-giftcard.png";
import perfume from "@/assets/prize-perfume.png";
import speaker from "@/assets/prize-speaker.png";

const RED = "oklch(0.42 0.18 25)";
const DARK = "oklch(0.28 0.12 25)";

export const PRIZES = [
  { name: "R$ 500 em Dinheiro", img: cash, color: RED },
  { name: "Urso de Pelúcia", img: plush, color: DARK },
  { name: "Smartwatch", img: smartwatch, color: RED },
  { name: "Headphone Bluetooth", img: headphones, color: DARK },
  { name: "Vale-Presente R$ 200", img: giftcard, color: RED },
  { name: "Perfume Importado", img: perfume, color: DARK },
  { name: "Xiaomi Redmi Note 13 Pro", img: xiaomi, color: RED, grand: true },
  { name: "Caixa de Som Bluetooth", img: speaker, color: DARK },
];

interface Props {
  onWin: () => void;
  disabled?: boolean;
}

export function PrizeWheel({ onWin, disabled }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    if (spinning || disabled) return;
    setSpinning(true);
    const segAngle = 360 / PRIZES.length;
    const targetIdx = 6; // XIAOMI
    const targetAngle = 360 - (targetIdx * segAngle + segAngle / 2);
    const finalRotation = rotation + 1800 + targetAngle - (rotation % 360);
    setRotation(finalRotation);
    setTimeout(() => {
      setSpinning(false);
      onWin();
    }, 5200);
  };

  const segAngle = 360 / PRIZES.length;

  return (
    <div className="relative flex flex-col items-center gap-6 w-full">
      {/* Prize legend */}
      <div className="w-full max-w-md">
        <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Prêmios desta rodada
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRIZES.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 border ${
                p.grand
                  ? "bg-gold/10 border-gold/50"
                  : "bg-card/60 border-border"
              }`}
            >
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className={`text-[10px] text-center leading-tight font-medium ${p.grand ? "text-gold" : "text-foreground"}`}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-gold drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
        </div>

        <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full p-2 bg-gold shadow-gold animate-pulse-glow">
          <div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? "5s" : "0s",
              transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.21, 0.99)",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {PRIZES.map((seg, i) => {
                const start = (i * segAngle - 90) * (Math.PI / 180);
                const end = ((i + 1) * segAngle - 90) * (Math.PI / 180);
                const x1 = 100 + 100 * Math.cos(start);
                const y1 = 100 + 100 * Math.sin(start);
                const x2 = 100 + 100 * Math.cos(end);
                const y2 = 100 + 100 * Math.sin(end);
                const midAngle = (i * segAngle + segAngle / 2 - 90) * (Math.PI / 180);
                const imgSize = 38;
                const ix = 100 + 58 * Math.cos(midAngle) - imgSize / 2;
                const iy = 100 + 58 * Math.sin(midAngle) - imgSize / 2;
                const rotateImg = i * segAngle + segAngle / 2;
                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={seg.color}
                      stroke="oklch(0.15 0.02 25)"
                      strokeWidth="0.8"
                    />
                    <g transform={`rotate(${rotateImg} ${ix + imgSize / 2} ${iy + imgSize / 2})`}>
                      <image
                        href={seg.img}
                        x={ix}
                        y={iy}
                        width={imgSize}
                        height={imgSize}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-gold border-4 border-background flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-gold-foreground" />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || disabled}
        className="px-12 py-5 rounded-full bg-fire text-primary-foreground font-display font-bold text-lg uppercase tracking-wider shadow-red hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {spinning ? "Girando..." : "Girar Roleta"}
      </button>
    </div>
  );
}
