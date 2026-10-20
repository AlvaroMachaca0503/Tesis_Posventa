
/* --------------------------------------------------------------------------
   R7.7 · Consulta de vehículo por placa (API)
   - El token de la API se escribe en Configuración y se guarda SOLO en este
     navegador (clave aparte, fuera de los datos del sistema): no viaja en
     exportaciones ni en la carpeta. No pongas aquí tokens en archivos.
   - En el formulario del vehículo, «Consultar placa» completa marca, modelo,
     año, VIN, serie, motor y color; el sistema muestra el grupo y el plan que
     le tocan. Solo falta elegir el tipo de aceite.
   - Sin API configurada hay un modo de demostración con datos sintéticos.
   - Una página abierta desde un archivo puede ser bloqueada por CORS en
     algunas APIs; el sistema real hará la consulta desde el servidor.
   -------------------------------------------------------------------------- */
const R77_PK='rm77-plate-api';
const R77_PMAP={brand:'marca',model:'modelo',year:'anio',vin:'vin',engine:'motor',serial:'serie',color:'color'};
function r77PlateCfg(){let c={};try{c=JSON.parse(localStorage.getItem(R77_PK)||'{}')}catch{}return {provider:'demo',url:'',auth:'bearer',header:'X-API-KEY',param:'token',token:'',map:{...R77_PMAP},...c,map:{...R77_PMAP,...(c.map||{})}}}
function r77PlateCfgSave(c){try{localStorage.setItem(R77_PK,JSON.stringify(c))}catch{toast('No se pudo guardar en este navegador.')}}
const r77PlateReady=()=>{const c=r77PlateCfg();return c.provider==='demo'||(c.url.includes('{placa}')&&!!c.token)};
const R77_PDEMO={'DEM-679':{marca:'KIA',modelo:'PICANTO',anio:2019,vin:'KNABX512DEMO00001',motor:'G4LA-1.2',serie:'DEMO-SER-001',color:'Gris'},'ABC-123':{marca:'TOYOTA',modelo:'YARIS',anio:2018,vin:'JTDKDEMO0000002',motor:'1NZ-FE',serie:'DEMO-SER-002',color:'Blanco'},'XYZ-789':{marca:'HYUNDAI',modelo:'I10',anio:2016,vin:'MALDEMO0000003',motor:'G4LA',serie:'DEMO-SER-003',color:'Rojo'}};
const r77Dig=(o,path)=>String(path||'').split('.').filter(Boolean).reduce((a,k)=>a==null?a:a[k],o);
const r77PlateNorm=p=>String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/^([A-Z0-9]{3})([A-Z0-9]{3})$/,'$1-$2');
/* consulta: devuelve {brand,model,year,vin,engine,serial,color} o lanza Error con un mensaje claro */
async function r77PlateLookup(plate){const c=r77PlateCfg(),pl=r77PlateNorm(plate);if(!pl)throw Error('Escribe la placa.');let raw;
  if(c.provider==='demo'){raw=R77_PDEMO[pl];if(!raw)throw Error('Modo demostración: solo conoce DEM-679, ABC-123 y XYZ-789. Configura tu API en Configuración.')}
  else{if(!c.url.includes('{placa}'))throw Error('La dirección de la API debe incluir {placa}.');if(!c.token)throw Error('Falta el token de la API (Configuración › Consulta por placa).');
    let url=c.url.replace('{placa}',encodeURIComponent(pl));const h={Accept:'application/json'};if(c.auth==='bearer')h.Authorization='Bearer '+c.token;else if(c.auth==='header')h[c.header||'X-API-KEY']=c.token;else url+=(url.includes('?')?'&':'?')+encodeURIComponent(c.param||'token')+'='+encodeURIComponent(c.token);
    let res;try{res=await fetch(url,{headers:h})}catch{throw Error('No se pudo conectar con la API (sin red o bloqueada por CORS). El sistema real la consultará desde el servidor.')}
    if(res.status===401||res.status===403)throw Error('La API rechazó el token.');if(res.status===404)throw Error('La API no encontró la placa '+pl+'.');if(!res.ok)throw Error('La API respondió con error '+res.status+'.');
    try{raw=await res.json()}catch{throw Error('La API no devolvió JSON.')}}
  const g=k=>r77Dig(raw,c.map[k]),yr=parseInt(g('year'),10),o={plate:pl,brand:String(g('brand')||'').toUpperCase(),model:String(g('model')||'').toUpperCase(),year:isFinite(yr)?yr:'',vin:g('vin')||'',engine:g('engine')||'',serial:g('serial')||'',color:g('color')||''};
  if(!o.brand&&!o.model)throw Error('La respuesta no trae marca ni modelo: revisa la correspondencia de campos en Configuración.');return o}
