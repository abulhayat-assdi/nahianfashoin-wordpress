const { chromium } = require('playwright');
const fs = require('fs');
const [,, base, out, vn, name, path] = process.argv;
const vp = vn==='d' ? {width:1440,height:900} : {width:390,height:844};
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const ctx = await b.newContext({viewport:vp, isMobile: vn==='m'});
  const p = await ctx.newPage();
  await p.goto(base+path,{waitUntil:'networkidle',timeout:90000});
  await p.addStyleTag({content:'*{animation:none!important;transition:none!important;scroll-behavior:auto!important} nextjs-portal{display:none!important}'});
  const H = await p.evaluate(()=>document.documentElement.scrollHeight);
  const parts=[];
  for (let y=0, i=0; y<H; y+=vp.height, i++) {
    await p.evaluate(yy=>window.scrollTo(0,yy), y);
    await p.waitForTimeout(900);
    const f=`${out}/${vn}-${name}-slice${i}.png`; await p.screenshot({path:f}); parts.push([f, Math.min(y, H-vp.height)]);
  }
  fs.writeFileSync(`${out}/${vn}-${name}.json`, JSON.stringify({H, parts, w:vp.width, h:vp.height}));
  await b.close();
})();
