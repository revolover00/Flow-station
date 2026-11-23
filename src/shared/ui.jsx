import React, { createContext, useContext } from "react";
import {
  BookOpen,
  NotebookPen,
  Timer,
  Calculator,
  PlaySquare,
  Languages,
  Sparkles,
  Globe2,
  Info,
  Link2,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
export const Desk = createContext(null),
  useDesk = () => useContext(Desk);
export const tools = {
  reader: {
    name: "قارئ الملفات",
    short: "الملف",
    en: "READER",
    icon: BookOpen,
    c: "sage",
    text: "افتح ملفًا وحدّد فقرة ترجع لها.",
  },
  notes: {
    name: "دفتر الملاحظات",
    short: "النوتة",
    en: "NOTEBOOK",
    icon: NotebookPen,
    c: "sand",
    text: "اكتب أفكارك واربطها بمصادرها.",
  },
  timer: {
    name: "مؤقّت التركيز",
    short: "المؤقّت",
    en: "POMODORO",
    icon: Timer,
    c: "apricot",
    text: "اضبط وقت المذاكرة والاستراحة.",
  },
  calc: {
    name: "الآلة العلمية",
    short: "Calcios",
    en: "CALCIOS",
    icon: Calculator,
    c: "blue",
    text: "احسب بدقّة أو امسح مسألة بصورة.",
  },
  video: {
    name: "فيديو المحاضرة",
    short: "الفيديو",
    en: "YOUTUBIY",
    icon: PlaySquare,
    c: "rose",
    text: "شاهد الشرح ودوّن عند أي ثانية.",
  },
  translate: {
    name: "الترجمة",
    short: "الترجمة",
    en: "TRANSLATE",
    icon: Languages,
    c: "mint",
    text: "ترجم نصًا أو فقرة من ملف الجلسة.",
  },
  ai: {
    name: "مساعد المذاكرة",
    short: "المساعد",
    en: "GEMINI",
    icon: Sparkles,
    c: "lilac",
    text: "اطلب شرحًا، تلميحًا، أو سؤال مراجعة.",
  },
  web: {
    name: "متصفّح الدراسة",
    short: "المتصفّح",
    en: "WEB DESK",
    icon: Globe2,
    c: "sky",
    text: "ابحث في Google واحفظ مصادر مفيدة.",
  },
};
export function Notice({ children }) {
  return (
    <div className="notice" role="status">
      <Info size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Rich({ text }) {
  return (
    <div className="prose" dir="auto">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: () => null,
          a: ({ href, children }) =>
            /^https?:\/\//i.test(href || "") ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
export function SourceChip({ item }) {
  const { jump } = useDesk();
  return item?.kind && ["file", "video", "notes"].includes(item.kind) ? (
    <button type="button" className="sourceChip" onClick={() => jump(item)}>
      <Link2 size={13} />
      {item.label}
    </button>
  ) : null;
}
export function EmptyTool({ icon: Icon, title, children }) {
  return (
    <div className="toolEmpty">
      <div className="bigIcon">
        <Icon size={27} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
