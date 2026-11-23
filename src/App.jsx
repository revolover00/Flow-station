import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUpLeft,
  ArrowLeft,
  ArrowRight,
  Moon,
  Sun,
  Layers3,
  LayoutGrid,
  Check,
  CheckCheck,
  BookOpen,
  FolderOpen,
  SlidersHorizontal,
  Pencil,
  Plug,
  Monitor,
  GripVertical,
  Columns2,
  Maximize2,
  X,
  Pin,
  KeyRound,
  Trash2,
  ExternalLink,
  Clock3,
  Leaf,
} from "lucide-react";
import DeskArt from "./DeskArt";
import { Desk, useDesk, tools, Notice } from "./shared/ui";
import {
  ids,
  empty,
  load,
  uid,
  openTool,
  closeTool,
  stamp,
  remain,
} from "./shared/model";
import Reader from "./tools/Reader";
import Notebook from "./tools/Notebook";
import Timer, { useClock } from "./tools/Timer";
import Assistant from "./tools/Assistant";
import Language from "./tools/Language";
import Video from "./tools/Video";
import Calculator from "./tools/Calculator";
import Browser from "./tools/Browser";
const views = {
  reader: Reader,
  notes: Notebook,
  timer: Timer,
  ai: Assistant,
  translate: Language,
  video: Video,
  calc: Calculator,
  web: Browser,
};
const groups = {
  all: ids,
  sources: ["reader", "video", "web"],
  study: ["notes", "timer", "calc"],
  language: ["translate", "ai"],
};
const groupsAr = {
  all: "الكل",
  sources: "المصادر",
  study: "المذاكرة",
  language: "اللغة والذكاء",
};
function Brand() {
  return (
    <span className="brand" dir="ltr">
      <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="currentColor" />
        <path
          d="M5.6 23 15 9h4.8l-9.4 14zm8.1 0L23 9h4.7l-9.3 14z"
          fill="#eff5dc"
        />
      </svg>
      <b>
        flow<span>station</span>
      </b>
    </span>
  );
}
function Catalog({ close }) {
  const { s, open } = useDesk(),
    [filter, F] = useState("all");
  return (
    <section id="catalog" className="catalog" aria-label="رف الأدوات">
      <div className="catalogTop">
        <div>
          <div className="overline">
            <span className="miniRule" />
            STATION TOOLKIT <i>/</i> 08
          </div>
          <h2>رفّ الأدوات</h2>
          <p>اختار اللي محتاجه دلوقتي. تقدر تغيّر ترتيبك في أي وقت.</p>
        </div>
        <div className="row wrap">
          <div className="filters" aria-label="تصنيف الأدوات">
            {Object.entries(groupsAr).map(([k, v]) => (
              <button key={k} aria-pressed={filter === k} onClick={() => F(k)}>
                {v}
              </button>
            ))}
          </div>
          {close && (
            <button
              className="iconBtn boxed"
              aria-label="اقفل رف الأدوات"
              onClick={close}
            >
              <X />
            </button>
          )}
        </div>
      </div>
      <div className="toolGrid">
        {groups[filter].map((k) => {
          const t = tools[k],
            I = t.icon;
          return (
            <button className="toolCard" key={k} onClick={() => open(k)}>
              <div className="cardCap">
                <span className={"tile " + t.c}>
                  <I />
                </span>
                <span className="num">
                  {String(ids.indexOf(k) + 1).padStart(2, "0")}
                  <i>/</i>08
                </span>
              </div>
              <h3>{t.name}</h3>
              <p>{t.text}</p>
              <div className="cardBase">
                <span className="mono">{t.en}</span>
                <span
                  className="cardPlus"
                  aria-label={s.tools.includes(k) ? "مفتوحة" : "أضف"}
                >
                  {s.tools.includes(k) ? (
                    <Check size={15} />
                  ) : (
                    <Plus size={15} />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
function ClockBadge() {
  const { s } = useDesk(),
    n = useClock(!!s.timer.end);
  return (
    <span className="clockBadge">
      <Clock3 size={14} />
      <bdi>{stamp(remain(s.timer, n))}</bdi>
    </span>
  );
}
function Connections() {
  const { config } = useDesk();
  const [code, C] = useState(""),
    [msg, M] = useState("");
  const services = [
    [
      "Gemini",
      "المساعد والترجمة بالسياق",
      "GEMINI_API_KEY",
      "gemini",
      "https://aistudio.google.com/apikey",
    ],
    [
      "Azure Translator",
      "الترجمة السريعة · اختار فئة F0 المجانية",
      "AZURE_TRANSLATOR_KEY",
      "azure",
      "https://azure.microsoft.com/en-us/pricing/details/translator/",
    ],
    [
      "Groq",
      "سكانر الصور في Calcios فقط",
      "GROQ_API_KEY",
      "groq",
      "https://console.groq.com/keys",
    ],
    [
      "Google Search",
      "بحث داخلي على المواقع المحددة في المحرك",
      "GOOGLE_CSE_ID",
      "cse",
      "https://programmablesearchengine.google.com/controlpanel/all",
    ],
  ];
  return (
    <section className="pageSection">
      <div className="overline">
        <span className="miniRule" /> CONNECTIONS / 04
      </div>
      <h1>ربط الخدمات</h1>
      <p className="lead">
        مكتبك وملفاتك محليّين. الخدمات الخارجية بتستقبل بس اللي تختار تبعته.
        حالة الربط هنا بتفحص وجود الإعداد، مش صلاحية المفتاح عند المزوّد.
      </p>
      {config.failed && (
        <Notice>ماقدرناش نوصل لخادم الخدمات. الأدوات المحلية لسه متاحة.</Notice>
      )}
      <div className="serviceGrid">
        {services.map(([k, desc, env, id, link]) => (
          <article key={k} className="serviceCard">
            <div className="row between">
              <Plug size={20} />
              <span className={"badge " + (config[id] ? "green" : "neutral")}>
                {config[id] ? "الإعداد موجود" : "محتاج إعداد"}
              </span>
            </div>
            <h3 dir="ltr">{k}</h3>
            <p>{desc}</p>
            <code>{env}</code>
            {id === "azure" && (
              <small>ومعه AZURE_TRANSLATOR_REGION لو المورد إقليمي.</small>
            )}
            <a
              className="textBtn"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              صفحة الخدمة <ExternalLink size={13} />
            </a>
          </article>
        ))}
      </div>
      <Notice>
        مفاتيح Gemini وGroq وAzure مكانها على السيرفر في متغيرات البيئة، مش في
        المتصفح. بحث Google الداخلي محتاج معرّف محرك عام (cx) فقط؛ بحث الويب
        الكامل متاح خارجيًا.
      </Notice>
      {config.locked && (
        <form
          className="row wrap"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              sessionStorage.setItem("flow-access", code);
              C("");
              M("اتحفظ رمز التجربة للتبويب ده.");
            } catch {
              M("التخزين في التبويب غير متاح.");
            }
          }}
        >
          <KeyRound size={17} />
          <input
            type="password"
            placeholder="رمز دخول التجربة، مش مفتاح API"
            aria-label="رمز التجربة"
            value={code}
            onChange={(e) => C(e.target.value)}
          />
          <button className="smallBtn">حفظ الرمز</button>
          <small>{msg}</small>
        </form>
      )}
    </section>
  );
}
function SessionView({ db, setDb, s, nav, N, theme, H, config, storageError }) {
  const [toast, V] = useState(""),
    [shelf, K] = useState(false),
    [compact, J] = useState(false),
    [rename, R] = useState(false),
    [source, setSource] = useState(null);
  const toastTimer = useRef(),
    grid = useRef(),
    input = useRef();
  const sid = s.id;
  const patch = useCallback(
    (change) => {
      setDb((d) => ({
        ...d,
        list: d.list.map((x) =>
          x.id === sid
            ? {
                ...x,
                ...(typeof change === "function" ? change(x) : change),
                updated: Date.now(),
              }
            : x,
        ),
      }));
    },
    [sid],
  );
  const notify = useCallback((v) => {
    V(v);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => V(""), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  function open(k) {
    patch((x) => openTool(x, k));
    K(false);
    N("desk");
  }
  function remove(k) {
    patch((x) => closeTool(x, k));
  }
  const clip = useCallback(
    (c) =>
      patch((x) => ({
        clips: [
          { ...c, id: uid(), text: String(c.text || "").slice(0, 18000) },
          ...x.clips,
        ].slice(0, 90),
      })),
    [patch],
  );
  function jump(c) {
    if (c.kind === "file") {
      if (!s.files.some((f) => f.id === c.fileId)) {
        notify("الملف مش موجود في الجلسة.");
        return;
      }
      patch((x) => ({
        ...openTool(x, "reader"),
        doc: c.fileId,
        page: c.page || 1,
        quote: null,
      }));
    } else if (c.kind === "video")
      patch((x) => ({
        ...openTool(x, "video"),
        video: c.video,
        at: c.at || 0,
        seekToken: Date.now(),
      }));
    else if (c.kind === "notes") open("notes");
    N("desk");
    K(false);
  }
  function sendText(k, c) {
    patch((x) => ({
      ...openTool(x, k),
      ...(k === "translate"
        ? { trSeed: { ...c, id: uid() } }
        : { quote: { ...c, id: uid() } }),
    }));
    K(false);
  }
  function make(demo = false) {
    const x = empty(demo ? "تجربة · أساسيات الحركة" : "جلسة جديدة");
    if (demo)
      Object.assign(x, {
        tools: ["reader", "notes"],
        primary: "reader",
        active: "reader",
        side: "notes",
        files: [
          { id: "demo-motion", name: "الحركة · ورقة تدريب", type: "text" },
        ],
        doc: "demo-motion",
        notes:
          "# مراجعة الحركة\n\n- أقرأ تعريف متوسط السرعة.\n- أحسب المثال في Calcios.\n- أختبر نفسي من غير ما أبص للإجابة.",
      });
    setDb((d) => ({ ...d, current: x.id, list: [x, ...d.list] }));
    N("desk");
  }
  useEffect(() => {
    if (!s.timer.end) return;
    const done = () => {
      if (Date.now() < s.timer.end) return;
      patch((x) =>
        x.timer.end !== s.timer.end
          ? {}
          : {
              timer: {
                ...x.timer,
                end: null,
                left: 0,
                done: x.timer.done + (x.timer.mode === "focus" ? 1 : 0),
              },
            },
      );
      notify(
        s.timer.mode === "focus"
          ? "خلص وقت التركيز. خد استراحة."
          : "الاستراحة خلصت. جاهز للجولة الجاية؟",
      );
    };
    const t = setTimeout(done, Math.max(0, s.timer.end - Date.now()) + 40);
    document.addEventListener("visibilitychange", done);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", done);
    };
  }, [s.timer.end, patch]);
  const ctx = {
    s,
    patch,
    open,
    sendText,
    clip,
    jump,
    notify,
    source,
    setSource,
    config,
    goSettings: () => N("settings"),
  };
  const primary = s.primary || s.tools[0],
    side =
      s.side && s.side !== primary
        ? s.side
        : s.tools.find((t) => t !== primary),
    pair = !!side && !compact;
  function resize(clientX) {
    if (!grid.current) return;
    const b = grid.current.getBoundingClientRect();
    patch({
      ratio: Math.max(
        43,
        Math.min(65, Math.round((100 * (b.right - clientX)) / b.width)),
      ),
    });
  }
  function renameEnd() {
    const name = input.current?.value.trim();
    if (name) patch({ title: name.slice(0, 64) });
    R(false);
  }
  return (
    <Desk.Provider value={ctx}>
      <header className="mast">
        <div className="mastInner">
          <button
            className="brandBtn"
            aria-label="Flow Station · المكتب"
            onClick={() => N("desk")}
          >
            <Brand />
          </button>
          <nav className="topNav">
            {[
              ["desk", "مكتبي", LayoutGrid],
              ["sessions", "جلساتي", FolderOpen],
              ["settings", "الربط", SlidersHorizontal],
            ].map(([k, l, I]) => (
              <button
                key={k}
                className={nav === k ? "chosen" : ""}
                onClick={() => N(k)}
              >
                <I size={16} />
                {l}
              </button>
            ))}
          </nav>
          <div className="headActions">
            <button
              className="iconBtn boxed themeBtn"
              aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الغامق"}
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الغامق"}
              onClick={() => H(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <button className="primaryBtn newBtn" onClick={() => make()}>
              <Plus /> جلسة جديدة
            </button>
          </div>
        </div>
      </header>
      <main className="siteWidth">
        <div className="crumb">
          <span className="row">
            <Layers3 size={14} /> مساحتي <i>/</i>{" "}
            {nav === "desk"
              ? "مكتب الجلسة"
              : nav === "sessions"
                ? "الجلسات المحفوظة"
                : "ربط الخدمات"}
          </span>
          <span className="saveState">
            <i />
            {storageError ? "الحفظ المحلي غير متاح" : "على هذا الجهاز"}
          </span>
        </div>
        {storageError && (
          <Notice>
            الذاكرة ممتلئة أو التخزين محظور. صدّر النوتة قبل قفل التبويب.
          </Notice>
        )}
        <div hidden={nav !== "desk"}>
          {!s.tools.length ? (
            <>
              <section className="welcome">
                <div className="intro">
                  <div className="overline">
                    <span className="miniRule" /> THE STUDY DESK <i>/</i> 01
                  </div>
                  <span className="introKicker">مساحة مذاكرة شخصية</span>
                  <h1>
                    مكتبك، <em>على طريقتك.</em>
                  </h1>
                  <p>
                    ورقة، فكرة، وشوية تركيز. اختار أدوات جلستك وخلي كل اللي
                    بتذاكره قدّامك في مكان واحد.
                  </p>
                  <div className="row wrap heroBtns">
                    <button
                      className="primaryBtn"
                      onClick={() => {
                        document
                          .getElementById("catalog")
                          ?.scrollIntoView({
                            behavior: matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                              ? "instant"
                              : "smooth",
                          });
                        document
                          .querySelector(".toolCard")
                          ?.focus({ preventScroll: true });
                      }}
                    >
                      <Plus />
                      أضف أول أداة
                    </button>
                    <button className="softBtn" onClick={() => make(true)}>
                      جرّب جلسة نموذجية <ArrowLeft size={16} />
                    </button>
                  </div>
                </div>
                <div className="artPlate">
                  <DeskArt />
                  <div className="artLabel">
                    <span className="mono">PLATE 01</span>
                    <span>دراسة في التركيز</span>
                  </div>
                </div>
              </section>
              <Catalog />
            </>
          ) : (
            <>
              <div className="deskHeading">
                <div className="titleWrap">
                  <div className="overline">
                    <span className="miniRule" /> LIVE WORKSPACE
                  </div>
                  <div className="row">
                    {rename ? (
                      <input
                        className="rename"
                        ref={input}
                        defaultValue={s.title}
                        maxLength={64}
                        autoFocus
                        onBlur={renameEnd}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") R(false);
                        }}
                      />
                    ) : (
                      <>
                        <h1>{s.title}</h1>
                        <button
                          className="iconBtn"
                          aria-label="تغيير اسم الجلسة"
                          onClick={() => R(true)}
                        >
                          <Pencil size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="row wrap dockActions">
                  {s.tools.includes("timer") && <ClockBadge />}
                  <button
                    className="smallBtn splitBtn"
                    onClick={() => J(!compact)}
                    disabled={!side}
                  >
                    {compact ? <Columns2 /> : <Maximize2 />}
                    {compact ? "عرض اللوحين" : "لوح واحد"}
                  </button>
                  <button
                    className="primaryBtn"
                    aria-expanded={shelf}
                    onClick={() => K(!shelf)}
                  >
                    {shelf ? <X /> : <Plus />}
                    {shelf ? "إغلاق الرف" : "أضف أداة"}
                  </button>
                </div>
              </div>
              {shelf && <Catalog close={() => K(false)} />}
              <div className="toolTabs" aria-label="الأدوات المفتوحة">
                {s.tools.map((k) => {
                  const t = tools[k],
                    I = t.icon;
                  return (
                    <button
                      key={k}
                      aria-pressed={s.active === k}
                      onClick={() => open(k)}
                    >
                      <I size={16} />
                      {t.short}
                    </button>
                  );
                })}
              </div>
              <div
                ref={grid}
                className={"workGrid " + (pair ? "pair" : "single")}
                style={{ "--ratio": (s.ratio || 59) + "%" }}
              >
                {s.tools.map((k) => {
                  const t = tools[k],
                    I = t.icon,
                    View = views[k],
                    position = pair
                      ? k === primary
                        ? "primary"
                        : k === side
                          ? "side"
                          : "off"
                      : k === s.active
                        ? "primary"
                        : "off";
                  return (
                    <section
                      key={k}
                      className="pane"
                      data-slot={position}
                      data-current={k === s.active}
                      aria-label={t.name}
                    >
                      <div className="paneHead">
                        <div className="row">
                          <span className={"tile mini " + t.c}>
                            <I size={16} />
                          </span>
                          <b>{t.name}</b>
                        </div>
                        <div className="row compact">
                          <span className="mono paneEn">{t.en}</span>
                          {k !== primary && (
                            <button
                              className="iconBtn"
                              title="تثبيت كلوح أساسي"
                              aria-label="تثبيت كلوح أساسي"
                              onClick={() =>
                                patch({ primary: k, side: primary, active: k })
                              }
                            >
                              <Pin size={14} />
                            </button>
                          )}
                          <button
                            className="iconBtn"
                            aria-label={"إغلاق " + t.name}
                            onClick={() => remove(k)}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                      <View />
                    </section>
                  );
                })}
                {pair && (
                  <div
                    className="splitter"
                    role="separator"
                    tabIndex={0}
                    aria-label="تغيير عرض اللوحين"
                    aria-orientation="vertical"
                    aria-valuemin="43"
                    aria-valuemax="65"
                    aria-valuenow={s.ratio}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      resize(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId))
                        resize(e.clientX);
                    }}
                    onPointerUp={(e) =>
                      e.currentTarget.releasePointerCapture(e.pointerId)
                    }
                    onKeyDown={(e) => {
                      if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                        e.preventDefault();
                        patch({
                          ratio: Math.max(
                            43,
                            Math.min(
                              65,
                              s.ratio + (e.key === "ArrowLeft" ? 1 : -1),
                            ),
                          ),
                        });
                      }
                    }}
                  >
                    <GripVertical size={13} />
                  </div>
                )}
              </div>
              <div className="deskFooter">
                <span>
                  <CheckCheck size={14} /> الترتيب والنوتس بيتحفظوا محليًا
                </span>
                <span className="mono">
                  {String(s.tools.length).padStart(2, "0")} TOOLS ON DESK
                </span>
              </div>
            </>
          )}
        </div>
        {nav === "settings" && <Connections />}
        {nav === "sessions" && (
          <section className="pageSection">
            <div className="overline">
              <span className="miniRule" /> LOCAL LIBRARY
            </div>
            <h1>جلساتي</h1>
            <p className="lead">
              ارجع لنفس الأدوات، نفس الصفحة، ونفس النوتة على الجهاز ده.
            </p>
            <div className="sessionList">
              {[...db.list]
                .sort((a, b) => b.updated - a.updated)
                .map((x) => (
                  <article key={x.id}>
                    <span className="tile sage">
                      <FolderOpen />
                    </span>
                    <div>
                      <h3>{x.title}</h3>
                      <small>
                        {x.tools.length} أدوات ·{" "}
                        {new Intl.DateTimeFormat("ar-EG", {
                          day: "numeric",
                          month: "long",
                        }).format(x.updated)}
                      </small>
                    </div>
                    <button
                      className="smallBtn"
                      onClick={() => {
                        setDb((d) => ({ ...d, current: x.id }));
                        N("desk");
                      }}
                    >
                      افتح <ArrowLeft size={14} />
                    </button>
                  </article>
                ))}
            </div>
          </section>
        )}
      </main>
      <footer className="footer siteWidth">
        <span className="row">
          <Leaf size={15} /> مساحة هادئة للمذاكرة
        </span>
        <span className="mono">
          FLOW STATION <i>/</i> STUDIO 01
        </span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={16} />
          {toast}
        </div>
      )}
    </Desk.Provider>
  );
}
export default function App() {
  const [db, D] = useState(load),
    [nav, N] = useState("desk"),
    [theme, H] = useState(() => {
      try {
        return localStorage.getItem("flow:theme") === "dark" ? "dark" : "light";
      } catch {
        return "light";
      }
    }),
    [config, C] = useState({}),
    [storageError, Z] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem("flow:desk:v1", JSON.stringify(db));
      Z(false);
    } catch {
      Z(true);
    }
  }, [db]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("flow:theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(C)
      .catch(() => C({ failed: true }));
  }, []);
  const s = db.list.find((x) => x.id === db.current) || db.list[0];
  return (
    <SessionView
      key={s.id}
      {...{ db, setDb: D, s, nav, N, theme, H, config, storageError }}
    />
  );
}
