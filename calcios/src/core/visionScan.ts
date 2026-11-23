// Calcios integration: image preparation and 2D normalisation are upstream; credentials stay on the server.
import type { AngleUnit } from './value';
export interface ScannedMathResult {expression:string; mode:'COMP'|'CMPLX'; angle?:AngleUnit;}
function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image file.'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downscales large camera photos on a canvas to <= 1280px JPEG for sub-second upload
 * while staying well within Groq's 20MB / 2048-token vision budget.
 */
export async function prepareImageDataUrl(file: Blob): Promise<string> {
  const rawDataUrl = await readBlobAsDataUrl(file);
  if (file.size < 650_000 || typeof document === 'undefined' || typeof Image === 'undefined') {
    return rawDataUrl;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      const timer = setTimeout(() => reject(new Error('Image decode timeout')), 1500);
      el.onload = () => {
        clearTimeout(timer);
        resolve(el);
      };
      el.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Image decode failed'));
      };
      el.src = rawDataUrl;
    });
    const maxDim = 1280;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return rawDataUrl;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    if (scale === 1 && rawDataUrl.length < 900_000) {
      return rawDataUrl;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', 0.86);
    return compressed.startsWith('data:image/') ? compressed : rawDataUrl;
  } catch {
    return rawDataUrl;
  }
}

function extractBraceGroup(s: string, openIdx: number): { content: string; nextIdx: number } | null {
  if (s[openIdx] !== '{') return null;
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: s.slice(openIdx + 1, i), nextIdx: i + 1 };
      }
    }
  }
  return null;
}

function readSubOrSupBound(s: string, idx: number): { content: string; nextIdx: number } | null {
  let i = idx;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (s[i] === '{') return extractBraceGroup(s, i);
  const m = s.slice(i).match(/^(?:\\[a-zA-Z]+|-?[0-9]+(?:\.[0-9]+)?|[a-zA-Zπ](?:=[0-9a-zA-Z+-]+)?)/);
  if (!m) return null;
  return { content: m[0], nextIdx: i + m[0].length };
}

