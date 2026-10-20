
/* --------------------------------------------------------------------------
   R7.7 · Tarea del logístico: lleva los datos del vehículo (marca, modelo, año,
   código de motor, VIN) para cotizar con proveedores, y un cuadro de compra
   donde elige proveedor, precio de compra y precio de venta; el margen se
   calcula solo y apoya a la cajera.
   -------------------------------------------------------------------------- */
function r77VehText(o){const v=vehicle(o.vehicle),c=client(v.client);return `Vehículo: ${v.plate||'—'} · ${[v.brand,v.model,v.year].filter(Boolean).join(' ')||'—'}\nCódigo de motor: ${v.engine||'—'} · VIN: ${v.vin||'—'}${v.serial?' · Serie: '+v.serial:''} · Km: ${o.km??v.km??'—'}\nCliente: ${c.name||'—'}`}
/* la descripción de cada tarea de producto lleva los datos del vehículo */
const r77EvLog=r72SyncEvent;
r72SyncEvent=function(k){const t=r77EvLog(k);try{if(t&&k.startsWith('o:')){const o=r72Box(k);if(o)db.tasks.filter(s=>s.parent===t.id&&s.r72line&&s.type==='Producto'&&!s.deleted).forEach(s=>{const base=String(s.description||'').split('\n— Datos del vehículo —')[0];s.description=base+'\n— Datos del vehículo —\n'+r77VehText(o)})}}catch(err){console.warn('r77 logística',err)}return t};
/* las tareas «Cotizar productos» y «Comprar productos aprobados» también llevan los datos del vehículo */
const r77EnsureBase=r72EnsureLogTask;
r72EnsureLogTask=function(k,kind,logistic,lineIds,isNew){const t=r77EnsureBase(k,kind,logistic,lineIds,isNew);try{const box=t&&r72Box(k);if(box){const base=String(t.description||'').split('\n— Datos del vehículo —')[0];t.description=base+'\n— Datos del vehículo —\n'+r77VehText(box)}}catch(err){console.warn('r77 logística',err)}return t};
/* cuadro de compra */
const r77Marg=(c,p)=>{const m=r2((+p||0)-(+c||0));return {m,pc:(+p||0)>0?r2(m/(+p)*100):0}};
function r77PurchaseSet(k,lid,f,v){const box=r72Box(k),l=box?.lines.find(x=>x.id===lid);if(!l)return;
  if(f==='supplier'){l.supplier=v||null;l.supplierName=db.suppliers.find(s=>s.id===v)?.name||''}else if(f==='stockType')l.stockType=v;else l[f]=+v||0;
  const m=r77Marg(l.cost,l.price);r72Log(k,'Compra actualizada',`${l.name}: proveedor ${l.supplierName||'—'} · compra ${money(l.cost||0)} · venta ${money(l.price||0)} · margen ${money(m.m)} (${m.pc}%)`);R73.lastText='Compra de «'+l.name+'» actualizada';save('Compra actualizada',box.code)}
const r77PanelLog=r6TaskPanel;
r6TaskPanel=function(){const h=r77PanelLog(),t=db.tasks.find(x=>x.id===r6PanelId);if(!h||!t||!r72CanCost())return h;
  /* la tarea del logístico (cotizar / comprar) trae su propio cuadro; el evento de la ODS también */
  let k=null,ids=null,mine=null;
  if(t.r72log?.k){k=t.r72log.k;ids=t.r72log.lineIds||[]}
  else if(t.type==='Evento'&&t.r72k?.startsWith('o:'))k=t.r72k;
  else if(t.type==='Producto'&&t.orderId){k='o:'+t.orderId;mine=t.r72line}
  const o=k&&r72Box(k);if(!o)return h;
  const lines=(o.lines||[]).filter(l=>l.name&&(ids?ids.includes(l.id):(l.type==='producto'||l.tech===R77_EXT)));if(!lines.length)return h;
  const lock=o.state==='Archivada'&&!o.editGrant,sup=db.suppliers.filter(s=>!s.deleted).map(s=>[s.id,s.name]);let tc=0,tv=0;
  const rows=lines.map(l=>{const q=+l.qty||1,m=r77Marg(l.cost,l.price);tc+=(+l.cost||0)*q;tv+=(+l.price||0)*q;const me=l.id===mine;
    return `<tr class="${me?'r77-mine':''}"><td>${esc(l.name)}${me?' ◀':''}</td><td>${q}</td><td>${l.type==='producto'?`<select ${lock?'disabled':''} onchange="r77PurchaseSet('${k}','${l.id}','stockType',this.value)" title="Interno: entra al stock · Externo: se compra y se vende el mismo día, sin stock">${R77_STK.map(([a])=>`<option value="${a}" ${r77StockType(l)===a?'selected':''}>${a==='interno'?'Interno':'Externo'}</option>`).join('')}</select>`:'<span class="pill">Servicio externo</span>'}</td><td><select ${lock?'disabled':''} onchange="r77PurchaseSet('${k}','${l.id}','supplier',this.value)">${r72Opt(sup,l.supplier,'Seleccionar proveedor')}</select></td><td><input type="number" step="0.01" min="0" ${lock?'disabled':''} value="${l.cost??''}" onchange="r77PurchaseSet('${k}','${l.id}','cost',this.value)"></td><td><input type="number" step="0.01" min="0" ${lock?'disabled':''} value="${l.price??''}" onchange="r77PurchaseSet('${k}','${l.id}','price',this.value)"></td><td class="r72-r">${money(m.m)} <small>(${m.pc}%)</small></td></tr>`}).join('');
  const T=r77Marg(tc,tv),box=`<div class="r74-autobox r77-compra"><b>🛒 Compra de productos · ${esc(r72BoxLabel(k))}</b><pre class="r77-veh">${esc(r77VehText(o))}</pre><p class="sub">Con estos datos pide cotización a tus proveedores. Elige el proveedor y escribe el precio de compra y el de venta: el margen se calcula solo y lo ve la cajera.</p><div class="r74-tw"><table class="r72-grid"><thead><tr><th>Producto / servicio</th><th>Cant.</th><th>Tipo</th><th>Proveedor</th><th>Precio de compra</th><th>Precio de venta</th><th class="r72-r">Margen</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="4"><b>Total</b></td><td>${money(tc)}</td><td>${money(tv)}</td><td class="r72-r"><b>${money(T.m)}</b> <small>(${T.pc}%)</small></td></tr></tfoot></table></div></div>`;
  return h.replace('<div class="tabs">',box+'<div class="tabs">')};
