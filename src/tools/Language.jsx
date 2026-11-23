import React, { useState, useEffect, useRef } from "react";
import { Languages, ArrowLeft, BookmarkPlus } from "lucide-react";
import { useDesk, Notice } from "../shared/ui";
import { callApi } from "../shared/model";
const names = {
  auto: "اكتشاف تلقائي",
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  de: "الألمانية",
  es: "الإسبانية",
  it: "الإيطالية",
  tr: "التركية",
};
export default function Language() {
  const { s, config, clip, notify, goSettings } = useDesk();
  const [text, T] = useState(s.trSeed?.text?.slice(0, 4500) || ""),
    [from, F] = useState("auto"),
    [to, G] = useState("ar"),
    [provider, P] = useState("azure"),
    [live, B] = useState(false),
    [out, O] = useState(""),
    [err, E] = useState(""),
    [busy, S] = useState(false);
  const req = useRef(null),
    seq = useRef(0),
    cache = useRef(new Map());
  useEffect(() => {
    if (s.trSeed?.id) {
      T(s.trSeed.text.slice(0, 4500));
      O("");
    }
  }, [s.trSeed?.id]);
  const capable =
    provider === "device"
      ? "Translator" in window
      : provider === "azure"
        ? config.azure
        : config.gemini;
  async function translate() {
    if (!text.trim() || !capable) return;
    const key = JSON.stringify([provider, from, to, text]);
    const n = ++seq.current;
    req.current?.abort();
    if (cache.current.has(key)) {
      E("");
      O(cache.current.get(key));
      S(false);
      return;
    }
    const c = new AbortController();
    req.current = c;
    S(true);
    E("");
    O("");
    try {
      let val;
      if (provider === "device") {
        if (from === "auto")
          throw Error("اختار لغة المصدر للترجمة على الجهاز.");
        if (from === to) throw Error("اختار لغتين مختلفتين.");
        const options = { sourceLanguage: from, targetLanguage: to };
        if ((await window.Translator.availability(options)) === "unavailable")
          throw Error("زوج اللغات مش متاح للترجمة على الجهاز.");
        const t = await window.Translator.create(options);
        try {
          val = await t.translate(text);
        } finally {
          t.destroy?.();
        }
      } else {
        val = (
          await callApi("translate", { text, from, to, provider }, c.signal)
        ).text;
      }
      if (n === seq.current) {
        if (cache.current.size >= 30)
          cache.current.delete(cache.current.keys().next().value);
        cache.current.set(key, val);
        O(val);
      }
    } catch (e) {
      if (n === seq.current && e.name !== "AbortError") E(e.message);
    } finally {
      if (n === seq.current) S(false);
    }
  }
  useEffect(() => {
    ++seq.current;
    req.current?.abort();
    S(false);
    O("");
    E("");
    let id;
    if (live && text.trim() && capable && provider !== "device")
      id = setTimeout(translate, 850);
    return () => {
      clearTimeout(id);
      req.current?.abort();
    };
  }, [text, from, to, provider, live, capable]);
  return (
    <div className="toolView">
      <div className="field">
        <label htmlFor="transProvider">طريقة الترجمة</label>
        <select
          id="transProvider"
          value={provider}
          onChange={(e) => {
            P(e.target.value);
            B(false);
          }}
        >
          <option value="azure">ترجمة مباشرة · Azure</option>
          <option value="gemini">ترجمة أكاديمية بالسياق · Gemini</option>
          <option value="device">على الجهاز · المتصفحات المدعومة</option>
        </select>
      </div>
      <div className="langPair">
        <select
          aria-label="لغة المصدر"
          value={from}
          onChange={(e) => F(e.target.value)}
        >
          {Object.entries(names).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <ArrowLeft size={17} />
        <select
          aria-label="لغة الترجمة"
          value={to}
          onChange={(e) => G(e.target.value)}
        >
          {Object.entries(names)
            .slice(1)
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </select>
      </div>
      <textarea
        aria-label="النص للترجمة"
        dir="auto"
        rows="5"
        maxLength={4500}
        placeholder="الصق فقرة أو اختار «ترجم» من الملف…"
        value={text}
        onChange={(e) => T(e.target.value)}
      />
      <div className="minorLine">
        <span>
          {provider === "device"
            ? "النص يفضل على جهازك."
            : "النص المكتوب فقط بيتبعت للمزوّد المختار."}
        </span>
        <span dir="ltr">{text.length}/4500</span>
      </div>
      {!capable && (
        <Notice>
          {provider === "device" ? (
            "المتصفح ده ما بيوفّرش ترجمة محلية. اختار Azure أو Gemini."
          ) : (
            <>
              الطريقة دي لسه مش مربوطة.{" "}
              <button className="textBtn" onClick={goSettings}>
                إعداد الخدمات
              </button>
            </>
          )}
        </Notice>
      )}
      <div className="row wrap">
        <button
          className="primaryBtn"
          disabled={!capable || busy || !text.trim()}
          onClick={translate}
        >
          <Languages />
          {busy ? "بيترجم…" : "ترجم النص"}
        </button>
        {provider !== "device" && (
          <label className="check">
            <input
              type="checkbox"
              disabled={!capable}
              checked={live}
              onChange={(e) => B(e.target.checked)}
            />{" "}
            تلقائي أثناء الكتابة
          </label>
        )}
      </div>
      {err && <Notice>{err}</Notice>}
      {out && (
        <div className="answer">
          <small>الترجمة</small>
          <p dir="auto">{out}</p>
          <button
            className="smallBtn"
            onClick={() => {
              clip({
                kind: "translation",
                label: "ترجمة · " + names[to],
                text: text + "\n" + out,
              });
              notify("الترجمة اتحفظت في النوتة.");
            }}
          >
            <BookmarkPlus />
            احفظ في النوتة
          </button>
        </div>
      )}
    </div>
  );
}
