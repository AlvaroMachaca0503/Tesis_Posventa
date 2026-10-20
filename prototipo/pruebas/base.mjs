import { chromium } from 'playwright';
const F='file://'+process.argv[2]+'#sinlogin', tag=process.argv[3]||'base';
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});
const kill=setTimeout(()=>{console.log('TIMEOUT');process.exit(1)},100000);
const p=await b.newPage({viewport:{width:1366,height:900}});p.setDefaultTimeout(4000);
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});p.on('pageerror',e=>errs.push('pageerror['+cur+']: '+e.message));
let cur='load';await p.goto(F);await p.waitForTimeout(300);
const pages=await p.evaluate(()=>modules.filter(m=>m.length>1).map(m=>m[0]));
for(const pg of pages){cur=pg;try{await p.evaluate(x=>go(x),pg);await p.waitForTimeout(80);
 const info=await p.evaluate(()=>({h:document.querySelector('#view h1')?.textContent,len:document.getElementById('view').innerText.length,ovf:document.documentElement.scrollWidth-innerWidth}));
 console.log(pg.padEnd(13),JSON.stringify(info));await p.screenshot({path:`${tag}_${pg}.png`,fullPage:false});}catch(e){errs.push(pg+': '+e.message.split('\n')[0])}}
console.log('ERRORES',errs.length);errs.forEach(e=>console.log(e));clearTimeout(kill);await b.close();
