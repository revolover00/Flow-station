import test from "node:test";
import assert from "node:assert/strict";
import {
  empty,
  openTool,
  closeTool,
  remain,
  stamp,
  youtube,
  webUrl,
} from "../src/shared/model.js";
import { config, runAction, handle } from "../server/api.js";
import { Readable } from "node:stream";
test("a new desk is empty; opening and closing tools preserves a nonoverlapping primary/side identity", () => {
  let s = empty();
  assert.equal(s.tools.length, 0);
  for (const k of ["reader", "notes", "ai", "reader", "notes"])
    s = openTool(s, k);
  assert.deepEqual(s.tools, ["reader", "notes", "ai"]);
  assert.equal(s.primary, "reader");
  assert.equal(s.side, "notes");
  for (const k of ["reader", "ai", "notes"]) {
    s = closeTool(s, k);
    if (s.side) assert.notEqual(s.side, s.primary);
  }
  assert.equal(s.active, null);
});
test("timer is driven by an absolute deadline and timestamp notes retain hours", () => {
  assert.equal(remain({ end: 10000 }, 9300), 1);
  assert.equal(remain({ end: 10000 }, 10300), 0);
  assert.equal(stamp(3723), "1:02:03");
});
test("video parsing accepts official links with times and rejects unrelated hosts", () => {
  assert.deepEqual(youtube("https://youtu.be/abcdefghijk?t=1m20s"), {
    id: "abcdefghijk",
    at: 80,
  });
  assert.equal(youtube("https://notyoutube.example/watch?v=abcdefghijk"), null);
  assert.equal(youtube("https://youtube.com/playlist?list=22"), null);
});
test("browser only embeds public HTTPS names, not active schemes, loopback or credentials", () => {
  for (const u of [
    "javascript:alert(1)",
    "http://example.org",
    "https://127.0.0.1",
    "https://[::1]",
    "https://x.local",
    "https://a:b@example.com",
  ])
    assert.equal(webUrl(u), null);
  assert.equal(webUrl("example.org/lecture"), "https://example.org/lecture");
});
test("configuration returns flags but never provider keys or access code", () => {
  const z = config({
    GEMINI_API_KEY: "private-test",
    FLOW_ACCESS_CODE: "pilot-test",
    GOOGLE_CSE_ID: "cx-12345",
  });
  assert.deepEqual(z, {
    gemini: true,
    groq: false,
    azure: false,
    cse: "cx-12345",
    locked: true,
  });
});
test("missing Gemini and Groq keys never trigger an outbound request", async () => {
  const fail = () => {
    throw Error("unexpected call");
  };
  await assert.rejects(
    () => runAction("chat", { question: "why?" }, {}, fail),
    (e) => e.status === 503,
  );
  await assert.rejects(
    () => runAction("scan", { image: "abc" }, {}, fail),
    (e) => e.status === 503,
  );
});
test("Azure request uses official endpoint, region and optional auto detection", async () => {
  let call;
  const result = await runAction(
    "translate",
    { text: "energy", to: "ar", from: "auto", provider: "azure" },
    { AZURE_TRANSLATOR_KEY: "dummy", AZURE_TRANSLATOR_REGION: "eastus" },
    async (url, init) => {
      call = { url, init };
      return Response.json([
        {
          translations: [{ text: "طاقة" }],
          detectedLanguage: { language: "en" },
        },
      ]);
    },
  );
  assert.equal(result.text, "طاقة");
  assert.match(
    call.url,
    /^https:\/\/api\.cognitive\.microsofttranslator\.com\/translate\?/,
  );
  assert.equal(new URL(call.url).searchParams.has("from"), false);
  assert.equal(call.init.headers["Ocp-Apim-Subscription-Region"], "eastus");
  assert.deepEqual(JSON.parse(call.init.body), [{ text: "energy" }]);
});
test("contextual translation is explicit; standard translation never silently bills Gemini", async () => {
  await assert.rejects(
    () =>
      runAction(
        "translate",
        { provider: "azure", to: "ar", text: "hello" },
        { GEMINI_API_KEY: "dummy" },
      ),
    (e) => e.status === 503,
  );
  await assert.rejects(
    () =>
      runAction("translate", { provider: "gemini", to: "x", text: "hi" }, {}),
    (e) => e.status === 400,
  );
});
test("Gemini receives only supplied context; no thought parts rendered", async () => {
  let raw;
  const j = await runAction(
    "chat",
    { question: "hint?", context: "80 m in 20 s", label: "p.1", mode: "hint" },
    { GEMINI_API_KEY: "dummy" },
    async (u, init) => {
      raw = JSON.parse(init.body);
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ thought: true, text: "hidden" }, { text: "A hint" }],
            },
          },
        ],
      });
    },
  );
  assert.equal(j.text, "A hint");
  assert.match(raw.systemInstruction.parts[0].text, /one useful hint/);
  assert.match(raw.contents[0].parts[0].text, /80 m/);
});
test("scanner accepts image data only, uses Calcios JSON schema, and enforces output shape", async () => {
  let raw;
  const j = await runAction(
    "scan",
    { image: "data:image/png;base64,YWJj" },
    { GROQ_API_KEY: "dummy" },
    async (u, i) => {
      raw = JSON.parse(i.body);
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                expression: "frac(1,2)",
                mode: "COMP",
                angle: null,
              }),
            },
          },
        ],
      });
    },
  );
  assert.equal(j.expression, "frac(1,2)");
  assert.equal(raw.model, "qwen/qwen3.8-27b");
  await assert.rejects(
    () =>
      runAction(
        "scan",
        { image: "https://invalid.example/a.png" },
        { GROQ_API_KEY: "dummy" },
      ),
    (e) => e.status === 400,
  );
});
test("origin, method, private-pilot policy, size limit, and missing keys are honest HTTP failures", async () => {
  const run = async (action, method, headers, body = {}, env = {}) => {
    const req = Readable.from([]);
    Object.assign(req, {
      url: "/api/" + action,
      method,
      headers: {
        host: "station.example",
        "content-type": "application/json",
        ...headers,
      },
      body,
    });
    const res = {
      statusCode: 0,
      setHeader() {},
      end(v) {
        this.body = JSON.parse(v);
      },
    };
    await handle(req, res, env);
    return res;
  };
  assert.equal(
    (await run("chat", "POST", { origin: "https://other.example" })).statusCode,
    403,
  );
  assert.equal((await run("translate", "GET", {})).statusCode, 405);
  assert.equal(
    (
      await run(
        "chat",
        "POST",
        {},
        {},
        { GEMINI_API_KEY: "dummy", VERCEL: "1" },
      )
    ).statusCode,
    503,
  );
  assert.equal(
    (await run("chat", "POST", {}, {}, { FLOW_ACCESS_CODE: "demo" }))
      .statusCode,
    401,
  );
  assert.equal(
    (await run("chat", "POST", { "content-length": "999999" })).statusCode,
    413,
  );
  assert.equal(
    (await run("chat", "POST", {}, { question: "hi" })).statusCode,
    503,
  );
  assert.equal((await run("config", "GET", {})).body.gemini, false);
});
