const { webkit } = require("playwright");
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAIAAAA48Cq8AAAA7UlEQVR42u3SQQ0AAAjEsJONHDShCA+EZ5MqWJbqgXeRAGNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSwwFsbCWGAsjIWxwFgYC2OBsTAWxgJjYSyMBcbCWBgLjIWxMBYYC2NhLDAWxsJYYCyMhbHAWBgLY4GxMBbGAmNhLIwFxsJYGAuMhbEwFhgLY2EsMBbGwlgYSwWMhbEwFhgLY2EsMBbGwlhgLIyFscBYGAtjgbEwFsYCY2EsjAXGwlgYC4yFsTAWGAtjYSy4WAtXe/7Pn5SqAAAAAElFTkSuQmCC";
(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.addInitScript((png) => {
    const DOC = '# 제목\n\n본문\n\n![](img/a.png)\n\n끝\n';
    window.pywebview = { api: {
      get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }),
      poll: async () => null, save: async () => ({ saved: true }), open_file: async () => null,
      resolve_asset: async () => png, save_drawing: async () => ({ path: "attachments/draw-1.png" }),
      track: async () => ({ ok: 1 }), set_active: async () => ({ ok: 1 }),
      list_dir: async () => ({ entries: [] }), set_folder: async () => ({ ok: 1 }), autosave: async () => ({ saved: 1 }) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  }, PNG);
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(1800);
  const out = {};
  const im = await page.evaluate(() => { const i = document.querySelector(".qv-img"); const r = i.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height*0.7 }; });
  await page.mouse.click(im.x, im.y); await page.waitForTimeout(300);
  out.modalOpen = await page.evaluate(() => !document.getElementById("image-modal").hasAttribute("hidden"));
  await page.evaluate(() => { document.getElementById("img-caption").value = "그림 1. 테스트 캡션"; });
  await page.evaluate(() => document.getElementById("img-apply").click());
  await page.waitForTimeout(400);
  out.afterApply = await page.evaluate(() => ed.view.state.doc.toString().split("\n").find((l) => l.startsWith("![")));
  out.editorCaption = await page.evaluate(() => document.querySelector(".qv-imgcap")?.textContent || null);
  // render caption in export pipeline
  out.exportFig = await page.evaluate(async () => {
    const host = document.createElement("div"); host.className = "qdoc";
    host.innerHTML = mdToHtml("![그림 1. 캡션](x.png)");
    await enhance(host);
    return { hasFigure: !!host.querySelector("figure"), cap: host.querySelector("figcaption")?.textContent || null };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
