
/* --------------------------------------------------------------------------
   Migración de datos y arranque R7.2
   -------------------------------------------------------------------------- */
function r72Ensure(){
  db.r72quotes??=[];db.r72evidence??=[];
  db.catalog.forEach((c,i)=>{c.code??=(c.type==='servicio'?'S':'P')+String(i+1).padStart(4,'0')});
  R72_CATALOG.forEach(([code,name,type,price,hours,cost])=>{if(!db.catalog.some(c=>c.code===code))db.catalog.push({id:'cat-'+code,code,name,type,price,hours:hours??null,cost:cost??(type==='servicio'?0:null),stock:type==='producto'?code!=='P0207':null,notes:'Precio referencial de demostración'})});
  db.orders.forEach(o=>{o.time??='08:00';o.odsType??='Express';o.lines??=[];o.lines.forEach(l=>{l.approved??=(o.state==='Archivada'||o.approval==='Aprobada');l.announced??=true;l.discount??=0;if(l.type==='servicio')l.hours??=+l.qty||0})});
  db.appointments.forEach(a=>{if(!R72_CITA_STATES.includes(a.state))a.state=a.order?'Completada':'Pendiente';a.client??=vehicle(a.vehicle).client||null;if(!a.quote){const q={id:uid(),code:r72QuoteCode(),appointment:a.id,lines:(a.services||[]).map(s=>({id:s.id||uid(),type:'servicio',code:'',name:s.name,hours:+s.hours||0,qty:+s.hours||0,price:null,cost:0,discount:0,tech:s.tech,approved:false,announced:true})),createdAt:a.createdAt||new Date().toISOString(),usedBy:a.order||null,tech:a.tech};db.r72quotes.push(q);a.quote=q.id}});
  db.tasks.forEach(t=>{if(t.type==='Orden de servicio'){t.type='Evento';t.eventTag='Orden de servicio';if(t.orderId)t.r72k??='o:'+t.orderId}else if(t.type==='Cita'){const a=db.appointments.find(x=>x.id===(t.appointmentId||t.appointment));if(a&&a.eventTask==null&&t.appointmentId){t.type='Evento';t.eventTag='Cita';t.r72k='q:'+a.quote;a.eventTask=t.id}else{t.type='Tarea';t.tags=(t.tags?t.tags+', ':'')+'Cita'}}if(t.serviceLineId&&!t.r72line){t.type='Servicio';t.r72line=t.serviceLineId}});
  if(!modules.some(m=>m[0]==='citas')){const i=modules.findIndex(m=>m[0]==='ods');modules.splice(i+1,0,['citas','▣','Citas'])}
  const h=document.querySelector('main>header');if(h&&!h.querySelector('.r72-navbtn'))h.insertAdjacentHTML('afterbegin','<button type="button" class="r72-navbtn" onclick="r72NavToggle()" title="Ocultar o mostrar el menú lateral" aria-label="Ocultar o mostrar el menú lateral">☰</button>');
  if(r72Store('navmin'))document.body.classList.add('r72-navmin');(r72Store('folds')||[]).forEach(id=>R72.collapsed.add(id));
  $('modal').addEventListener('close',()=>{R72.open=null});
  const footer=document.querySelector('aside>div:last-child');if(footer)footer.innerHTML='Sedes Unión y Prohogar<br>Visión integral R7.2 · demo local';
  syncR5Automations();
}
const r72RenderBase=render;
render=function(){r72RenderBase();if(R72.focus&&!$('modal').open){const el=document.querySelector(`#view [data-focus="${R72.focus}"]`);R72.focus=null;if(el){el.focus();r72Suggest(el)}}};
r72Ensure();
