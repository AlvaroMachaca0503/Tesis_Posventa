
/* --------------------------------------------------------------------------
   Migración y arranque R7.3
   -------------------------------------------------------------------------- */
function r73Ensure(){
  db.users.forEach(u=>{u.sede??=u.id==='u-luis'?'prohogar':'union'});
  if(!db.folders.some(f=>f.id==='f-gerencia'))db.folders.unshift({id:'f-gerencia',name:'Gerencia'});
  [['supervision','Supervisión general'],['administracion','Administración general']].forEach(([id,name])=>{if(!db.lists.some(l=>l.id===id))db.lists.push({id,name,folderId:'f-gerencia',folder:'Gerencia'})});
  db.appointments.forEach(a=>{a.code??=r73CitaCodeNew();a.branch??=r73UserSede()});
  db.r72quotes.forEach(q=>{q.branch??=db.appointments.find(a=>a.id===q.appointment)?.branch||'union';if(q.usedBy&&!q.order){q.order=q.usedBy;q.lines=[]}q.createdBy??=actor});
  db.orders.filter(o=>['demo','sintético'].includes(o.origin)&&!db.r72quotes.some(q=>q.order===o.id)).forEach(o=>{const q=r73NewQuoteRecord({order:o.id,usedBy:o.id,vehicle:o.vehicle,client:vehicle(o.vehicle).client,branch:o.branch==='prohogar'?'prohogar':'union',createdAt:o.createdAt||new Date(o.date+'T12:00:00').toISOString()});o.quote=q.id});
  db.tasks.forEach(t=>{if(t.eventTag==='Orden de servicio')t.eventTag='ODS';if(t.type==='Evento')t.title=t.title.replace(/^Orden de servicio · /,'ODS · ')});
  const ren={'cash-union':'Banco Efectivo Unión','cash-prohogar':'Banco Efectivo Prohogar'};db.bankAccounts.forEach(a=>{if(ren[a.id]&&!a.renamed){a.name=ren[a.id];a.renamed=true}if(a.id==='cash-union')a.branch='union';if(a.id==='cash-prohogar')a.branch='prohogar';if(a.id==='bank-union')a.branch='union';if(a.id==='bank-prohogar')a.branch='prohogar'});
  const pend=[...db.advances,...db.payments,...db.transfers,...db.purchaseInvoices.flatMap(i=>i.payments||[])].filter(x=>!x.seq).sort((a,b)=>String(a.date).localeCompare(String(b.date)));pend.forEach(x=>x.seq=r73Seq());
  db.bankAccounts.forEach(a=>{if(a.initial==null){const ms=r73Movs(a.id);a.initial=r2(a.balance-ms.reduce((s,m)=>s+m.debit-m.credit,0))}});
  db.r73tlRules??=[{id:'tlr-motor',match:'reparacion de motor',target:'Cambio de aceite de motor',active:true,note:'Una reparación de motor reinicia el aceite y su filtro desde ese km.'}];
  db.settings.bankAmountRoles??=['Administrador'];
  r73Nav();
}
const r73RenderBase=render;
render=function(){r73RenderBase();const main=document.querySelector('main'),hd=main?.querySelector('header');if(hd){let bar=main.querySelector('.r73-favtabs');const html=r73FavTabs();if(bar)bar.outerHTML=html||'<span class="r73-favtabs" hidden></span>';else hd.insertAdjacentHTML('afterend',html||'<span class="r73-favtabs" hidden></span>')}if(R73.dp)r73DPRender()};
r73Ensure();
