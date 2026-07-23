const { webkit } = require("playwright");
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: 640, height: 420 } });
  await p.addInitScript(() => {
    const DOC = '## 목록\n\n- 첫째 항목\n- 둘째 항목\n  - 중첩 하나\n  - 중첩 둘\n- 셋째\n';
    window.pywebview = { api: { get_state: async () => ({ text: DOC, title: "t.qmd", path: "/tmp/t.qmd" }), poll: async()=>null, save: async()=>({saved:1}), open_file: async()=>null, resolve_asset: async()=>null, track: async()=>({ok:1}), set_active: async()=>({ok:1}), list_dir: async()=>({entries:[]}), set_folder: async()=>({ok:1}), autosave: async()=>({saved:1}) } };
    window.addEventListener("DOMContentLoaded", () => setTimeout(() => window.dispatchEvent(new Event("pywebviewready")), 50));
  });
  await p.goto("http://127.0.0.1:8377/index.html");
  await p.waitForTimeout(2000);
  await p.evaluate(() => ed.view.dispatch({ selection: { anchor: ed.view.state.doc.length } }));
  await p.waitForTimeout(300);
  await p.screenshot({ path: "/private/tmp/claude-501/-Users-cgb-Dropbox-08-prj-quarto-viewer/f26b7efd-4b53-4c32-86ed-ba48b61f934b/scratchpad/list2.png" });
  await b.close();
})();
