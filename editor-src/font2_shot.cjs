const { webkit } = require("playwright");
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: 640, height: 380 } });
  p.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await p.addInitScript(() => {
    const DOC = '---\ntitle: "테스트"\n---\n\n## 나눔명조\n\n한글 English 123 잘 나오나요\n';
    window.pywebview = { api: { get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }), poll: async()=>null, save: async()=>({saved:1}), open_file: async()=>null, resolve_asset: async()=>null, track: async()=>({ok:1}), set_active: async()=>({ok:1}), list_dir: async()=>({entries:[]}), set_folder: async()=>({ok:1}), autosave: async()=>({saved:1}) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  });
  await p.goto("http://127.0.0.1:8377/index.html");
  await p.waitForTimeout(2200);
  console.log("fontLoaded", await p.evaluate(() => document.fonts.check("16px NanumMyeongjo")));
  console.log("scrollerFont", await p.evaluate(() => getComputedStyle(document.querySelector(".cm-scroller")).fontFamily));
  await b.close();
})();
