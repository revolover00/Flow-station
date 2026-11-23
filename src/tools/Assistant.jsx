import React, { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowUp, BookOpen, BookmarkPlus } from "lucide-react";
import { useDesk, Notice, Rich, SourceChip } from "../shared/ui";
import { callApi, uid } from "../shared/model";
const modes = { explain: "اشرح لي", hint: "تلميح واحد", quiz: "اختبرني" };
export default function Assistant() {
  const { s, patch, source, config, clip, goSettings, notify } = useDesk();
  const [q, Q] = useState(""),
    [mode, M] = useState("explain"),
    [scope, S] = useState("file"),
    [busy, B] = useState(false),
    [error, E] = useState("");
  const req = useRef(null),
    bottom = useRef();
  useEffect(() => () => req.current?.abort(), []);
  useEffect(() => {
    if (s.quote?.id) S("file");
  }, [s.quote?.id]);
  const ctx =
    scope === "notes"
      ? s.notes.trim()
        ? { kind: "notes", label: "دفتر الجلسة", text: s.notes }
        : null
      : scope === "file"
        ? s.quote || source
        : null;
  async function ask(e) {
    e?.preventDefault();
    if (!q.trim() || busy || !config.gemini) return;
    const question = q.trim(),
      hist = s.chat
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 5000) })),
      ref = ctx
        ? {
            kind: ctx.kind,
            fileId: ctx.fileId,
            page: ctx.page,
            label: ctx.label,
          }
        : null;
    const msg = { id: uid(), role: "user", text: question };
    patch((x) => ({ chat: [...x.chat, msg].slice(-36) }));
    Q("");
    B(true);
    E("");
    let controller = new AbortController();
    req.current = controller;
    try {
      const j = await callApi(
        "chat",
        {
          question,
          mode,
          context: (ctx?.text || "").slice(0, 14000),
          label: ctx?.label || "",
          history: hist,
        },
        controller.signal,
      );
      patch((x) => ({
        chat: [
          ...x.chat,
          { id: uid(), role: "assistant", text: j.text.slice(0, 18000), ref },
        ].slice(-36),
      }));
    } catch (e) {
      if (e.name !== "AbortError") {
        E(e.message);
        Q(question);
        patch((x) => ({ chat: x.chat.filter((m) => m.id !== msg.id) }));
      }
    } finally {
      B(false);
    }
  }
  return (
    <div className="toolView assistant">
      <div className="aiBar">
        <span className="eyetag">
          <i /> GEMINI
        </span>
        <span>مساعد الجلسة</span>
      </div>
      <div className="row wrap">
        <label className="smallLabel" htmlFor="ctx">
          السياق
        </label>
        <select id="ctx" value={scope} onChange={(e) => S(e.target.value)}>
          <option value="file">التحديد أو الصفحة الحالية</option>
          <option value="notes">نوتة الجلسة</option>
          <option value="none">سؤال عام</option>
        </select>
      </div>
      {ctx ? (
        <div className="contextLine">
          <BookOpen size={14} />
          {ctx.label} <small>· {Math.min(14000, ctx.text.length)} حرف</small>
          {s.quote && scope === "file" && (
            <button className="textBtn" onClick={() => patch({ quote: null })}>
              فكّ التحديد
            </button>
          )}
        </div>
      ) : (
        <small className="muted">
          {scope === "none"
            ? "سؤال عام من غير إرسال أي ملف."
            : "مفيش نص من المصدر ده حاليًا؛ السؤال هيكون عامًا."}
        </small>
      )}
      <div className="dialogue" aria-live="polite">
        {!s.chat.length && (
          <div className="aiWelcome">
            <Sparkles size={32} />
            <h3>نفهمها سوا؟</h3>
            <p>اسأل عن فكرة واحدة، أو اختار تلميح عشان تكمّل الحل بنفسك.</p>
          </div>
        )}
        {s.chat.map((m) => (
          <article
            key={m.id}
            className={m.role === "assistant" ? "reply" : "userQ"}
          >
            <small>{m.role === "assistant" ? "Flow · الرد" : "إنت"}</small>
            <Rich text={m.text} />
            {m.role === "assistant" && (
              <div className="row wrap">
                {m.ref && <SourceChip item={m.ref} />}
                <button
                  className="textBtn"
                  onClick={() => {
                    clip({
                      kind: "assistant",
                      label: "من المساعد",
                      text: m.text,
                    });
                    notify("الرد اتحفظ في النوتة.");
                  }}
                >
                  <BookmarkPlus size={14} /> حفظ
                </button>
              </div>
            )}
          </article>
        ))}
        {busy && <p>Gemini بيجهّز الرد…</p>}
        <span ref={bottom} />
      </div>
      {!config.gemini && (
        <Notice>
          الواجهة جاهزة. الردود الحقيقية محتاجة <bdi>GEMINI_API_KEY</bdi> على
          السيرفر.{" "}
          <button className="textBtn" onClick={goSettings}>
            تفاصيل الربط
          </button>
        </Notice>
      )}
      {error && <Notice>{error}</Notice>}
      <form onSubmit={ask} className="composer">
        <div className="segment">
          {Object.entries(modes).map(([k, v]) => (
            <button
              type="button"
              key={k}
              aria-pressed={k === mode}
              onClick={() => M(k)}
            >
              {v}
            </button>
          ))}
        </div>
        <textarea
          dir="auto"
          rows="2"
          maxLength={5000}
          aria-label="سؤال المساعد"
          placeholder="اكتب سؤالك…"
          value={q}
          onChange={(e) => Q(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              ask();
            }
          }}
        />
        <div className="row between">
          <small>
            السؤال والسياق وآخر ٦ رسائل · <bdi>Ctrl ↵</bdi>
          </small>
          <button
            aria-label="إرسال السؤال"
            className="roundCTA"
            disabled={!config.gemini || busy || !q.trim()}
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