/* grupo y plan que le tocarían a ese vehículo (la misma lógica de la asignación automática) */
function r77PlatePreview(v){const g=db.r74groups.find(g=>g.active!==false&&(g.rules||[]).some(r=>r74RuleHit(r,v)));let plan=null;if(g){const ps=(g.plans||[]).map(id=>db.plans.find(p=>p.id===id)).filter(Boolean);plan=ps.find(p=>normal(p.fam).includes(normal(v.model)))||ps.find(p=>normal(p.fam).includes(normal(v.brand)))||(ps.length===1?ps[0]:null)}return {group:g||null,plan}}
/* ---------- formulario del vehículo ---------- */
const r77EditVehB=editVehicle;
editVehicle=function(id){r77EditVehB(id);try{const f=$('editor');if(!f||!f.querySelector('[name=plate]'))return;const v=id?vehicle(id):{},pl=f.querySelector('[name=plate]').closest('label');f.dataset.edit=id?'1':'';
  if(!f.querySelector('[name=oil]')){const use=f.querySelector('[name=use]')?.closest('label');(use||f.querySelector('.formgrid')).insertAdjacentHTML(use?'beforebegin':'beforeend',`<label>Tipo de aceite<select name="oil">${['','Mineral','Semisintético','Sintético','Full sintético'].map(s=>`<option value="${s}" ${s===(v.oil||'')?'selected':''}>${s||'Sin seleccionar'}</option>`).join('')}</select></label>`)}
  if(pl&&!f.querySelector('.r77-plate')){pl.insertAdjacentHTML('beforeend','<span class="r77-plate"><button type="button" class="r77-plbtn" onclick="r77PlateFill()">🔎 Consultar placa</button><small class="sub" id="r77plateinfo">Completa marca, modelo, año, VIN y motor. Solo falta el tipo de aceite.</small></span>')}}catch(err){console.warn('r77 placa',err)}};
async function r77PlateFill(){const f=$('editor'),inp=f?.querySelector('[name=plate]'),info=document.getElementById('r77plateinfo');if(!inp)return;const pl=r77PlateNorm(inp.value);
  const dup=db.vehicles.find(v=>!v.deleted&&r77PlateNorm(v.plate)===pl);if(dup&&!f.dataset.edit&&pl){info.textContent='Esa placa ya está registrada en el sistema ('+(client(dup.client).name||'sin cliente')+'). Abre ese vehículo para editarlo.';return}
  if(!r77PlateReady()){info.textContent='Configura la API en Configuración › Consulta de vehículo por placa (o usa el modo demostración).';return}
  info.textContent='Consultando…';try{const o=await r77PlateLookup(inp.value);inp.value=o.plate;const set=(n,v)=>{const e=f.querySelector('[name='+n+']');if(!e||v===''||v==null)return;if(e.tagName==='SELECT'&&![...e.options].some(x=>x.value===String(v))){const op=document.createElement('option');op.value=op.textContent=String(v);e.appendChild(op)}e.value=v};
    const bn=(db.r74vbrands.find(b=>normal(b.name)===normal(o.brand))||{}).name||o.brand;set('brand',bn);const bs=f.querySelector('[name=brand]');if(bs)bs.dispatchEvent(new Event('change'));set('model',o.model);set('year',o.year);set('vin',o.vin);set('serial',o.serial);set('engine',o.engine);set('color',o.color);
    const pv=r77PlatePreview({brand:bn,model:o.model,year:o.year,engine:o.engine});info.innerHTML='✔ Datos cargados: <b>'+esc([bn,o.model,o.year].filter(Boolean).join(' '))+'</b> · grupo <b>'+(pv.group?esc(pv.group.id+' · '+pv.group.name):'sin grupo (ninguna regla coincide)')+'</b> · plan <b>'+(pv.plan?esc(pv.plan.fam):'sin plan')+'</b>. Solo falta el tipo de aceite.';
    const oil=f.querySelector('[name=oil]');if(oil)oil.focus();(r77Db().plateUse??=[]).unshift({at:new Date().toISOString(),by:actor,plate:o.plate});r77Db().plateUse=r77Db().plateUse.slice(0,100)}catch(err){info.textContent='✖ '+err.message}}
