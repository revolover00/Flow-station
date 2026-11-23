import React, { useState, useEffect, useRef } from "react";
import {
  Globe2,
  Search,
  ExternalLink,
  BookmarkPlus,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useDesk, Notice, EmptyTool } from "../shared/ui";
import { webUrl } from "../shared/model";
export default function Browser() {
  const { s, patch, config, notify, goSettings } = useDesk();
  const [address, A] = useState(""),
    [hist, H] = useState([null]),
    [at, T] = useState(0),
    [err, E] = useState(""),
    [wiki, W] = useState(null),
    [pending, B] = useState(false);
  const req = useRef();
  const item = hist[at],
    q = item?.q || "",
    url = item?.url || "",
    search = "https://www.google.com/search?q=" + encodeURIComponent(q),
    external = url || search;
  useEffect(() => () => req.current?.abort(), []);
  const clear = () => {
    req.current?.abort();
    W(null);
    E("");
    B(false);
  };
  const go = (o) => {
    clear();
    const list = [...hist.slice(0, at + 1), o].slice(-25);
    H(list);
    T(list.length - 1);
    A(o?.url || o?.q || "");
  };
  const step = (n) => {
    clear();
    T(n);
    A(hist[n]?.url || hist[n]?.q || "");
  };
  function submit(e) {
    e.preventDefault();
    const v = address.trim().slice(0, 600);
    if (!v) return;
    const url = webUrl(v);
    if (
      !url &&
      (/^[\w+.-]+:\/\//.test(v) ||
        /^(javascript:|data:|file:|localhost\b)/i.test(v))
    ) {
      E("استخدم رابط HTTPS عام من غير بيانات دخول، أو اكتب كلمات بحث.");
      return;
    }
    go(url ? { url } : { q: v.slice(0, 350) });
  }
  async function wikiSearch() {
    req.current?.abort();
    const c = new AbortController();
    req.current = c;
    B(true);
    E("");
    try {
      const lang = /[\u0600-\u06ff]/.test(q) ? "ar" : "en",
        u = new URL(`https://${lang}.wikipedia.org/w/api.php`);
      u.search = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: q,
        srlimit: 5,
        srprop: "",
        format: "json",
        origin: "*",
      });
      const res = await fetch(u, { signal: c.signal, credentials: "omit" });
      if (!res.ok) throw Error();
      const j = await res.json();
      W(
        (j.query?.search || []).map((x) => ({
          name: x.title,
          url: `https://${lang}.wikipedia.org/?curid=${Number(x.pageid)}`,
        })),
      );
    } catch (e) {
      if (e.name !== "AbortError")
        E("تعذّر الوصول لويكيبيديا. تقدر تفتح بحث Google الخارجي.");
    } finally {
      if (req.current === c) B(false);
    }
  }
  return (
    <div className="toolView browser">
      <div className="row compact">
        <button
          className="iconBtn"
          aria-label="رجوع"
          disabled={at === 0}
          onClick={() => step(at - 1)}
        >
          <ArrowRight />
        </button>
        <button
          className="iconBtn"
          aria-label="تقدّم"
          disabled={at >= hist.length - 1}
          onClick={() => step(at + 1)}
        >
          <ArrowLeft />
        </button>
        <button
          className="iconBtn"
          aria-label="بداية المتصفح"
          onClick={() => go(null)}
        >
          <Home />
        </button>
      </div>
      <form onSubmit={submit} className="searchbar">
        <Globe2 size={17} />
        <input
          value={address}
          onChange={(e) => A(e.target.value)}
          maxLength={600}
          dir="auto"
          aria-label="بحث أو عنوان ويب"
          placeholder="ابحث أو الصق رابط HTTPS…"
        />
        <button className="roundCTA" aria-label="انتقل أو ابحث">
          <Search size={16} />
        </button>
      </form>
      {err && <Notice>{err}</Notice>}
      {!item ? (
        <>
          <EmptyTool icon={Globe2} title="نافذة للمصادر، جوّه مكتبك">
            ابحث في المواقع التعليمية المختارة أو افتح رابطًا بيسمح بالعرض هنا.
            كل نتيجة ليها طريق للموقع الأصلي.
          </EmptyTool>
          <div className="row wrap">
            <button
              className="smallBtn"
              onClick={() => go({ q: "قوانين الحركة في الفيزياء" })}
            >
              قوانين الحركة
            </button>
            <button
              className="smallBtn"
              onClick={() => go({ q: "OpenStax biology" })}
            >
              OpenStax Biology
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="row wrap">
            <a
              className="smallBtn"
              href={external}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              {url ? "افتح الموقع الأصلي" : "بحث Google على الويب كله"}
            </a>
            <button
              className="smallBtn"
              onClick={() => {
                if (!s.bookmarks.some((v) => (v.url || v.q) === (url || q)))
                  patch((x) => ({
                    bookmarks: [item, ...x.bookmarks].slice(0, 35),
                  }));
                notify("اتحفظ في مصادر الجلسة.");
              }}
            >
              <BookmarkPlus />
              احفظ
            </button>
          </div>
          {url ? (
            <>
              <p className="muted">
                معاينة معزولة. بعض المواقع تمنع التضمين أو تحتاج تسجيل دخول؛ لو
                المعاينة فاضية افتح الموقع الأصلي.
              </p>
              <iframe
                className="webframe"
                key={url}
                title="معاينة موقع خارجي"
                src={url}
                sandbox="allow-forms allow-scripts"
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            <>
              {config.cse ? (
                <iframe
                  className="webframe"
                  title="نتائج Google للمواقع المحددة"
                  sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  src={
                    "/google-search.html?" +
                    new URLSearchParams({ cx: config.cse, q })
                  }
                />
              ) : (
                <Notice>
                  بحث Google الداخلي محتاج معرّف محرك البحث <bdi>(cx)</bdi>.
                  تقدر تفتح بحث Google فوق أو تبحث هنا في ويكيبيديا.{" "}
                  <button className="textBtn" onClick={goSettings}>
                    تفاصيل الربط
                  </button>
                </Notice>
              )}
              <button
                className="smallBtn"
                onClick={wikiSearch}
                disabled={pending}
              >
                <BookOpen />
                {pending ? "بنبحث…" : "ابحث هنا في ويكيبيديا"}
              </button>
              {wiki && (
                <div className="webResults">
                  <small>نتائج ويكيبيديا · مش نتائج Google</small>
                  {wiki.length ? (
                    wiki.map((x) => (
                      <button
                        className="listBtn"
                        key={x.url}
                        onClick={() => go({ url: x.url })}
                      >
                        {x.name} ←
                      </button>
                    ))
                  ) : (
                    <p>مفيش نتائج للاسم ده.</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
      {s.bookmarks.length > 0 && (
        <div className="webResults">
          <h4>مصادر محفوظة</h4>
          {s.bookmarks.map((v, i) => (
            <div key={v.url || v.q} className="row between">
              <button
                className="textBtn wrapLink"
                onClick={() => go(v)}
                dir="auto"
              >
                {v.url || v.q}
              </button>
              <button
                className="textBtn"
                onClick={() =>
                  patch((x) => ({
                    bookmarks: x.bookmarks.filter((_, k) => k !== i),
                  }))
                }
              >
                حذف
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
