
/* --------------------------------------------------------------------------
   Tarea de tipo Evento (etiqueta Cita u Orden de servicio) con subtareas de
   tipo Servicio y Producto. Reemplaza la tarea de tipo «Orden de servicio».
   -------------------------------------------------------------------------- */
function r6TaskTypes(){return ['Tarea','Proyecto','Evento','Servicio','Producto']}
function r72EventOf(k){return db.tasks.find(t=>t.type==='Evento'&&t.r72k===k&&!t.deleted)}
function r72CitaTaskState(s){return {Pendiente:'Pendiente',Confirmada:'En proceso',Completada:'Completada',Cancelada:'Cancelada','No asistió':'Cancelada'}[s]||'Pendiente'}
function r72SyncEvent(k){
  const box=r72Box(k);if(!box)return null;const isO=k.startsWith('o:'),a=r72Cita(k),sch=r72BoxSched(k),v=r72BoxVehicle(k);
  let t=r72EventOf(k);
  if(!t){t={id:uid(),type:'Evento',r72k:k,priority:'Normal',list:'operativa',createdBy:actor,createdAt:new Date().toISOString(),description:'',tags:'',deleted:false};db.tasks.push(t)}
  const tag=isO?'Orden de servicio':'Cita',end=sch?r72End(sch.date,sch.start,r72Duration(box)):null;
  Object.assign(t,{eventTag:tag,title:tag+' · '+(v.plate||client(a?.client).name||'Sin vehículo')+' · '+(isO?box.code:box.code),owner:box.tech||a?.tech||t.owner||actor,
    start:sch?.date||today(),end:sch?.date||today(),due:sch?.date||today(),startTime:sch?timeText(sch.start):'08:00',endTime:end!=null?timeText(Math.round(end)):'09:00',
    orderId:isO?box.id:(a?.order||null),appointmentId:a?.id||t.appointmentId||null,
    state:isO?(box.state==='Archivada'?'Completada':'En proceso'):r72CitaTaskState(a?.state),description:isO?(box.reason||box.attentionType||''):(a?.note||'')});
  if(isO)box.taskId=t.id;else if(a)a.eventTask=t.id;
  const ids=new Set(box.lines.filter(l=>l.name).map(l=>l.id));
  db.tasks.filter(s=>s.parent===t.id&&s.r72line&&!ids.has(s.r72line)).forEach(s=>s.deleted=true);
  box.lines.filter(l=>l.name).forEach(l=>{let s=db.tasks.find(x=>x.parent===t.id&&(x.r72line===l.id||x.serviceLineId===l.id));
    if(!s){s={id:uid(),parent:t.id,r72line:l.id,priority:'Normal',list:l.type==='servicio'?'operativa':'logistica',createdBy:'Sistema',createdAt:new Date().toISOString(),state:'Pendiente',tags:'',deleted:false};db.tasks.push(s)}
    Object.assign(s,{type:l.type==='servicio'?'Servicio':'Producto',r72line:l.id,title:r72LineLabel(l)+(l.type==='servicio'?' · '+(l.hours||0)+' H-H':' · '+(l.qty||1)+' und.'),owner:(l.type==='servicio'?l.tech:l.logistic)||t.owner,start:t.start,end:t.end,due:t.due,startTime:t.startTime,endTime:t.endTime,orderId:t.orderId,deleted:false,description:l.type==='servicio'?'Servicio de '+r72BoxLabel(k):'Producto · '+(l.logisticTag||'Por cotizar')})});
  return t}
r6SyncOrderTask=function(o){r72SyncEvent('o:'+o.id);return r72EventOf('o:'+o.id)};

