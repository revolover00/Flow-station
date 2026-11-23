import React, { useState } from "react";
import { Download, Bookmark, Trash2 } from "lucide-react";
import { useDesk, Rich, SourceChip } from "../shared/ui";
import { download } from "../shared/model";
export default function Notebook() {
  const { s, patch } = useDesk();
  const [preview, setPreview] = useState(false);
  return (
    <div className="toolView notebook">
      <div className="row between">
        <div className="segment">
          <button aria-pressed={!preview} onClick={() => setPreview(false)}>
            كتابة
          </button>
          <button aria-pressed={preview} onClick={() => setPreview(true)}>
            معاينة
          </button>
        </div>
        <button
          className="smallBtn"
          onClick={() =>
            download(
              s.title + ".md",
              [
                s.notes,
                ...s.clips.map((c) => "> " + c.text + "\n— " + c.label),
              ].join("\n\n"),
            )
          }
        >
          <Download />
          تصدير
        </button>
      </div>
      {preview ? (
        <div className="noteSheet">
          <Rich text={s.notes || "لسه مفيش ملاحظات مكتوبة."} />
        </div>
      ) : (
        <textarea
          className="noteSheet"
          aria-label="نص الملاحظات"
          dir="auto"
          placeholder="اكتب أول فكرة هنا…"
          value={s.notes}
          maxLength={70000}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      )}
      <div className="minorLine">
        <span>كتابة حرّة · Markdown</span>
        <span>{(s.notes.trim().match(/\S+/g) || []).length} كلمة</span>
      </div>
      <h4 className="row">
        <Bookmark size={16} /> اقتباسات الجلسة <small>{s.clips.length}</small>
      </h4>
      {!s.clips.length ? (
        <p className="muted">
          الاقتباسات من الملف، الفيديو، أو الحاسبة هتتجمع هنا.
        </p>
      ) : (
        s.clips.map((c) => (
          <div className="clipCard" key={c.id}>
            <div dir="auto">{c.text}</div>
            <div className="row between">
              <SourceChip item={c} />
              {!["file", "video", "notes"].includes(c.kind) && (
                <small>{c.label}</small>
              )}
              <button
                className="iconBtn"
                aria-label="حذف الاقتباس"
                onClick={() =>
                  patch((x) => ({
                    clips: x.clips.filter((v) => v.id !== c.id),
                  }))
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
