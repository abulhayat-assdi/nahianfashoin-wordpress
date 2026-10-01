const { chromium } = require('playwright');
const [,, base, out] = process.argv;
const pages = [['home','/'],['collections','/collections'],['category','/collections/panjabi'],['product','/products/oxford-cotton-febric'],['cart','/cart'],['checkout','/checkout'],['login','/account-login'],['register','/account-register'],['page-returns','/pages/returns-exchanges'],['notfound','/zzz-404']];
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  for (const [vn,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
    const ctx = await b.newContext({viewport:vp, deviceScaleFactor:1, isMobile: vn==='mobile'});
    const p = await ctx.newPage();
    for (const [n,u] of pages) {
      try { await p.goto(base+u,{waitUntil:'networkidle',timeout:45000}); } catch(e){ console.log('timeout',n); }
      await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}window.scrollTo(0,0);});
      await p.waitForLoadState('networkidle').catch(()=>{});
      await p.waitForTimeout(1500);
      await p.screenshot({path:`${out}/${vn}-${n}.png`, fullPage:true});
      console.log(vn,n);
    }
    await ctx.close();
  }
  await b.close();
})();
