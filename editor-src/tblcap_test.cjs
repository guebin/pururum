const { webkit } = require("playwright");
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.addInitScript(() => {
    const DOC = '# 제목\n\n본문\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n: 원래 표 캡션\n\n끝\n';
    window.pywebview = { api: {
      get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }),
      poll: async () => null, save: async () => ({ saved: true }), open_file: async () => null,
      resolve_asset: async () => null, track: async () => ({ ok: 1 }), set_active: async () => ({ ok: 1 }),
      list_dir: async () => ({ entries: [] }), set_folder: async () => ({ ok: 1 }), autosave: async () => ({ saved: 1 }) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  });
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(1800);
  const out = {};
  // caption rendered as <caption> in the table widget, no stray ": caption" paragraph
  out.hasCaptionEl = await page.evaluate(() => !!document.querySelector(".qv-hastable caption"));
  out.captionText = await page.evaluate(() => document.querySelector(".qv-hastable caption")?.textContent || null);
  out.noStrayP = await page.evaluate(() => ![...document.querySelectorAll(".qv-hastable p")].some(p => /^\s*:/.test(p.textContent)));
  // click table → modal prefilled with caption
  const tb = await page.evaluate(() => { const t = document.querySelector(".qv-hastable table"); const r = t.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height - 6 }; });
  await page.mouse.click(tb.x, tb.y); await page.waitForTimeout(300);
  out.modalOpen = await page.evaluate(() => !document.getElementById("table-modal").hasAttribute("hidden"));
  out.prefillCap = await page.evaluate(() => document.getElementById("tbl-caption").value);
  // change caption, apply
  await page.evaluate(() => { document.getElementById("tbl-caption").value = "표 1. 새 캡션"; document.getElementById("tbl-apply").click(); });
  await page.waitForTimeout(400);
  out.doc = await page.evaluate(() => ed.view.state.doc.toString());
  out.docHasNewCap = out.doc.includes(": 표 1. 새 캡션");
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
