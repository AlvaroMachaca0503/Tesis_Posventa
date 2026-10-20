
/* --------------------------------------------------------------------------
   R7.7 · Lista de órdenes: cada fila muestra todo el encabezado de la orden y,
   al final, el último mensaje de la bitácora («hace cuánto») con un contador de
   mensajes nuevos. El contador baja cuando se abre la bitácora de la orden.
   -------------------------------------------------------------------------- */
function r77Seen(){db.r77seen??={};return db.r77seen[actor]??={}}
function r77OrdMsgs(id){return db.comments.filter(c=>c.order===id&&!c.deleted).sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function r77OrdUnread(id){const seen=r77Seen()[id]||'';return r77OrdMsgs(id).filter(c=>String(c.date)>seen&&c.actor!==actor).length}
function r77UnreadTotal(){return db.orders.filter(o=>!o.deleted).reduce((a,o)=>a+r77OrdUnread(o.id),0)}
function r77Ago(iso){const s=Math.max(0,Math.round((Date.now()-new Date(iso).getTime())/1000));if(s<60)return 'hace un momento';const m=Math.round(s/60);if(m<60)return 'hace '+m+' min';const h=Math.round(m/60);if(h<24)return 'hace '+h+' h';const d=Math.round(h/24);if(d<30)return 'hace '+d+(d===1?' día':' días');const mo=Math.round(d/30);return 'hace '+mo+(mo===1?' mes':' meses')}
function r77SeenMark(id){const o=db.orders.find(x=>x.id===id);if(!o)return;const last=r77OrdMsgs(id).at(-1);r77Seen()[id]=last?String(last.date):new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
const r77ChatBase=orderChat;
orderChat=function(id){r77SeenMark(id);r77ChatBase(id);setTimeout(()=>{if(page==='ods'&&!$('modal').open)render()},0)};
const r77LogBase=orderLog;
orderLog=function(id){r77SeenMark(id);r77LogBase(id)};
function r77OdsCard(id,menu){const o=db.orders.find(x=>x.id===id);if(!o)return '';const v=vehicle(o.vehicle),c=client(v.client),q=o.quote&&r73Quote(o.quote),lg=o.logistic&&db.users.find(u=>u.id===o.logistic),msgs=r77OrdMsgs(id),last=msgs.at(-1),n=r77OrdUnread(id),T=total(o);
  const f=(l,val)=>`<div><small>${esc(l)}</small><span>${val===''||val==null?'—':esc(val)}</span></div>`;
  return `<article class="ticket orderrow r77-oc" onclick="openOrder('${o.id}')"><div class="row spread"><b>${esc(o.code)}</b>${menu?`<button type="button" class="r77-opt r77-copt" aria-haspopup="menu" aria-label="Acciones" title="Acciones" onclick="event.stopPropagation();r77OdsMenu(event,this,'${o.id}')">⚙<small>▾</small></button>`:''}<span class="pill ${billingState(o)==='Facturado'?'green':'red'}">${billingState(o)}</span></div>
<h3>${esc(v.plate||'')} · ${esc((v.brand||'')+' '+(v.model||''))}</h3>
<div class="r77-ohd">${f('Tipo de atención',o.attentionType)}${f('Ingreso',(o.date||'')+(o.time?' · '+o.time:''))}${f('Kilometraje',o.km==null?'Sin km':o.km+' km')}${f('Técnico responsable',tech(o.tech)||o.technicianName)}${f('Logístico',lg?.name||'')}${f('Cliente',c.name)}${f('Decisión del cliente',o.approval||'Pendiente')}${f('Cotización',q?.code||'')}</div>
<div class="row spread"><b>${money(T)}</b><span class="pill orange">${T==null?'Cobro desconocido':paid(o)>=T&&T>0?'Cobrado':'Pendiente / CxC'}</span></div>
<div class="r77-lastmsg" onclick="event.stopPropagation();orderChat('${o.id}')" title="Abrir la bitácora de la orden">${last?`<span>💬 <b>${esc(tech(last.actor)||last.actor)}</b>: ${esc(String(last.text||last.kind||'').replace(/\s+/g,' ').slice(0,140))} <em>(${esc(r77Ago(last.date))})</em></span>`:'<span class="sub">💬 Sin mensajes en la bitácora</span>'}${n?`<span class="r77-badge" title="Mensajes nuevos">${n}</span>`:''}</div></article>`}
const r77CardsList=orderCards;
orderCards=function(){const h=r77CardsList(),ids=[...new Set([...h.matchAll(/openOrder\('([^']+)'\)/g)].map(m=>m[1]))];if(!ids.length)return h;return ids.map(id=>r77OdsCard(id,true)).join('')};
/* contador en el menú Bitácora y en el botón de la orden */
const r77ShellNb=r77ShellSync;
r77ShellSync=function(){r77ShellNb();try{const n=r77UnreadTotal();document.querySelectorAll('#nav button[onclick="go(\'bitacora\')"]').forEach(b=>{b.querySelector('.r77-badge')?.remove();if(n)b.insertAdjacentHTML('beforeend',`<span class="r77-badge" title="Mensajes nuevos en la bitácora">${n}</span>`)})}catch{}};
const r77OrdBadge=r72OpenOrder;
r72OpenOrder=function(id,...r){const out=r77OrdBadge(id,...r);try{const n=r77OrdUnread(id);document.querySelectorAll('#modalbody button[onclick*="orderChat"]').forEach(b=>{b.querySelector('.r77-badge')?.remove();if(n)b.insertAdjacentHTML('beforeend',`<span class="r77-badge">${n}</span>`)})}catch{}return out};
const r77MenuBase2=r77OdsMenu;
r77OdsMenu=function(e,btn,id){const o=db.orders.find(x=>x.id===id);if(!o)return;e.stopPropagation();const n=r77OrdUnread(id);
  r77MenuShow(btn,[{icon:'👁',label:'Ver ODS',fn:()=>openOrder(id)},{icon:'✎',label:'Editar',fn:()=>r72OpenOrder(id)},{icon:'🚗',label:'Estado del vehículo',fn:()=>r77OrderVeh(id)},{icon:'▤',label:'Documentos',fn:()=>orderDocuments(id)},{icon:'☰',label:'Bitácora'+(n?' ('+n+' nuevos)':''),fn:()=>orderChat(id)},{icon:'🗑',label:'Eliminar orden',red:true,fn:()=>r77OdsDelete(id)}])};
const r77CloseBase=closeModal;
closeModal=function(){r77CloseBase();r77DraftClean();if(page==='ods')render()};
