const { webkit } = require("playwright");
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAIAAAA48Cq8AAAA7UlEQVR42u3SQQ0AAAjEsJONHDShCA+EZ5MqWJbqgXeRAGNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlgYSwWMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSy4WAtXe/7Pn5SqAAAAAElFTkSuQmCC";
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.addInitScript((png) => {
    const DOC = '# 제목\n\n본문\n\n::: {.callout-note}\n원래 노트 내용\n:::\n\n끝\n';
    window.pywebview = { api: {
      get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }),
      poll: async () => null, save: async () => ({ saved: true }), open_file: async () => null,
      resolve_asset: async () => png, save_drawing: async () => ({ path: "attachments/draw-1.png" }),
      track: async () => ({ ok: true }), set_active: async () => ({ ok: true }),
      list_dir: async () => ({ entries: [] }), set_folder: async () => ({ ok: true }),
      autosave: async () => ({ saved: true }) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  }, PNG);
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(2000);
  const out = {};
  // callout rendered as fixed widget with badge
  out.calloutWidget = await page.evaluate(() => !!document.querySelector(".qv-hascallout"));
  out.calloutBadge = await page.evaluate(() => !!document.querySelector(".qv-hascallout .qv-delx"));
  // click callout body → popup opens prefilled
  const co = await page.evaluate(() => { const c = document.querySelector(".callout-body"); const r = c.getBoundingClientRect(); return { x: r.x + 20, y: r.y + 8 }; });
  await page.mouse.click(co.x, co.y); await page.waitForTimeout(300);
  out.modalOpen = await page.evaluate(() => !document.getElementById("callout-modal").hasAttribute("hidden"));
  out.prefillType = await page.evaluate(() => document.querySelector("#co-types button.on")?.dataset.co);
  out.prefillBody = await page.evaluate(() => document.getElementById("co-body").value);
  // change type to warning, set title, apply
  await page.evaluate(() => document.querySelector('#co-types button[data-co="warning"]').click());
  await page.evaluate(() => { document.getElementById("co-title").value = "조심"; document.getElementById("co-body").value = "새 내용"; });
  await page.evaluate(() => document.getElementById("co-apply").click());
  await page.waitForTimeout(400);
  out.afterApply = await page.evaluate(() => ed.view.state.doc.toString());
  // insert menu: single callout button → newCalloutViaEditor
  out.menuHasOne = await page.evaluate(() => document.querySelectorAll('#insert-menu [data-snip^="callout"]').length);
  out.newCallout = await page.evaluate(() => { newCalloutViaEditor(); const o = !document.getElementById("callout-modal").hasAttribute("hidden"); document.getElementById("co-cancel").click(); return o; });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
