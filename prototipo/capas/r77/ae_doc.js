
/* --------------------------------------------------------------------------
   R7.7 · Consulta de DNI / RUC (API) y «Configuración de superusuario»
   - Solo trae el NOMBRE COMPLETO (DNI) o la RAZÓN SOCIAL (RUC); los demás datos
     se agregan a mano.
   - El token se guarda solo en este navegador (clave aparte, fuera de los datos
     del sistema). Las APIs se configuran solo desde la Configuración de
     superusuario (también la de placas).
   -------------------------------------------------------------------------- */
const R77_DK='rm77-doc-api';
function r77DocCfg(){let c={};try{c=JSON.parse(localStorage.getItem(R77_DK)||'{}')}catch{}return {provider:'demo',dniUrl:'',rucUrl:'',auth:'bearer',header:'X-API-KEY',param:'token',token:'',nameDni:'{data.nombres} {data.apellidoPaterno} {data.apellidoMaterno}',nameRuc:'{data.razonSocial}',...c}}
function r77DocCfgSave(c){try{localStorage.setItem(R77_DK,JSON.stringify(c))}catch{toast('No se pudo guardar en este navegador.')}}
const r77DocReady=()=>{const c=r77DocCfg();return c.provider==='demo'||((c.dniUrl.includes('{doc}')||c.rucUrl.includes('{doc}'))&&!!c.token)};
const R77_DDEMO={'12345678':'JUAN CARLOS PÉREZ DEMO','87654321':'MARÍA LUZ GARCÍA DEMO','20123456789':'EMPRESA DEMO S.A.C.'};
async function r77DocLookup(doc){const d=String(doc||'').replace(/\D/g,''),tipo=d.length===8?'DNI':d.length===11?'RUC':null;if(!tipo)throw Error('El DNI tiene 8 dígitos y el RUC 11.');const c=r77DocCfg();let name;
  if(c.provider==='demo'){name=R77_DDEMO[d];if(!name)throw Error('Modo demostración: solo conoce 12345678, 87654321 y 20123456789. Configura tu API en Configuración de superusuario.')}
  else{const tpl=tipo==='DNI'?c.dniUrl:c.rucUrl;if(!tpl.includes('{doc}'))throw Error('Falta la dirección de la API para '+tipo+' (Configuración de superusuario).');if(!c.token)throw Error('Falta el token de la API.');
    let url=tpl.replace('{doc}',encodeURIComponent(d));const h={Accept:'application/json'};if(c.auth==='bearer')h.Authorization='Bearer '+c.token;else if(c.auth==='header')h[c.header||'X-API-KEY']=c.token;else url+=(url.includes('?')?'&':'?')+encodeURIComponent(c.param||'token')+'='+encodeURIComponent(c.token);
    let res;try{res=await fetch(url,{headers:h})}catch{throw Error('No se pudo conectar con la API (sin red o bloqueada por CORS). El sistema real la consultará desde el servidor.')}
    if(res.status===401||res.status===403)throw Error('La API rechazó el token.');if(res.status===404)throw Error('La API no encontró el '+tipo+' '+d+'.');if(!res.ok)throw Error('La API respondió con error '+res.status+'.');
    let raw;try{raw=await res.json()}catch{throw Error('La API no devolvió JSON.')}
    name=String(tipo==='DNI'?c.nameDni:c.nameRuc).replace(/\{([^}]+)\}/g,(m,p)=>{const v=r77Dig(raw,p.trim());return v==null?'':String(v)}).replace(/\s+/g,' ').trim();if(!name)throw Error('La respuesta no trae el nombre: revisa la plantilla del nombre en Configuración de superusuario.')}
  return {tipo,doc:d,name:name.toUpperCase()}}
/* botón en los formularios de cliente y proveedor */
function r77DocWrap(fnName){const base=window[fnName];if(typeof base!=='function')return;window[fnName]=function(...a){const out=base.apply(this,a);try{const f=$('editor'),doc=f?.querySelector('[name=doc]');if(doc&&!f.querySelector('.r77-docq')){doc.closest('label').insertAdjacentHTML('beforeend','<span class="r77-plate r77-docq"><button type="button" class="r77-plbtn" onclick="r77DocFill()">🔎 Consultar DNI / RUC</button><small class="sub" id="r77docinfo">Trae solo el nombre completo o la razón social; los demás datos se escriben a mano.</small></span>')}}catch(err){console.warn('r77 doc',err)}return out}}
async function r77DocFill(){const f=$('editor'),inp=f?.querySelector('[name=doc]'),info=document.getElementById('r77docinfo');if(!inp||!info)return;
  if(!r77DocReady()){info.textContent='Pide al superusuario que configure la API de DNI/RUC (o usa el modo demostración).';return}
  info.textContent='Consultando…';try{const o=await r77DocLookup(inp.value);const nm=f.querySelector('[name=name]');if(nm)nm.value=o.name;const dt=f.querySelector('[name=docType]');if(dt&&[...dt.options].some(x=>x.value===o.tipo))dt.value=o.tipo;info.innerHTML='✔ '+o.tipo+' '+esc(o.doc)+': <b>'+esc(o.name)+'</b>. Completa a mano el celular, correo y demás datos.'}catch(err){info.textContent='✖ '+err.message}}