/* --- bloques de agenda: cada técnico recibe sus servicios en secuencia desde el inicio --- */
function r72SyncBlocks(k){
  const box=r72Box(k),sch=r72BoxSched(k);db.blocks=db.blocks.filter(b=>b.r72k!==k);if(!box||!sch)return;
  if(k.startsWith('q:')&&(box.usedBy||['Cancelada','No asistió'].includes(r72Cita(k)?.state)))return;
  if(k.startsWith('o:')&&box.state==='Archivada')return;
  const a=r72Cita(k),base={r72k:k,order:k.startsWith('o:')?box.id:null,appointment:a?.id||null,date:sch.date},svc=box.lines.filter(l=>l.type==='servicio'&&+l.hours>0);
  if(!svc.length){db.blocks.push({...base,id:uid(),start:sch.start,hours:q4(r72Duration(box)),tech:box.tech||a?.tech,name:(k.startsWith('o:')?'ODS ':'Cita ')+box.code+(a?.note?' · '+a.note.slice(0,40):'')});return}
  const byTech={};svc.forEach(l=>(byTech[l.tech||box.tech||a?.tech]??=[]).push(l));
  Object.entries(byTech).forEach(([tid,ls])=>{let cur=sch.start;ls.forEach(l=>{db.blocks.push({...base,id:uid(),start:cur,hours:q4(l.hours),tech:tid,name:r72LineLabel(l),service:l.id});cur=Math.round(r72End(sch.date,cur,l.hours))})})}

/* --- tareas de logística: cotizar (al asignar productos) y comprar (al aprobar la ODS) --- */
function r72EnsureLogTask(k,kind,logistic,lineIds,isNewFromTech=false){
  const box=r72Box(k);if(!logistic||!box)return null;
  let t=db.tasks.find(x=>!x.deleted&&x.r72log?.kind===kind&&x.r72log?.k===k&&x.owner===logistic&&!!x.r72log.fromTech===!!isNewFromTech&&!['Completada','Cancelada'].includes(x.state));
  const label=r72BoxLabel(k),title=kind==='cotizar'?(isNewFromTech?'Nuevo producto agregado pendiente de cotizar · ':'Cotizar productos · ')+label:'Comprar productos aprobados · '+label;
  if(!t){t={id:uid(),type:'Tarea',list:'logistica',owner:logistic,title,state:'Pendiente',priority:kind==='comprar'?'Alta':'Normal',start:today(),end:r72BoxSched(k)?.date||today(),due:r72BoxSched(k)?.date||today(),startTime:'08:00',endTime:'18:00',createdBy:'Sistema',createdAt:new Date().toISOString(),tags:kind==='cotizar'?'Cotización':'Compra',r72log:{kind,k,lineIds:[],fromTech:!!isNewFromTech},orderId:k.startsWith('o:')?box.id:null,appointmentId:r72Cita(k)?.id||null,description:'',deleted:false};db.tasks.push(t)}
  lineIds.forEach(id=>{if(!t.r72log.lineIds.includes(id))t.r72log.lineIds.push(id)});
  const ls=t.r72log.lineIds.map(id=>r72Line(k,id)).filter(Boolean);t.description=ls.map(l=>'• '+r72LineLabel(l)+' × '+(l.qty||1)).join('\n');
  if(kind==='comprar')ls.forEach(l=>{l.buyTask=t.id;l.logisticTag='Por comprar'});
  r72Log(k,kind==='cotizar'?'Tarea de cotización':'Tarea de compra','@'+tech(logistic)+' · '+ls.length+' productos · '+title);
  return t}
function r72PurchaseTasks(o){const k='o:'+o.id,groups={};o.lines.filter(l=>l.type==='producto'&&l.approved&&!l.buyTask&&!['Comprado','Entregado','Conforme'].includes(l.logisticTag)).forEach(l=>{const u=l.logistic||o.logistic||r72Logistics()[0]?.id;if(u)(groups[u]??=[]).push(l.id)});Object.entries(groups).forEach(([u,ids])=>r72EnsureLogTask(k,'comprar',u,ids));return Object.values(groups).flat().length}

