import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useDesk } from "../shared/ui";
import { remain, stamp } from "../shared/model";
export function useClock(on = true) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!on) return;
    let fn = () => setNow(Date.now());
    fn();
    const i = setInterval(fn, 500);
    document.addEventListener("visibilitychange", fn);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", fn);
    };
  }, [on]);
  return now;
}
export default function Timer() {
  const { s, patch } = useDesk(),
    t = s.timer,
    now = useClock(!!t.end),
    left = remain(t, now),
    total = 60 * t[t.mode],
    progress = Math.min(1, Math.max(0, 1 - left / total));
  const set = (obj) => patch((x) => ({ timer: { ...x.timer, ...obj } }));
  const mode = (m) => set({ mode: m, end: null, left: 60 * t[m] });
  return (
    <div className="toolView timerView">
      <div className="segment">
        <button aria-pressed={t.mode === "focus"} onClick={() => mode("focus")}>
          وقت التركيز
        </button>
        <button aria-pressed={t.mode === "rest"} onClick={() => mode("rest")}>
          استراحة
        </button>
      </div>
      <div className="dial">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle className="timerTicks" cx="120" cy="120" r="109" />
          <circle className="ringBase" cx="120" cy="120" r="95" />
          <circle
            className="ringFill"
            cx="120"
            cy="120"
            r="95"
            pathLength="1"
            strokeDasharray={`${1 - progress} 1`}
            transform="rotate(-90 120 120)"
          />
        </svg>
        <div>
          <small>{t.mode === "focus" ? "F O C U S" : "R E S T"}</small>
          <b dir="ltr">{stamp(left)}</b>
          <span>
            {t.end
              ? "شغّال"
              : left === 0
                ? "اكتملت الجولة"
                : "جاهز لما تكون جاهز"}
          </span>
        </div>
      </div>
      <div className="row">
        <button
          className="primaryBtn"
          onClick={() =>
            t.end
              ? set({ end: null, left: remain(t) })
              : set({
                  end: Date.now() + 1000 * (left || total),
                  left: left || total,
                })
          }
        >
          {t.end ? <Pause /> : <Play />}
          {t.end ? "إيقاف مؤقت" : "ابدأ الجولة"}
        </button>
        <button
          className="iconBtn boxed"
          aria-label="إعادة ضبط الوقت"
          onClick={() => mode(t.mode)}
        >
          <RotateCcw />
        </button>
      </div>
      <label className="field inline">
        مدة الجولة بالدقايق
        <input
          type="number"
          min="1"
          max="180"
          aria-label="مدة الجولة"
          disabled={!!t.end}
          value={t[t.mode]}
          onChange={(e) => {
            let n = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
            set({ [t.mode]: n, left: 60 * n, end: null });
          }}
        />
      </label>
      <p className="muted">جولات التركيز المكتملة في الجلسة: {t.done}</p>
    </div>
  );
}