/* ---------- configuración ---------- */
function r77PlateCfgForm(){const c=r77PlateCfg(),m=c.map,fld=(k,l)=>`<label>${l}<input id="r77pm-${k}" value="${esc(m[k])}"></label>`;
  return `<section class="panel r77-invcfg"><h2>Consulta de vehículo por placa (API)</h2><p class="sub">Con una API de placas, al registrar un vehículo se completan sus datos y el sistema le asigna el grupo y el plan de mantenimiento. El token se guarda <b>solo en este navegador</b> (no en los datos del sistema ni en la carpeta). Nunca lo pegues en archivos.</p>
  <div class="r77-g3"><label>Proveedor<select id="r77p-prov" onchange="r77PlateCfgChange()"><option value="demo" ${c.provider==='demo'?'selected':''}>Demostración (sin conexión, datos sintéticos)</option><option value="custom" ${c.provider==='custom'?'selected':''}>Mi API</option></select></label></div>
  <div id="r77p-custom" ${c.provider==='demo'?'hidden':''}><div class="r77-g3"><label style="grid-column:1/-1">Dirección de la consulta (usa {placa})<input id="r77p-url" value="${esc(c.url)}" placeholder="https://api.ejemplo.com/vehiculos/{placa}"></label><label>Cómo se envía el token<select id="r77p-auth"><option value="bearer" ${c.auth==='bearer'?'selected':''}>Authorization: Bearer</option><option value="header" ${c.auth==='header'?'selected':''}>Cabecera propia</option><option value="query" ${c.auth==='query'?'selected':''}>Parámetro en la dirección</option></select></label><label>Nombre de la cabecera / parámetro<input id="r77p-hn" value="${esc(c.auth==='query'?c.param:c.header)}"></label><label>Token de la API<input id="r77p-tok" type="password" autocomplete="off" placeholder="${c.token?'Token guardado en este navegador (déjalo vacío para conservarlo)':'Pega aquí tu token'}"></label></div>
  <h3>Dónde viene cada dato en la respuesta (ruta con puntos, ej.: <code>data.marca</code>)</h3><div class="r77-g3">${fld('brand','Marca')}${fld('model','Modelo')}${fld('year','Año')}${fld('vin','VIN')}${fld('engine','Código de motor')}${fld('serial','Serie')}${fld('color','Color')}</div></div>
  <div class="row">${button('Guardar','r77PlateCfgApply()',true)}<input id="r77p-test" placeholder="Placa de prueba" style="max-width:160px">${button('Probar consulta','r77PlateTest()')}${c.token?button('Quitar token','r77PlateTokenDel()'):''}<span id="r77p-res" class="sub"></span></div></section>`}
function r77PlateCfgChange(){const v=document.getElementById('r77p-prov')?.value;const el=document.getElementById('r77p-custom');if(el)el.hidden=v==='demo'}
function r77PlateCfgApply(silent){if(r72Role()!=='Administrador')return toast('Solo el superusuario configura las APIs.');const c=r77PlateCfg(),v=id=>document.getElementById(id)?.value??'';c.provider=v('r77p-prov')||'demo';if(c.provider==='custom'){c.url=v('r77p-url').trim();c.auth=v('r77p-auth');const hn=v('r77p-hn').trim();if(c.auth==='query')c.param=hn||'token';else c.header=hn||'X-API-KEY';const t=v('r77p-tok').trim();if(t)c.token=t;Object.keys(R77_PMAP).forEach(k=>{const x=v('r77pm-'+k).trim();c.map[k]=x||R77_PMAP[k]})}
  r77PlateCfgSave(c);if(silent)return;R73.lastText='Consulta por placa: configuración guardada';save('Consulta por placa: configuración','')}
function r77PlateTokenDel(){if(r72Role()!=='Administrador')return;const c=r77PlateCfg();c.token='';r77PlateCfgSave(c);save('Consulta por placa: token quitado','')}
async function r77PlateTest(){const out=document.getElementById('r77p-res');r77PlateCfgApply(true);out.textContent='Consultando…';try{const o=await r77PlateLookup(document.getElementById('r77p-test').value);out.textContent='✔ '+[o.brand,o.model,o.year].filter(Boolean).join(' ')+(o.engine?' · motor '+o.engine:'')}catch(err){out.textContent='✖ '+err.message}}
