// Study adaptation of the official iframe + playback messages in revolover00/youtube-free-ads.
// See licenses/YOUTUBIY-MIT.txt. No feed or background autoplay.
import React, { useState, useRef, useEffect, useMemo } from "react";
import { PlaySquare, Play, BookmarkPlus, ExternalLink } from "lucide-react";
import { useDesk, Notice, EmptyTool } from "../shared/ui";
import { youtube, stamp } from "../shared/model";
const yt = "https://www.youtube.com";
export default function Video() {
  const { s, patch, clip, notify } = useDesk();
  const [v, V] = useState(""),
    [err, E] = useState(""),
    [note, N] = useState(""),
    [sec, S] = useState(s.at || 0);
  const frame = useRef(),
    current = useRef(s.at || 0),
    saved = useRef(s.at || 0);
  const send = (o) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify(o), yt);
  const src = useMemo(() => {
    current.current = s.at || 0;
    saved.current = current.current;
    return `${yt}/embed/${s.video}?${new URLSearchParams({ enablejsapi: "1", origin: location.origin, playsinline: "1", hl: "ar", rel: "0", start: String(Math.floor(s.at || 0)) })}`;
  }, [s.video]);
  useEffect(() => {
    S(current.current);
    const f = (e) => {
      if (e.origin !== yt || e.source !== frame.current?.contentWindow) return;
      try {
        const m = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        let t = m?.info?.currentTime;
        if (m?.event === "infoDelivery" && Number.isFinite(t) && t >= 0) {
          t = Math.floor(t);
          current.current = t;
          S(t);
          if (Math.abs(t - saved.current) >= 8) {
            saved.current = t;
            patch({ at: t });
          }
        }
      } catch {}
    };
    addEventListener("message", f);
    return () => removeEventListener("message", f);
  }, [s.video]);
  useEffect(() => {
    if (s.seekToken && s.video) {
      current.current = s.at || 0;
      S(current.current);
      send({ event: "command", func: "seekTo", args: [current.current, true] });
    }
  }, [s.seekToken]);
  function open(e) {
    e.preventDefault();
    const x = youtube(v);
    if (!x) {
      E("استخدم رابط فيديو YouTube صالح، مش رابط قناة أو قائمة.");
      return;
    }
    E("");
    patch({ video: x.id, at: x.at, seekToken: Date.now() });
    V("");
  }
  return (
    <div className="toolView">
      <form className="searchbar" onSubmit={open}>
        <input
          dir="auto"
          aria-label="رابط فيديو YouTube"
          placeholder="الصق رابط YouTube…"
          value={v}
          onChange={(e) => V(e.target.value)}
        />
        <button className="roundCTA" aria-label="تشغيل الفيديو">
          <Play size={16} />
        </button>
      </form>
      {err && <Notice>{err}</Notice>}
      {!s.video ? (
        <EmptyTool icon={PlaySquare} title="المحاضرة، من غير الزحمة">
          نفس أسلوب مشغّل Youtubiy. أضف رابطًا واحتفظ بملاحظات مربوطة بوقت
          الشرح.
        </EmptyTool>
      ) : (
        <>
          <iframe
            className="player"
            ref={frame}
            title="مشغّل Youtubiy للجلسة"
            src={src}
            onLoad={() =>
              send({ event: "listening", id: 1, channel: "widget" })
            }
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <a
            className="textBtn"
            href={`${yt}/watch?v=${s.video}&t=${sec}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} /> افتح الأصل لو الفيديو مانع التضمين
          </a>
          <div className="field">
            <label htmlFor="timeNote">
              ملاحظة عند <bdi>{stamp(sec)}</bdi>
            </label>
            <textarea
              id="timeNote"
              rows="3"
              placeholder="إيه اللي عايز تفتكره من اللحظة دي؟"
              value={note}
              maxLength={3000}
              onChange={(e) => N(e.target.value)}
            />
          </div>
          <button
            className="smallBtn"
            onClick={() => {
              const at = current.current;
              clip({
                kind: "video",
                video: s.video,
                at,
                label: "الفيديو · " + stamp(at),
                text: note.trim() || "ارجع للحظة دي من الشرح.",
              });
              N("");
              notify("اتحفظت نوتة بالتوقيت.");
            }}
          >
            <BookmarkPlus />
            دوّن عند <bdi>{stamp(sec)}</bdi>
          </button>
        </>
      )}
    </div>
  );
}
