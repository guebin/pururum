const { webkit } = require("playwright");
(async()=>{
  const b=await webkit.launch(); const p=await b.newPage({viewport:{width:1200,height:900}});
  p.on("pageerror",e=>console.log("[pageerror]",e.message));
  await p.addInitScript(()=>{
    const DOC='위\n\n::: {.panel-tabset}\n## Python\n파이썬 내용\n\n## R\nR 내용\n:::\n\n아래\n';
    window.pywebview={api:{get_state:async()=>({text:DOC,title:"t.qmd",path:"/tmp/t.qmd"}),poll:async()=>null,save:async()=>({saved:true}),open_file:async()=>null,resolve_asset:async()=>null,track:async()=>({ok:true}),set_active:async()=>({ok:true}),list_dir:async()=>({entries:[]}),set_folder:async()=>({ok:true}),autosave:async()=>({skipped:1})}};
    window.addEventListener("DOMContentLoaded",()=>setTimeout(()=>window.dispatchEvent(new Event("pywebviewready")),50));
  });
  await p.goto("http://127.0.0.1:8377/index.html"); await p.waitForTimeout(1500);
  const out={};
  out.tabsetRendered = await p.evaluate(()=>!!document.querySelector(".qv-hastabset .tab-btn"));
  // click the tabset body (not a tab-btn) → modal opens prefilled
  const box=await p.evaluate(()=>{const el=document.querySelector(".qv-hastabset .tab-panel")||document.querySelector(".qv-hastabset");const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height-8};});
  await p.mouse.click(box.x,box.y); await p.waitForTimeout(400);
  out.modalOpen = await p.evaluate(()=>!document.getElementById("tabset-modal").hasAttribute("hidden"));
  out.tabTitles = await p.evaluate(()=>[...document.querySelectorAll("#tabset-tabbar input")].map(i=>i.value));
  out.firstBody = await p.evaluate(()=>document.getElementById("tabset-body").value);
  // add a tab, rename it, edit body, apply
  await p.evaluate(()=>document.getElementById("tabset-addtab").click());
  await p.waitForTimeout(150);
  await p.evaluate(()=>{const i=document.querySelector("#tabset-tabbar .tstab.active input");i.value="줄리아";i.dispatchEvent(new Event("input"));document.getElementById("tabset-body").value="줄리아 내용";});
  await p.evaluate(()=>document.getElementById("tabset-apply").click());
  await p.waitForTimeout(500);
  const doc=await p.evaluate(()=>ed.view.state.doc.toString());
  out.applied = doc;
  out.hasThreeTabs = (doc.match(/^## /gm)||[]).length===3 && doc.includes("줄리아");
  // reopen and DELETE
  const box2=await p.evaluate(()=>{const el=document.querySelector(".qv-hastabset");const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height-8};});
  await p.mouse.click(box2.x,box2.y); await p.waitForTimeout(400);
  await p.evaluate(()=>document.getElementById("tabset-delete").click());
  await p.waitForTimeout(400);
  out.afterDelete = await p.evaluate(()=>ed.view.state.doc.toString());
  out.tabsetGone = !out.afterDelete.includes("panel-tabset");
  console.log(JSON.stringify(out,null,1));
  await b.close();
})();
