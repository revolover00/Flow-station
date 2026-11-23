import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Languages,
  Sparkles,
  BookmarkPlus,
} from "lucide-react";
import { useDesk, Notice, EmptyTool } from "../shared/ui";
import { uid, getFile, saveFile } from "../shared/model";
async function pdfLib() {
  const p = await import("pdfjs-dist");
  p.GlobalWorkerOptions.workerSrc = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ).default;
  return p;
}
export default function Reader() {
  const { s, patch, setSource, sendText, clip, notify } = useDesk();
  const [doc, setDoc] = useState(null),
    [text, setText] = useState(""),
    [sel, setSel] = useState(""),
    [pdf, setPdf] = useState(null),
    [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [w, setW] = useState(500),
    [view, setView] = useState("page");
  const input = useRef(),
    canvas = useRef(),
    area = useRef();
  const file = s.files.find((x) => x.id === s.doc),
    page = s.page || 1;
  useEffect(() => {
    let live = true,
      obj = "",
      task;
    setError("");
    setText("");
    setSel("");
    setPdf(null);
    setUrl("");
    setDoc(null);
    setSource(null);
    if (!file) {
      setBusy(false);
      return;
    }
    setBusy(true);
    (async () => {
      try {
        const blob = await getFile(file.id);
        if (!live) return;
        if (file.type === "pdf") {
          const lib = await pdfLib();
          if (!live) return;
          task = lib.getDocument({
            data: new Uint8Array(await blob.arrayBuffer()),
            isEvalSupported: false,
            useSystemFonts: true,
          });
          const pdfd = await task.promise;
          if (live) setPdf(pdfd);
        } else if (file.type === "image") {
          obj = URL.createObjectURL(blob);
          if (live) setUrl(obj);
        } else {
          const t = (await blob.text()).slice(0, 350000);
          if (live) setText(t);
        }
        if (live) setDoc(file.id);
      } catch (e) {
        if (live)
          setError("تعذّر فتح الملف. لو الملف PDF محمي، افتح نسخة غير محمية.");
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => {
      live = false;
      task?.destroy()?.catch(() => {});
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [s.doc]);
  useEffect(() => {
    if (!pdf) return;
    let live = true;
    setText("");
    setSel("");
    (async () => {
      try {
        const p = await pdf.getPage(Math.min(page, pdf.numPages));
        const c = await p.getTextContent();
        if (live)
          setText(
            c.items
              .map((i) => i.str + (i.hasEOL ? "\n" : " "))
              .join("")
              .trim(),
          );
      } catch {
        if (live) setError("نص الصفحة غير متاح.");
      }
    })();
    return () => {
      live = false;
    };
  }, [pdf, page]);
  useEffect(() => {
    if (!file || doc !== file.id || !text.trim()) {
      setSource(null);
      return;
    }
    setSource({
      kind: "file",
      fileId: file.id,
      page,
      label:
        file.name.slice(0, 80) + (file.type === "pdf" ? " · ص " + page : ""),
      text: text.slice(0, 14000),
    });
  }, [text, doc, page, s.doc]);
  useEffect(() => {
    if (!area.current) return;
    const r = new ResizeObserver((entries) => {
      const n = entries[0].contentRect.width;
      if (n > 100) setW(Math.floor(n));
    });
    r.observe(area.current);
    return () => r.disconnect();
  }, [doc, view]);
  useEffect(() => {
    if (!pdf || view !== "page" || !canvas.current) return;
    let live = true,
      job;
    (async () => {
      try {
        const p = await pdf.getPage(Math.min(page, pdf.numPages));
        if (!live || !canvas.current) return;
        const base = p.getViewport({ scale: 1 }),
          scale =
            Math.min(2, (w - 18) / base.width) *
            Math.min(devicePixelRatio || 1, 2),
          v = p.getViewport({ scale: Math.max(0.25, scale) }),
          el = canvas.current;
        el.width = Math.ceil(v.width);
        el.height = Math.ceil(v.height);
        job = p.render({
          canvas: el,
          canvasContext: el.getContext("2d"),
          viewport: v,
        });
        await job.promise;
      } catch (e) {
        if (live && e.name !== "RenderingCancelledException")
          setError("تعذّر رسم الصفحة. جرّب عرض النص.");
      }
    })();
    return () => {
      live = false;
      job?.cancel();
    };
  }, [pdf, page, w, view, doc]);
  useEffect(() => {
    const f = () => {
      let sel = window.getSelection();
      if (
        sel?.anchorNode &&
        area.current?.contains(sel.anchorNode) &&
        sel.toString().trim()
      )
        setSel(sel.toString().trim().slice(0, 14000));
    };
    document.addEventListener("selectionchange", f);
    return () => document.removeEventListener("selectionchange", f);
  }, []);
  async function upload(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setError("الحد الأقصى ٢٠ ميجابايت للملف.");
      return;
    }
    const ext = f.name.split(".").pop().toLowerCase();
    const type =
      ext === "pdf"
        ? "pdf"
        : ["jpg", "jpeg", "png", "webp"].includes(ext)
          ? "image"
          : ["txt", "md", "csv"].includes(ext)
            ? "text"
            : null;
    if (!type) {
      setError("ندعم PDF، الصور، وملفات TXT / MD / CSV.");
      return;
    }
    try {
      const id = uid();
      await saveFile(id, f);
      patch((x) => ({
        files: [...x.files, { id, type, name: f.name.slice(0, 140) }],
        doc: id,
        page: 1,
        quote: null,
      }));
      setView("page");
    } catch {
      setError("التخزين المحلي غير متاح أو امتلأ.");
    }
  }
  const selection = () => ({
    kind: "file",
    fileId: s.doc,
    page,
    label:
      (file?.name || "ملف").slice(0, 80) +
      (file?.type === "pdf" ? " · ص " + page : ""),
    text: (sel || text).slice(0, 14000),
  });
  return (
    <div className="reader toolView">
      <input
        ref={input}
        hidden
        type="file"
        accept=".pdf,.txt,.md,.csv,.jpg,.jpeg,.png,.webp"
        onChange={upload}
      />
      <div className="row wrap">
        <button className="smallBtn" onClick={() => input.current.click()}>
          <Upload />
          استيراد ملف
        </button>
        {s.files.length > 0 && (
          <select
            aria-label="اختر ملفًا"
            value={s.doc || ""}
            onChange={(e) =>
              patch({ doc: e.target.value, page: 1, quote: null })
            }
          >
            {s.files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <Notice>{error}</Notice>}
      {!file ? (
        <>
          <EmptyTool icon={FileText} title="هات أول ورقة للمكتب">
            PDF أو صور أو نصوص. ملفاتك بتتخزّن على جهازك وما بتتبعتش تلقائيًا
            لأي خدمة.
          </EmptyTool>
          <button
            className="textBtn"
            onClick={() =>
              patch((x) => ({
                files: x.files.some((f) => f.id === "demo-motion")
                  ? x.files
                  : [
                      ...x.files,
                      {
                        id: "demo-motion",
                        type: "text",
                        name: "الحركة · ورقة تدريب",
                      },
                    ],
                doc: "demo-motion",
                page: 1,
              }))
            }
          >
            أو افتح ورقة تدريب نموذجية ←
          </button>
        </>
      ) : busy ? (
        <p className="muted" role="status">
          بنفتح الملف…
        </p>
      ) : (
        <>
          {pdf && (
            <div className="row wrap pdfbar">
              <div className="segment">
                {["page", "text"].map((v, i) => (
                  <button
                    key={v}
                    aria-pressed={v === view}
                    onClick={() => setView(v)}
                  >
                    {i ? "نص قابل للتحديد" : "الصفحة"}
                  </button>
                ))}
              </div>
              <button
                className="iconBtn"
                aria-label="الصفحة السابقة"
                disabled={page <= 1}
                onClick={() => patch({ page: page - 1, quote: null })}
              >
                <ChevronRight />
              </button>
              <small>
                {page} / {pdf.numPages}
              </small>
              <button
                className="iconBtn"
                aria-label="الصفحة التالية"
                disabled={page >= pdf.numPages}
                onClick={() => patch({ page: page + 1, quote: null })}
              >
                <ChevronLeft />
              </button>
            </div>
          )}
          <div
            className={
              "paper " +
              (file.type === "pdf" && view === "page" ? "canvasWrap" : "")
            }
            ref={area}
          >
            {file.type === "image" ? (
              <img src={url || undefined} alt={file.name} />
            ) : file.type === "pdf" && view === "page" ? (
              <canvas ref={canvas} aria-label={"PDF صفحة " + page} />
            ) : (
              <>
                <span className="paperKicker">
                  <BookOpen size={13} /> ورقة الجلسة
                </span>
                <div className="readText" dir="auto">
                  {text ||
                    "مفيش طبقة نص في الصفحة دي. جرّب ملفًا نصّيًا بدل الصورة الممسوحة."}
                </div>
              </>
            )}
          </div>
          {text.trim() && (
            <div className="readActions">
              <small>
                {sel ? "التحديد الحالي" : "النص الحالي"}{" "}
                {sel && (
                  <button className="textBtn" onClick={() => setSel("")}>
                    إلغاء التحديد
                  </button>
                )}
              </small>
              <div className="row wrap">
                <button
                  className="smallBtn"
                  onClick={() => sendText("translate", selection())}
                >
                  <Languages />
                  ترجم
                </button>
                <button
                  className="smallBtn"
                  onClick={() => sendText("ai", selection())}
                >
                  <Sparkles />
                  اسأل المساعد
                </button>
                <button
                  className="smallBtn"
                  onClick={() => {
                    clip({
                      ...selection(),
                      text: (sel || text).slice(0, 1800),
                    });
                    notify("اتحفظ الاقتباس في النوتة.");
                  }}
                >
                  <BookmarkPlus />
                  اقتبس
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
