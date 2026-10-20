
/* --------------------------------------------------------------------------
   R7.7 · 19/10/2026 (4.ª parte)
   - Registrar pago: formulario pequeño por comprobante (la cuenta completa tiene su propia acción).
   - PDF y Ticket en Acciones (cotizaciones, ODS, notas de venta, requerimientos y movimientos de bancos).
   - Kilometraje en la pestaña Cliente de la cotización (sin franja aparte); la cotización de una ODS actualiza el km de la ODS.
   - Precio de grupo: el servicio lleva « - G2» en la descripción.
   - Observaciones de la cotización y de la ODS pasan a la bitácora.
   - Facturación electrónica (beta, API externa).
   -------------------------------------------------------------------------- */
/* ---------- Registrar pago (formulario simple) ---------- */
function r73PayDoc(kind,id){const k=kind==='note'?'cobrar':'pagar',d=r73Docs(k).find(x=>x.id===id);if(!d)return;if(!(d.saldo>0))return toast('Este comprobante ya está pagado.');
  modal(`<h2>Registrar pago · ${esc(d.code)}</h2><p class="sub">${esc(d.partyName)} · Saldo ${money(d.saldo)}</p><form onsubmit="event.preventDefault();R77.paySimple=true;r73SavePay(this,'${kind}','${id}')"><div class="r72-fields"><label>Cuenta<select name="account">${r72Opt(r73AccOpts())}</select></label><label>Método<select name="method">${r72Opt(R73_METHODS.map(x=>[x,x]))}</select></label><label>Fecha<input type="date" name="date" value="${today()}" required></label><label>Importe<input type="number" name="amount" step="0.01" min="0.01" max="${d.saldo}" value="${d.saldo}" required></label></div><label>Observación<textarea name="ref" rows="2"></textarea></label><footer>${button('Cancelar','closeModal()')}<button class="primary">Grabar</button></footer></form>`)}
