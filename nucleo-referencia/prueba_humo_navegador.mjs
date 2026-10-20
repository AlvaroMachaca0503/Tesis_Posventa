import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const F='file:///mnt/user-data/outputs/salidas_claude/html/R_Motriz_R8_nucleo.html';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--proxy-server=direct://','--no-proxy-server','--disable-background-networking']});
const _t=setTimeout(()=>{console.log(res.join('\n'));console.log('TIMEOUT');process.exit(1)},100000);
const errs=[],res=[];
const step=async(n,fn)=>{try{await fn();res.push('PASÓ '+n)}catch(e){res.push('FALLÓ '+n+' :: '+String(e.message).split('\n')[0])}};
async function run(w,h,tag,full){
 const p=await b.newPage({viewport:{width:w,height:h}});
 p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console: '+m.text())});
 p.on('pageerror',e=>errs.push(tag+' pageerror: '+e.message));
 p.setDefaultTimeout(4000);await p.goto(F);
 await step(tag+' carga inicio',async()=>{await p.waitForSelector('h1')});await step(tag+' vista vehículos',async()=>{await p.click('[data-act=vista][data-v=vehiculos]');await p.waitForSelector('#f-buscar')});
 await p.screenshot({path:`shot_${tag}_vehiculos.png`});
 if(!full){return p}
 await step('buscar DEM-101',async()=>{await p.fill('#f-buscar input[name=placa]','dem 101');await p.click('#f-buscar button');await p.waitForSelector('text=DEM-101');});
 await step('abrir ficha',async()=>{const r=p.locator('[data-act=abrir-veh]').first();if(await r.count())await r.click();});
 await step('tab línea temporal',async()=>{await p.click('[data-act=tab][data-t*=linea], [data-act=tab]:has-text("temporal")');await p.waitForSelector('.tl');});
 await p.screenshot({path:`shot_${tag}_linea.png`,fullPage:true});
 await step('modo base y tabla',async()=>{await p.click('[data-act=modo]:has-text("base")');await p.click('[data-act=vtabla]');});
 await step('registrar ODS aceite',async()=>{await p.click('[data-act=tab]:has-text("Registrar")');await p.fill('#f-ods input[name=km]','74900');await p.fill('[data-campo=descripcion]','Cambio de aceite de motor');await p.click('#f-ods button.primary');await p.waitForTimeout(300);});
 await step('rol jefe y aprobar',async()=>{await p.selectOption('#rol','JEFE_TALLER');await p.click('[data-act=vista][data-v=reajustes]');await p.waitForSelector('[data-act=aprobar]');await p.screenshot({path:`shot_${tag}_reajustes.png`,fullPage:true});await p.locator('[data-act=aprobar]').first().click();await p.waitForTimeout(200);});
 await step('importación válida+reimport',async()=>{await p.selectOption('#rol','ADMINISTRADOR');await p.click('[data-act=vista][data-v=importacion]');await p.click('[data-act=muestra][data-m=ok]');await p.click('[data-act=analizar]');await p.waitForSelector('[data-act=aplicar]');await p.click('[data-act=aplicar]');await p.waitForSelector('[data-act=reaplicar], [data-act=reanalizar]');await p.screenshot({path:`shot_${tag}_import.png`,fullPage:true});});
 await step('importación con errores',async()=>{await p.click('[data-act=muestra][data-m=err]');await p.click('[data-act=analizar]');await p.waitForTimeout(200);const t=await p.locator('main').innerText();if(!/error|rechaz|inv/i.test(t))throw new Error('sin errores visibles');});
 await step('posventa flujo',async()=>{await p.selectOption('#rol','CAJERA');await p.click('[data-act=vista][data-v=posventa]');await p.waitForSelector('[data-act=crear-seg]');await p.locator('[data-act=crear-seg]').first().click();await p.waitForSelector('[data-act=intento]:not([disabled])');await p.locator('[data-act=intento]:not([disabled])').first().click();await p.selectOption('[data-act=resultado]','respondio');await p.waitForSelector('form[data-form=cita]');const f=p.locator('form[data-form=cita]').first();await f.locator('[name=fecha]').fill('2026-10-20');await f.locator('button').click();await p.waitForTimeout(200);await p.screenshot({path:`shot_${tag}_posventa.png`,fullPage:true});await p.locator('[data-act=llegada]:not([disabled])').first().click();await p.waitForTimeout(200);});
 await step('auditoría y trazabilidad',async()=>{for(const v of['auditoria','trazabilidad']){await p.click(`[data-act=vista][data-v=${v}]`);await p.waitForTimeout(100);}});
 await step('sin desborde horizontal de página',async()=>{const o=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>2)throw new Error('desborde '+o)});
 return p;
}
res.length=0;await run(1280,900,'desk',true);console.log('--DESK');console.log(res.join('\n'));res.length=0;await run(390,800,'mov',true);console.log('--MOV');console.log(res.join('\n'));console.log('ERRORES:',errs.length);errs.forEach(e=>console.log(e));
await b.close();