function replaceLatexConstructs(input: string): string {
  let s = input;
  for (let pass = 0; pass < 16; pass++) {
    let changed = false;

    // \int_{low}^{high} body dx
    const intMatch = s.match(/\\int\s*_/);
    if (intMatch && intMatch.index !== undefined) {
      const uIdx = s.indexOf('_', intMatch.index);
      const low = readSubOrSupBound(s, uIdx + 1);
      if (low) {
        let j = low.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        if (s[j] === '^') {
          const high = readSubOrSupBound(s, j + 1);
          if (high) {
            const tail = s.slice(high.nextIdx);
            const dxMatch = tail.match(/^(.+?)\s*(?:\\,)?\s*d([a-zA-Z])\b/);
            if (dxMatch) {
              const afterDx = high.nextIdx + dxMatch[0].length;
              const dummyVar = dxMatch[2];
              let integrand = dxMatch[1].trim();
              if (dummyVar.toUpperCase() !== 'X') {
                integrand = integrand.replace(new RegExp(`(?<!\\\\)\\b${dummyVar}\\b`, 'g'), 'X');
              }
              s = `${s.slice(0, intMatch.index)}integ(${integrand},${low.content.trim()},${high.content.trim()})${s.slice(afterDx)}`;
              changed = true;
              continue;
            }
          }
        }
      }
    }

    // \sum_{x=low}^{high} body  OR  \prod_{x=low}^{high} body
    const sumProdMatch = s.match(/\\(sum|prod)\s*_/);
    if (sumProdMatch && sumProdMatch.index !== undefined) {
      const fnName = sumProdMatch[1] === 'prod' ? 'prod' : 'sigma';
      const uIdx = s.indexOf('_', sumProdMatch.index);
      const lowRaw = readSubOrSupBound(s, uIdx + 1);
      if (lowRaw) {
        let j = lowRaw.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        if (s[j] === '^') {
          const high = readSubOrSupBound(s, j + 1);
          if (high) {
            const varMatch = lowRaw.content.trim().match(/^([a-zA-Z])\s*=\s*/);
            const dummyVar = varMatch ? varMatch[1] : null;
            const lowClean = lowRaw.content.replace(/^[a-zA-Z]\s*=\s*/, '').trim();
            let k = high.nextIdx;
            while (k < s.length && /\s/.test(s[k])) k++;
            let body = '';
            let restIdx = s.length;
            if (s[k] === '{') {
              const gb = extractBraceGroup(s, k);
              if (gb) {
                body = gb.content.trim();
                restIdx = gb.nextIdx;
              }
            }
            if (!body) {
              // Scan single summand/factor term up to top-level binary + / - / =
              let depth = 0;
              let idx = k;
              for (; idx < s.length; idx++) {
                const ch = s[idx];
                if (ch === '(' || ch === '{' || ch === '[') depth++;
                else if (ch === ')' || ch === '}' || ch === ']') {
                  if (depth === 0) break;
                  depth--;
                } else if (depth === 0 && idx > k && (ch === '+' || ch === '-' || ch === '=')) {
                  const prevNonSpace = s.slice(k, idx).trimEnd().slice(-1);
                  if (prevNonSpace && !'+-×*/^_('.includes(prevNonSpace)) break;
                }
              }
              body = s.slice(k, idx).trim();
              restIdx = idx;
            }
            if (body) {
              if (dummyVar && dummyVar.toUpperCase() !== 'X') {
                body = body.replace(new RegExp(`(?<!\\\\)\\b${dummyVar}\\b`, 'g'), 'X');
              }
              s = `${s.slice(0, sumProdMatch.index)}${fnName}(${body},${lowClean},${high.content.trim()})${s.slice(restIdx)}`;
              changed = true;
              continue;
            }
          }
        }
      }
    }

    // \binom{n}{r} -> (n)nCr(r)
    const binomMatch = s.match(/\\binom\s*\{/);
    if (binomMatch && binomMatch.index !== undefined) {
      const b1 = s.indexOf('{', binomMatch.index);
      const g1 = extractBraceGroup(s, b1);
      if (g1) {
        let j = g1.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        const g2 = extractBraceGroup(s, j);
        if (g2) {
          const nPart = /^[0-9a-zA-Z]+$/.test(g1.content.trim()) ? g1.content.trim() : `(${g1.content.trim()})`;
          const rPart = /^[0-9a-zA-Z]+$/.test(g2.content.trim()) ? g2.content.trim() : `(${g2.content.trim()})`;
          s = `${s.slice(0, binomMatch.index)}${nPart}nCr${rPart}${s.slice(g2.nextIdx)}`;
          changed = true;
          continue;
        }
      }
    }

    // Mixed fraction: 2\frac{3}{4} or 12 \frac{1}{2} -> mfrac(2,3,4)
    const mfracMatch = s.match(/(?<![0-9a-zA-Z.\\])(\d+)\s*\\[dt]?frac\s*\{/);
    if (mfracMatch && mfracMatch.index !== undefined) {
      const whole = mfracMatch[1];
      const brace1Idx = s.indexOf('{', mfracMatch.index + whole.length);
      const g1 = extractBraceGroup(s, brace1Idx);
      if (g1) {
        let j = g1.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        const g2 = extractBraceGroup(s, j);
        if (g2) {
          s = `${s.slice(0, mfracMatch.index)}mfrac(${whole},${g1.content},${g2.content})${s.slice(g2.nextIdx)}`;
          changed = true;
          continue;
        }
      }
    }

    // \frac{a}{b} or \dfrac{a}{b} or \tfrac{a}{b}
    const fracMatch = s.match(/\\[dt]?frac\s*\{/);
    if (fracMatch && fracMatch.index !== undefined) {
      const brace1Idx = s.indexOf('{', fracMatch.index);
      const g1 = extractBraceGroup(s, brace1Idx);
      if (g1) {
        let j = g1.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        const g2 = extractBraceGroup(s, j);
        if (g2) {
          s = `${s.slice(0, fracMatch.index)}frac(${g1.content},${g2.content})${s.slice(g2.nextIdx)}`;
          changed = true;
          continue;
        }
      }
    }

    // \sqrt[n]{x}
    const rootMatch = s.match(/\\sqrt\s*\[([^\]]+)\]\s*\{/);
    if (rootMatch && rootMatch.index !== undefined) {
      const idxText = rootMatch[1];
      const braceIdx = s.indexOf('{', rootMatch.index + rootMatch[0].length - 1);
      const g = extractBraceGroup(s, braceIdx);
      if (g) {
        const replacement = idxText.trim() === '3' ? `cbrt(${g.content})` : `root(${idxText.trim()},${g.content})`;
        s = `${s.slice(0, rootMatch.index)}${replacement}${s.slice(g.nextIdx)}`;
        changed = true;
        continue;
      }
    }

    // \sqrt{x}
    const sqrtMatch = s.match(/\\sqrt\s*\{/);
    if (sqrtMatch && sqrtMatch.index !== undefined) {
      const braceIdx = s.indexOf('{', sqrtMatch.index);
      const g = extractBraceGroup(s, braceIdx);
      if (g) {
        s = `${s.slice(0, sqrtMatch.index)}sqrt(${g.content})${s.slice(g.nextIdx)}`;
        changed = true;
        continue;
      }
    }

    // \log_{b}{x}, \log_{b}(x), \log_2(8), \log_2 8
    const logbSub = s.match(/\\log\s*_/);
    if (logbSub && logbSub.index !== undefined) {
      const uIdx = s.indexOf('_', logbSub.index);
      const gb = readSubOrSupBound(s, uIdx + 1);
      if (gb) {
        let j = gb.nextIdx;
        while (j < s.length && /\s/.test(s[j])) j++;
        if (s[j] === '{') {
          const gx = extractBraceGroup(s, j);
          if (gx) {
            s = `${s.slice(0, logbSub.index)}logb(${gb.content.trim()},${gx.content})${s.slice(gx.nextIdx)}`;
            changed = true;
            continue;
          }
        } else if (s[j] === '(') {
          s = `${s.slice(0, logbSub.index)}logb(${gb.content.trim()},${s.slice(j + 1)}`;
          changed = true;
          continue;
        } else {
          const argMatch = s.slice(j).match(/^([0-9a-zA-Zπ.]+)/);
          if (argMatch) {
            s = `${s.slice(0, logbSub.index)}logb(${gb.content.trim()},${argMatch[1]})${s.slice(j + argMatch[1].length)}`;
            changed = true;
            continue;
          }
        }
      }
    }

    // ^{exp} -> ^(exp)
    const powBrace = s.match(/\^\s*\{/);
    if (powBrace && powBrace.index !== undefined) {
      const bIdx = s.indexOf('{', powBrace.index);
      const g = extractBraceGroup(s, bIdx);
      if (g) {
        s = `${s.slice(0, powBrace.index)}^(${g.content})${s.slice(g.nextIdx)}`;
        changed = true;
        continue;
      }
    }

    if (!changed) break;
  }
  return s;
}

/**
 * Normalizes LLM math output (Calcios 2D syntax, ASCII math, or stray LaTeX)
 * into clean, valid Calcios 2D Natural Math expression syntax.
 */
export function normalizeToCalcios2D(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
  s = s.replace(/^\$\$?/, '').replace(/\$\$?$/, '').trim();

  s = replaceLatexConstructs(s);

  s = s
    .replace(/\\left\s*\|([^|]+)\\right\s*\|/g, 'abs($1)')
    .replace(/\\left\s*/g, '')
    .replace(/\\right\s*/g, '')
    .replace(/\\cdot|\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\angle/g, '∠')
    .replace(/\\arcsin|\\sin\s*\^\s*\{?-1\}?/g, 'asin')
    .replace(/\\arccos|\\cos\s*\^\s*\{?-1\}?/g, 'acos')
    .replace(/\\arctan|\\tan\s*\^\s*\{?-1\}?/g, 'atan')
    .replace(/\\(sinh|cosh|tanh|sin|cos|tan|ln|log)\b/g, '$1')
    .replace(/[−–—]/g, '-')
    .replace(/\*/g, '×');

  // Preserve sexagesimal DMS (e.g. 12°30'45" or 12°30′) as 12°30°45° while stripping standalone degree sign in sin(30°)
  s = s.replace(
    /(\d+)\s*°\s*(\d+)\s*(?:['′’]|°)(?:\s*(\d+(?:\.\d+)?)\s*(?:["″”]|''|°))?/g,
    (_m, deg: string, min: string, sec?: string) =>
      sec !== undefined ? `${deg}\uE000${min}\uE000${sec}\uE000` : `${deg}\uE000${min}\uE000`,
  );

  s = s.replace(/\|([^|]+)\|/g, 'abs($1)');
  s = s.replace(/\^(?!\()(-?[0-9a-zA-Zπ]+)/g, '^($1)');
  s = s.replace(/\bpi\b/gi, 'π');
  s = s.replace(/\bx\b/g, 'X').replace(/\by\b/g, 'Y');
  s = s.replace(/(\d)x\b/g, '$1X').replace(/(\d)y\b/g, '$1Y');
  s = s.replace(/\s*=\s*\??\s*$/, '');
  s = s.replace(/°/g, '').replace(/\uE000/g, '°');
  s = s.replace(/\s+/g, '');

  return s;
}

export async function scanMathFromImage(file:Blob):Promise<ScannedMathResult> {
 if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>12000000) throw new Error('Choose a JPG, PNG or WebP under 12 MB.');
 const image=await prepareImageDataUrl(file); if(image.length>3500000) throw new Error('Please crop the image first.');
 let code='';try{code=sessionStorage.getItem('flow-access')||'';}catch{}
 const res=await fetch('/api/scan',{method:'POST',headers:{'Content-Type':'application/json','x-flow-code':code},body:JSON.stringify({image})});
 const data=await res.json();if(!res.ok)throw new Error(data.error || 'Scanner unavailable.');
 const expr=normalizeToCalcios2D(data.expression||'');if(!expr)throw new Error('No expression found.');
 return {expression:expr,mode:(data.mode==='CMPLX'||expr.includes('∠')||/(^|[^a-zA-Z])i([^a-zA-Z]|$)/.test(expr))?'CMPLX':'COMP',angle:data.angle==='DEG'||(data.expression||'').includes('°')?'DEG':data.angle==='RAD'?'RAD':undefined};
}