const r77AccModalB=r73AccountModal;
r73AccountModal=function(){if(R77.paySimple){R77.paySimple=false;closeModal();return}r77AccModalB()};
/* ---------- PDF y Ticket en Acciones ---------- */
const r77ActB=r73Act;
r73Act=function(...b){const all=b.filter(Boolean).map(x=>String(x).replace('title="Ver / imprimir" aria-label="Ver / imprimir"','title="Ver nota de venta" aria-label="Ver nota de venta"')),s=all.join('');let m;const add=(fn,id)=>all.push(r73Btn('print','PDF',`${fn}('${id}','pdf')`),r73Btn('print','Ticket',`${fn}('${id}','ticket')`));
  if(m=/title="Abrir \/ editar"[^>]*onclick="r73OpenQuote\('([^']+)'\)/.exec(s))add('r77PrintQuote',m[1]);
  else if(m=/onclick="r73ViewNote\('([^']+)'\)/.exec(s))add('r77PrintNote',m[1]);
  else if(m=/title="Movimientos"[^>]*onclick="r73MovList\('([^']+)'\)/.exec(s))add('r77PrintMovs',m[1]);
  return r77ActB(...all)};
r77OdsMenu=function(e,btn,id){const o=db.orders.find(x=>x.id===id);if(!o)return;e.stopPropagation();const n=r77OrdUnread(id);
  r77MenuShow(btn,[{icon:'👁',label:'Ver ODS',fn:()=>openOrder(id)},{icon:'✎',label:'Editar',fn:()=>r72OpenOrder(id)},{icon:'🚗',label:'Estado del vehículo',fn:()=>r77OrderVeh(id)},{icon:'▤',label:'Documentos',fn:()=>orderDocuments(id)},{icon:'⎙',label:'PDF',fn:()=>r77PrintOrder(id,'pdf')},{icon:'⎙',label:'Ticket',fn:()=>r77PrintOrder(id,'ticket')},{icon:'☰',label:'Bitácora'+(n?' ('+n+' nuevos)':''),fn:()=>orderChat(id)},{icon:'🗑',label:'Eliminar orden',red:true,fn:()=>r77OdsDelete(id)}])};
/* ---------- kilometraje dentro de la pestaña Cliente ---------- */
function r77QuoteKm(id,v){const q=r73Quote(id);if(!q)return;const km=+v;if(!(km>0)){q.km=null;try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}return}
  q.km=km;q.kmAt=new Date().toISOString();const veh=vehicle(r73QVehicle(q));if(veh)veh.km=Math.max(+veh.km||0,km);
  if(q.order){const o=db.orders.find(x=>x.id===q.order);if(o){o.km=km;o.kmFlag=false}}
  r72Log('q:'+id,'Kilometraje',km+' km');try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
const r77KmOpenB=r73OpenQuote;
r73OpenQuote=function(id,...a){r77KmOpenB(id,...a);try{const q=r73Quote(id),mb=$('modalbody');if(!q||!mb)return;mb.querySelectorAll('.r75-qkm').forEach(x=>x.remove());const f=mb.querySelector('.r77-qp1 .r72-fields');if(f&&!f.querySelector('#r75qkm'))f.insertAdjacentHTML('beforeend',`<label>Kilometraje<input id="r75qkm" type="number" min="0" value="${q.km||''}" placeholder="Km actual" onchange="r77QuoteKm('${id}',this.value)"></label>`)}catch(err){console.warn('r77 km',err)}};
/* ---------- precio de grupo en la descripción ---------- */
function r77GroupTag(l){if(!l||l.type!=='servicio'||!l.name)return false;const was=l.name,base=l.gSuf&&l.name.endsWith(l.gSuf)?l.name.slice(0,-l.gSuf.length):l.name,g=l.groupPrice?String(l.groupPrice).replace(/\s*\(.*\)$/,'').trim():'';if(g){l.gSuf=' - '+g;l.name=base+l.gSuf}else if(l.gSuf){l.name=base;l.gSuf=null}return l.name!==was}
const r77PickB=r72Pick;
r72Pick=function(k,id,catId){r77PickB(k,id,catId);const l=r72Line(k,id);if(l&&r77GroupTag(l)){const ref=R72.open;if(ref&&$('modal').open)r72Reopen(ref);try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}};
const r77ApplyGB=r74ApplyGroup;
r74ApplyGroup=function(k){r77ApplyGB(k);const box=r72Box(k);let n=0;(box.lines||[]).forEach(l=>{if(r77GroupTag(l))n++});if(n){const ref=R72.open;if(ref&&$('modal').open)r72Reopen(ref);try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}};
/* ---------- observaciones a la bitácora ---------- */
const r77ObsB=r77QcObs;
r77QcObs=function(id,v){const q=r73Quote(id),prev=q?q.obs||'':'';r77ObsB(id,v);if(q&&String(v).trim()&&v!==prev){db.comments.push({id:uid(),actor,date:new Date().toISOString(),order:q.order||null,quote:q.id,kind:'Observación de cotización',text:'['+q.code+'] '+v});try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}};
const r77SetOrdB=r72SetOrder;
r72SetOrder=function(id,f,value){r77SetOrdB(id,f,value);if(/^obs/i.test(f)&&String(value||'').trim()){const o=db.orders.find(x=>x.id===id);if(o){db.comments.push({id:uid(),actor,date:new Date().toISOString(),order:id,kind:'Observación de ODS',text:'['+o.code+'] '+value});try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}}};
/* ---------- Facturación electrónica (beta, API externa) ---------- */
views.factelec=()=>heading('Facturación electrónica','Módulo beta: mientras el sistema no tenga su propia facturación electrónica, la nota de venta se enviará por API a un facturador externo (PSE u OSE).')+`<div class="r77-note">Beta: es el contrato previsto, no hay conexión. Cuando exista, el sistema enviará el comprobante y guardará lo que devuelva el facturador.</div><div class="panel">${table(['Paso','Qué ocurre','Estado'],[['1. Emitir','La nota de venta con cliente, ítems e impuestos se convierte en factura, boleta o nota de crédito y se envía al facturador por API.','Beta'],['2. Respuesta','El facturador devuelve serie y número, hash, código QR y constancia de la SUNAT.','Beta'],['3. Guardar','El sistema guarda el estado (aceptado, rechazado) y el PDF del comprobante en la nota de venta.','Beta'],['4. Reintentos','Si falla el envío, queda pendiente y se reintenta; el taller lo ve en la lista.','Beta']].map(r=>[`<b>${esc(r[0])}</b>`,esc(r[1]),`<span class="pill orange">${r[2]}</span>`]))}</div>`;
R77_BETA.add('factelec');R75_MODS.factelec=['▤','Facturación electrónica'];(function(){const b=R75_NAV.find(n=>n.sec==='Beta');if(b&&!b.items.includes('factelec'))b.items.push('factelec');r75Rebuild()})();