['editClient','r73EditSupplier'].forEach(r77DocWrap);
/* configuración (solo superusuario) */
function r77DocCfgForm(){const c=r77DocCfg();
  return `<section class="panel r77-invcfg"><h2>Consulta de DNI y RUC (API)</h2><p class="sub">Al registrar un cliente o proveedor, «Consultar DNI / RUC» trae <b>solo el nombre completo</b> (DNI) o la razón social (RUC). Los demás datos se agregan a mano. El token se guarda <b>solo en este navegador</b>.</p>
  <div class="r77-g3"><label>Proveedor<select id="r77d-prov" onchange="document.getElementById('r77d-custom').hidden=this.value==='demo'"><option value="demo" ${c.provider==='demo'?'selected':''}>Demostración (sin conexión, datos sintéticos)</option><option value="custom" ${c.provider==='custom'?'selected':''}>Mi API</option></select></label></div>
  <div id="r77d-custom" ${c.provider==='demo'?'hidden':''}><div class="r77-g3"><label style="grid-column:1/-1">Dirección para DNI (usa {doc})<input id="r77d-dni" value="${esc(c.dniUrl)}" placeholder="https://api.ejemplo.com/dni/{doc}"></label><label style="grid-column:1/-1">Dirección para RUC (usa {doc})<input id="r77d-ruc" value="${esc(c.rucUrl)}" placeholder="https://api.ejemplo.com/ruc/{doc}"></label>
  <label>Cómo se envía el token<select id="r77d-auth"><option value="bearer" ${c.auth==='bearer'?'selected':''}>Authorization: Bearer</option><option value="header" ${c.auth==='header'?'selected':''}>Cabecera propia</option><option value="query" ${c.auth==='query'?'selected':''}>Parámetro en la dirección</option></select></label><label>Nombre de la cabecera / parámetro<input id="r77d-hn" value="${esc(c.auth==='query'?c.param:c.header)}"></label><label>Token de la API<input id="r77d-tok" type="password" autocomplete="off" placeholder="${c.token?'Token guardado en este navegador (déjalo vacío para conservarlo)':'Pega aquí tu token'}"></label>
  <label style="grid-column:1/-1">Cómo se arma el nombre (DNI), con rutas entre llaves<input id="r77d-ndni" value="${esc(c.nameDni)}"></label><label style="grid-column:1/-1">Cómo se arma la razón social (RUC)<input id="r77d-nruc" value="${esc(c.nameRuc)}"></label></div></div>
  <div class="row">${button('Guardar','r77DocCfgApply()',true)}<input id="r77d-test" placeholder="DNI o RUC de prueba" style="max-width:190px">${button('Probar consulta','r77DocTest()')}${c.token?button('Quitar token','r77DocTokenDel()'):''}<span id="r77d-res" class="sub"></span></div></section>`}
function r77DocCfgApply(silent){if(r72Role()!=='Administrador')return toast('Solo el superusuario configura las APIs.');const c=r77DocCfg(),v=id=>document.getElementById(id)?.value??'';c.provider=v('r77d-prov')||'demo';
  if(c.provider==='custom'){c.dniUrl=v('r77d-dni').trim();c.rucUrl=v('r77d-ruc').trim();c.auth=v('r77d-auth');const hn=v('r77d-hn').trim();if(c.auth==='query')c.param=hn||'token';else c.header=hn||'X-API-KEY';const t=v('r77d-tok').trim();if(t)c.token=t;c.nameDni=v('r77d-ndni').trim()||c.nameDni;c.nameRuc=v('r77d-nruc').trim()||c.nameRuc}
  r77DocCfgSave(c);if(silent)return;R73.lastText='Consulta de DNI/RUC: configuración guardada';save('Consulta de DNI/RUC: configuración','')}
function r77DocTokenDel(){if(r72Role()!=='Administrador')return;const c=r77DocCfg();c.token='';r77DocCfgSave(c);save('Consulta de DNI/RUC: token quitado','')}
async function r77DocTest(){const out=document.getElementById('r77d-res');r77DocCfgApply(true);out.textContent='Consultando…';try{const o=await r77DocLookup(document.getElementById('r77d-test').value);out.textContent='✔ '+o.tipo+': '+o.name}catch(err){out.textContent='✖ '+err.message}}
/* ---------- página «Configuración de superusuario» ---------- */
views.superusuario=()=>heading('Configuración de superusuario','Solo el superusuario ve y cambia esto: APIs de consulta (placa y DNI/RUC), contraseña de inventario, stock negativo e impuestos.','')+r77PlateCfgForm()+r77DocCfgForm()+r77InvCfgPanel()+r77TaxPanel();
(function(){R75_MODS.superusuario=['★','Configuración de superusuario'];const c=R75_NAV.find(n=>n.sec==='Configuración');if(c&&!c.items.includes('superusuario'))c.items.push('superusuario');r75Rebuild()})();