/* --- decisión del cliente: aprobar confirma todos los ítems nuevos y libera compra y trabajo --- */
r7SetApproval=function(id,value){
  const o=db.orders.find(x=>x.id===id);if(!o)return;if(!r72CanApprove())return toast('La decisión del cliente la registra caja, jefe de taller o administrador.');
  const before=o.approval;o.approval=value;r7Log(id,'Decisión del cliente','La decisión cambió de '+before+' a '+value+'.');
  if(value==='Aprobada'){const nuevos=o.lines.filter(l=>!l.approved&&l.name);o.lines.forEach(l=>l.approved=true);const buy=r72PurchaseTasks(o);o.productStage=buy?'Por comprar':o.productStage;
    if(nuevos.length)r7Log(id,'Notificación','Se aprobaron '+nuevos.length+' ítems nuevos: '+nuevos.map(r72LineLabel).join(', ')+'. @Técnico puede iniciar/continuar el servicio.'+(buy?' @Logística comprar los productos aprobados.':''))}
  if(value==='No aprobada')o.state='Archivada';
  r72SyncEvent('o:'+id);r72SyncBlocks('o:'+id);r72Commit('Decisión del cliente',o.code+' · '+value)};
const r72StateBase=r7SetOrderState;
r7SetOrderState=function(id,value){r72StateBase(id,value);r72SyncEvent('o:'+id);r72SyncBlocks('o:'+id);if(R72.open?.id===id)r72Reopen()};

/* --- completar tareas de logística --- */
const r72InlineBase=r6Inline;
r6Inline=function(id,field,value){const t=db.tasks.find(x=>x.id===id);const was=t?.state;r72InlineBase(id,field,value);if(!t||field!=='state'||value!=='Completada'||was==='Completada')return;
  if(t.r72log){const k=t.r72log.k,ls=t.r72log.lineIds.map(i=>r72Line(k,i)).filter(Boolean);
    if(t.r72log.kind==='cotizar'){ls.forEach(l=>{if(l.logisticTag==='Por cotizar'&&l.price!=null)l.logisticTag='Cotizado'});r72Log(k,'Cotización lista','@Cajera: '+tech(t.owner)+' cotizó '+ls.length+' productos. Confirmar con el cliente y aprobar.')}
    else{const ev=db.r72evidence.filter(e=>e.task===id);ls.forEach(l=>l.logisticTag=ev.some(e=>e.kind==='Entrega')?'Entregado':'Comprado');r72Log(k,'Compra completada',tech(t.owner)+' completó la compra de '+ls.length+' productos'+(ev.length?' · '+ev.length+' evidencias':''))}
    save('Tarea de logística completada',t.title)}
  if(t.type==='Evento'&&t.r72k?.startsWith('q:')){const a=r72Cita(t.r72k);if(a&&a.state!=='Completada')setTimeout(()=>r72CitaState(a.id,'Completada'))}};

/* --- evidencias de compra / entrega: se guarda la hora exacta de captura --- */
function r72AddEvidence(taskId,input){const f=input.files?.[0],kind=input.closest('form')?.elements.kind?.value||'Sin clasificar';if(!f)return;if(f.size>900000)return toast('Imagen de hasta 900 KB en esta demo.');const r=new FileReader();r.onload=()=>{const t=db.tasks.find(x=>x.id===taskId);db.r72evidence.push({id:uid(),task:taskId,k:t?.r72log?.k,kind,name:f.name,at:new Date().toISOString(),fileTime:f.lastModified?new Date(f.lastModified).toISOString():null,data:f.type.startsWith('image/')?r.result:null,actor});r72Log(t?.r72log?.k,'Evidencia de logística',kind+' · '+f.name+' · '+new Date().toLocaleString('es-PE'));save('Evidencia registrada',f.name)};r.readAsDataURL(f)}
function r72SetEvidenceKind(id,kind){const e=db.r72evidence.find(x=>x.id===id);if(e){e.kind=kind;save('Evidencia reclasificada',kind)}}
