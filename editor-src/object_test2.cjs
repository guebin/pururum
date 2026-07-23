const { webkit } = require("playwright");
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAIAAAA48Cq8AAAA7UlEQVR42u3SQQ0AAAjEsJONHDShCA+EZ5MqWJbqgXeRAGNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlgYSwWMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSy4WAtXe/7Pn5SqAAAAAElFTkSuQmCC";
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.addInitScript((png) => {
    const DOC = '# 제목\n\n본문 문단입니다.\n\n![](img/a.png)\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n끝\n';
    window.pywebview = { api: {
      get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }),
      poll: async () => null, save: async () => ({ saved: true }), open_file: async () => null,
      resolve_asset: async () => png, save_drawing: async () => ({ path: "attachments/draw-1.png" }),
      track: async () => ({ ok: true }), set_active: async () => ({ ok: true }),
      list_dir: async () => ({ entries: [] }), set_folder: async () => ({ ok: true }),
      autosave: async () => ({ saved: true, title: "t.qmd", path: "/tmp/t.qmd" }) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  }, PNG);
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(2000);
  const out = {};
  out.menuTable = await page.evaluate(() => { newTableViaEditor(); const o = !document.getElementById("table-modal").hasAttribute("hidden"); document.getElementById("tbl-cancel").click(); return o; });
  out.menuTabset = await page.evaluate(() => { newTabsetViaEditor(); const o = !document.getElementById("tabset-modal").hasAttribute("hidden"); document.getElementById("tabset-cancel").click(); return o; });
  await page.evaluate(() => { const v = ed.view; v.dispatch({ selection: { anchor: v.state.doc.length } }); insertBlock("callout-note"); });
  out.calloutSnippet = await page.evaluate(() => ed.view.state.doc.toString().includes("::: {.callout-note}"));
  const im = await page.evaluate(() => { const i = document.querySelector(".qv-img"); const r = i.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height*0.7 }; });
  await page.mouse.click(im.x, im.y); await page.waitForTimeout(400);
  out.imgModalOpen = await page.evaluate(() => !document.getElementById("image-modal").hasAttribute("hidden"));
  const cv = await page.evaluate(() => { const c = document.getElementById("img-canvas"); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.move(cv.x + cv.w*0.3, cv.y + cv.h*0.3); await page.mouse.down();
  await page.mouse.move(cv.x + cv.w*0.7, cv.y + cv.h*0.6, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  out.dirty = await page.evaluate(() => imgDirty);
  await page.evaluate(() => document.getElementById("img-apply").click());
  await page.waitForTimeout(500);
  out.afterAnnotate = await page.evaluate(() => ed.view.state.doc.toString().split("\n").find((l) => l.startsWith("![]")));
  out.tableBadge = await page.evaluate(() => !!document.querySelector(".qv-hastable .qv-delx"));
  await page.evaluate(() => document.querySelector(".qv-hastable .qv-delx").dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
  await page.waitForTimeout(300);
  out.tableAfterBadge = await page.evaluate(() => /\| A \| B \|/.test(ed.view.state.doc.toString()));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
