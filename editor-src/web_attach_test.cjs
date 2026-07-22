const { webkit } = require("playwright");
(async()=>{
  const browser=await webkit.launch();
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on("pageerror",e=>console.log("[pageerror]",e.message));
  await page.goto("http://127.0.0.1:8377/index.html");
  await page.waitForTimeout(2000);
  const r = await page.evaluate(async ()=>{
    // 1x1 red png
    const px="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const draw = await window.pywebview.api.save_drawing(px);
    const paste = await window.pywebview.api.paste_image();   // no clipboard perms headless → graceful skip
    return {
      drawIsDataUri: !!(draw && draw.path && draw.path.startsWith("data:image/png")),
      pasteGraceful: !!(paste && (paste.skipped || paste.path)),
      describe: (typeof describePath==="function") ? describePath(draw.path) : null,
    };
  });
  console.log(JSON.stringify(r,null,2));
  await browser.close();
})();
