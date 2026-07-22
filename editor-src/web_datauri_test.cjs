const { webkit } = require("playwright");
(async()=>{
  const browser=await webkit.launch();
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on("pageerror",e=>console.log("[pageerror]",e.message));
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async ()=>{
    const px="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const doc = "본문 위\n\n![스크린샷](data:image/png;base64," + px + ")\n\n본문 아래\n";
    const v = ed.view;
    v.dispatch({changes:{from:0, to:v.state.doc.length, insert:doc}});
    await new Promise(r=>setTimeout(r,400));
    // cursor ONTO the image line (end of it)
    let ln=-1; const d=v.state.doc;
    for(let i=1;i<=d.lines;i++) if(d.line(i).text.startsWith("![")) {ln=i;break;}
    v.dispatch({selection:{anchor: d.line(ln).to}});
    await new Promise(r=>setTimeout(r,400));
    const token=document.querySelector(".cm-datauri");
    const lineEl=[...document.querySelectorAll(".cm-line")].find(l=>l.querySelector(".cm-datauri"));
    const visibleText = lineEl ? lineEl.textContent : null;
    // cursor OFF the line → full image widget
    v.dispatch({selection:{anchor: 0}});
    await new Promise(r=>setTimeout(r,400));
    const imgShown = !!document.querySelector(".qv-imgwrap img");
    return {
      tokenShown: !!token,
      tokenText: token ? token.textContent : null,
      lineHasBase64: visibleText ? visibleText.includes("iVBOR") : null,
      lineTextPreview: visibleText ? visibleText.slice(0,80) : null,
      imgShownWhenInactive: imgShown,
    };
  });
  console.log(JSON.stringify(r,null,2));
  await page.screenshot({path:"/tmp/datauri_fold.png"});
  await browser.close();
})();
