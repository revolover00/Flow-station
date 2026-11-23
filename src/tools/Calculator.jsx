import React, { useRef, useEffect } from "react";
import { BookmarkPlus } from "lucide-react";
import { useDesk, Notice } from "../shared/ui";
export default function Calculator() {
  const { s, clip, config, notify } = useDesk();
  const ref = useRef();
  useEffect(() => {
    const read = (e) => {
      if (
        e.origin !== location.origin ||
        e.source !== ref.current?.contentWindow ||
        e.data?.type !== "flow:calc-result"
      )
        return;
      const text = e.data.text;
      if (typeof text === "string" && text.trim()) {
        clip({
          kind: "calc",
          label: "Calcios · COMP",
          text: text.slice(0, 1200),
        });
        notify("العملية والنتيجة اتحفظوا في النوتة.");
      } else notify("احسب عملية في وضع COMP الأول.");
    };
    window.addEventListener("message", read);
    return () => window.removeEventListener("message", read);
  }, [s.id, clip, notify]);
  return (
    <div className="toolView calculatorView">
      <div className="row between wrap">
        <small>Calcios · الآلة الأصلية</small>
        <button
          className="smallBtn"
          onClick={() =>
            ref.current?.contentWindow?.postMessage(
              { type: "flow:copy-calc" },
              location.origin,
            )
          }
        >
          <BookmarkPlus />
          احفظ آخر حساب COMP
        </button>
      </div>
      <iframe
        className="calcframe"
        ref={ref}
        src={"/calcios/index.html?session=" + encodeURIComponent(s.id)}
        title="حاسبة Calcios العلمية"
      />
      <small className="muted">
        {config.groq
          ? "السكانر يرسل الصورة المختارة فقط إلى Groq."
          : "الحساب محلي. سكانر الصور محتاج GROQ_API_KEY على السيرفر."}
      </small>
    </div>
  );
}
