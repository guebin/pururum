const { webkit } = require("playwright");
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.addInitScript(() => {
    const DOC = '# 제목\n\n본문\n\n```python\nprint("hi")\n```\n\n끝\n';
    window.pywebview = { api: {
      get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }),
      poll: async () => null, save: async () => ({ saved: true }), open_file: async () => null,
      resolve_asset: async () => null, track: async () => ({ ok: true }), set_active: async () => ({ ok: true }),
      list_dir: async () => ({ entries: [] }), set_folder: async () => ({ ok: true }), autosave: async () => ({ saved: true }) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  });
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(1800);
  const out = {};
  out.codeWidget = await page.evaluate(() => !!document.querySelector(".qv-hascode"));
  out.codeBadge = await page.evaluate(() => !!document.querySelector(".qv-hascode .qv-delx"));
  const c = await page.evaluate(() => { const p = document.querySelector(".qv-hascode pre") || document.querySelector(".qv-hascode"); const r = p.getBoundingClientRect(); return { x: r.x + 30, y: r.y + 10 }; });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(250);
  out.modalOpen = await page.evaluate(() => !document.getElementById("code-modal").hasAttribute("hidden"));
  out.prefillLang = await page.evaluate(() => document.getElementById("code-lang").value);
  out.prefillCode = await page.evaluate(() => document.getElementById("code-body").value);
  await page.evaluate(() => { document.getElementById("code-lang").value = "r"; document.getElementById("code-body").value = "x <- 1\nprint(x)"; document.getElementById("code-apply").click(); });
  await page.waitForTimeout(300);
  out.afterApply = await page.evaluate(() => ed.view.state.doc.toString());
  // insert menu code → popup
  out.newCode = await page.evaluate(() => { newCodeViaEditor(); const o = !document.getElementById("code-modal").hasAttribute("hidden"); document.getElementById("code-cancel").click(); return o; });
  // backspace-delete: caret after code widget
  await page.evaluate(() => { const t = ed.view.state.doc.toString(); const i = t.indexOf("```r"); const end = t.indexOf("```", i + 3) + 3; ed.view.dispatch({ selection: { anchor: end } }); ed.view.focus(); });
  await page.keyboard.press("Backspace"); await page.waitForTimeout(200);
  out.afterBksp = await page.evaluate(() => ed.view.state.doc.toString().includes("```"));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
