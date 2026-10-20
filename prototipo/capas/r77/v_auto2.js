
/* --------------------------------------------------------------------------
   R7.7 · Más automatizaciones configurables
   - Nuevos desencadenantes: producto o servicio agregado a la ODS, producto
     aprobado, pago o abono, nota de venta, vehículo nuevo, tarea creada y
     tarea atrasada.
   - Las tareas que el sistema creaba solo para el logístico (cotizar,
     cotizar lo que agrega el técnico, comprar lo aprobado) ahora son reglas
     que se ven, se apagan y se editan.
   - Más plantillas listas para usar en «Explorar».
   -------------------------------------------------------------------------- */
R77_TR.push(['producto_ods','Se agregue un producto a la ODS','order'],['servicio_ods','Se agregue un servicio a la ODS','order'],['producto_aprobado','El cliente apruebe un producto','order'],['pago_registrado','Se registre un pago o abono','order'],['nota_creada','Se emita una nota de venta','order'],['vehiculo_creado','Se registre un vehículo','vehicle'],['tarea_creada','Se cree una tarea','task'],['tarea_atrasada','Una tarea quede atrasada (pasó su fecha límite)','task']);
const R77_CTXMAP={producto_ods:'ods_creada',servicio_ods:'ods_creada',producto_aprobado:'ods_creada',pago_registrado:'ods_creada',nota_creada:'ods_creada',vehiculo_creado:'km_consulta',tarea_creada:'tarea_estado',tarea_atrasada:'tarea_estado'};
/* foto de los datos para detectar los sucesos nuevos */
const r77SnapBase2=r77SnapNow;
r77SnapNow=function(){const s=r77SnapBase2();s.x2=1;s.l={};s.p={};s.n={};s.vh={};s.tc={};
  db.orders.forEach(o=>{if(o.deleted)return;(o.lines||[]).forEach(l=>{if(l.name)s.l[l.id]=l.approved?1:0})});
  [...(db.payments||[]),...(db.advances||[])].forEach(p=>s.p[p.id]=1);(db.notes||[]).forEach(n=>s.n[n.id]=1);db.vehicles.forEach(v=>s.vh[v.id]=1);db.tasks.forEach(t=>s.tc[t.id]=1);return s};
const r77EvBase2=r77Events;
r77Events=function(){const old=R77.snap,ev=r77EvBase2();if(!old||!old.x2)return ev;
  try{db.orders.forEach(o=>{if(o.deleted)return;(o.lines||[]).forEach(l=>{if(!l.name)return;const was=old.l[l.id];
      if(was===undefined)ev.push({tr:l.type==='producto'?'producto_ods':'servicio_ods',id:l.id,ent:o,line:l,sv:''});
      if(l.type==='producto'&&l.approved&&(was===0||was===undefined))ev.push({tr:'producto_aprobado',id:l.id,ent:o,line:l,sv:''})})});
    [...(db.payments||[]),...(db.advances||[])].forEach(p=>{if(old.p[p.id])return;const o=db.orders.find(x=>x.id===(p.order||p.orderId));if(o)ev.push({tr:'pago_registrado',id:p.id,ent:o,pay:p,sv:''})});
    (db.notes||[]).forEach(n=>{if(old.n[n.id])return;const o=db.orders.find(x=>x.id===n.order);if(o)ev.push({tr:'nota_creada',id:n.id,ent:o,note:n,sv:''})});
    db.vehicles.forEach(v=>{if(!old.vh[v.id])ev.push({tr:'vehiculo_creado',id:v.id,ent:v,sv:''})});
    db.tasks.forEach(t=>{if(old.tc[t.id]||t.deleted||t.r77||t.parent||t.crm?.demo||['Evento','Servicio','Producto'].includes(t.type))return;ev.push({tr:'tarea_creada',id:t.id,ent:t,sv:''})})}catch(err){console.warn('r77 sucesos nuevos',err)}
  return ev};
/* tarea atrasada: se revisa con el reloj (también con la hora simulada) */
const r77TimeBase2=r77TimeEvents;
r77TimeEvents=function(){const base=r77TimeBase2(),d=r74Iso(r74Now());
  if(!r77Db().rules.some(r=>r.active&&r.trigger==='tarea_atrasada'))return base;
  const lim=r77OffDay(d,30,'dias','consecutivos','antes');
  return base.concat(db.tasks.filter(t=>!t.deleted&&t.due&&t.due<d&&t.due>=lim&&!['Completada','Cancelada'].includes(t.state)&&!['Evento','Servicio','Producto'].includes(t.type)).map(t=>({tr:'tarea_atrasada',id:t.id,ent:t,sv:t.due})))};
/* variables extra: {producto}, {monto}, {nota}, {origen} */
const r77CtxBase2=r77Ctx;
r77Ctx=function(e){const m=R77_CTXMAP[e.tr],x=r77CtxBase2(m?{...e,tr:m}:e);
  x.origen=x.origen||x.a?.code||'';x.producto=e.line?.name||'';if(e.pay)x.monto=money(+e.pay.amount||0);if(e.note)x.nota=e.note.code||'';return x};
/* las reglas «de compuerta» solo encienden o apagan la creación que hace el sistema: no se procesan como sucesos */
const r77IsGate=r=>String(r.pre||'').startsWith('g_');
const r77ProcBase2=r77Process;
r77Process=function(events,dry,only){const d=r77Db(),all=d.rules;d.rules=all.filter(r=>!r77IsGate(r));try{return r77ProcBase2(events,dry,only&&r77IsGate(only)?{trigger:'__none__',actions:[]}:only)}finally{d.rules=all}};
const R77_GATE={g_cotizar:'producto_ods',g_cotizar_tec:'producto_ods',g_comprar:'producto_aprobado'};
const r77GateKey=(kind,isNew)=>kind==='comprar'?'g_comprar':isNew?'g_cotizar_tec':'g_cotizar';
const r77GateBase=r72EnsureLogTask;
r72EnsureLogTask=function(k,kind,logistic,lineIds,isNew){const key=r77GateKey(kind,isNew),r=r77Pre(key);if(r&&!r.active)return null;
  const had=new Set(db.tasks.map(t=>t.id)),t=r77GateBase.apply(this,arguments);
  try{if(t&&r&&!had.has(t.id)){const a=r.actions?.[0]||{},box=r72Box(k);
      if(box&&k.startsWith('o:')){const x=r77Ctx({tr:'ods_creada',id:box.id,ent:box});x.origen=r72BoxLabel(k);if(a.title)t.title=r77Fill(a.title,x);if(a.desc)t.description=r77Fill(a.desc,x)}
      if(a.priority&&a.priority!=='auto')t.priority=a.priority;if(a.list)t.list=a.list;if(a.tags)t.tags=a.tags;
      if(a.dueN!==undefined&&a.dueN!==null&&a.dueN!==''){const w=r77When(a.dueN,a.dueUnit||'dias',a.dueMode||'habiles','despues');t.due=t.end=w.date}
      t.r77={rule:r.id,ruleName:r.name,event:R77_GATE[key]};
      const dd=r77Db();dd.runs.unshift({id:uid(),at:new Date().toISOString(),sim:r74AutoCfg().sim||null,rule:r.id,ruleName:r.name,event:r77Tr(R77_GATE[key])[1]+' · '+r72BoxLabel(k),key:r.id+'|'+t.id,dry:false,status:'Ejecutada',result:'Creó la tarea «'+t.title+'»',task:t.id});dd.runs=dd.runs.slice(0,300)}}catch(err){console.warn('r77 compuerta',err)}
  return t};
/* la compuerta conserva su desencadenante */
const r77EdSaveBase2=r77EdSave;
r77EdSave=function(){const dr=R77.dr;if(dr&&R77_GATE[dr.pre]){dr.trigger=R77_GATE[dr.pre];dr.conds=[]}return r77EdSaveBase2()};
function r77EnsureSeeds4(){const d=r77Db(),log=db.users.find(u=>u.active&&/log/i.test(u.role))?.id||db.users.find(u=>u.role==='Administrador')?.id||'u-admin',
  mk=(k,r)=>{if(r77Pre(k)||d.gone.includes(k))return;d.rules.push({id:'seed-'+k,pre:k,conds:[],active:true,createdAt:new Date().toISOString(),...r})},
  act=o=>({...r77NewAct('tarea'),owner:log,list:'logistica',state:'Pendiente',...o});
  mk('g_cotizar',{name:'Producto en la ODS → cotizar con el logístico',desc:'Cuando se asigna un producto a un logístico, se crea la tarea «Cotizar productos». El responsable es el logístico que se elige al asignar el producto; aquí cambias el título, la prioridad, la lista y el plazo. Si la apagas, no se crea la tarea.',trigger:'producto_ods',actions:[act({priority:'Normal',title:'Cotizar productos · {origen}',desc:'',tags:'Cotización'})]});
  mk('g_cotizar_tec',{name:'Producto agregado por el técnico → cotizar con el logístico',desc:'Cuando el técnico agrega un producto nuevo a una ODS, se crea una tarea aparte para cotizarlo. Si la apagas, no se crea la tarea.',trigger:'producto_ods',actions:[act({priority:'Normal',title:'Nuevo producto agregado pendiente de cotizar · {origen}',desc:'',tags:'Cotización'})]});
  mk('g_comprar',{name:'Cliente aprueba productos → comprar con el logístico',desc:'Cuando el cliente aprueba los productos cotizados, se crea la tarea «Comprar productos aprobados» para el logístico. Si la apagas, no se crea la tarea.',trigger:'producto_aprobado',actions:[act({priority:'Alta',title:'Comprar productos aprobados · {origen}',desc:'',tags:'Compra'})]})}
/* plantillas nuevas en Explorar */
const r77TplBase2=r77Templates;
r77Templates=function(){const caja=r74AutoCfg().owner,jefe=db.users.find(u=>u.role==='Jefe de taller'&&u.active)?.id||caja,log=db.users.find(u=>u.active&&/log/i.test(u.role))?.id||jefe,T=(cat,icon,name,desc,rule)=>({cat,icon,name,desc,rule}),A=(o)=>({...r77NewAct('tarea'),...o});
  return r77TplBase2().concat([
  T('Órdenes de servicio','▤ → 🔔','ODS sin técnico al crearse → avisar','Avisa al jefe de taller cuando se crea una ODS sin técnico asignado.',{name:'ODS sin técnico → avisar al jefe de taller',trigger:'ods_creada',conds:[{k:'sintecnico',v:''}],actions:[{type:'aviso',owner:jefe,title:'La ODS {ods} ({placa}) se creó sin técnico'}]}),
  T('Órdenes de servicio','▤ → 💬','ODS de vehículo con plan → comentario','Deja un comentario en la bitácora cuando la ODS es de un vehículo con plan preventivo.',{name:'ODS con plan preventivo → comentario',trigger:'ods_creada',conds:[{k:'plan',v:''}],actions:[{type:'comentario',title:'Vehículo {placa} con plan preventivo: revisar el plan antes de cotizar.'}]}),
  T('Órdenes de servicio','▤ → ☑','ODS cerrada con deuda → cobrar','Crea la tarea de cobrar cuando se cierra una ODS de un cliente con deuda.',{name:'ODS cerrada con deuda → cobrar',trigger:'ods_archivada',conds:[{k:'deuda',v:'si'}],actions:[A({owner:caja,list:'finanzas',priority:'Alta',dueN:1,title:'Cobrar la deuda de {cliente.nombre} ({cliente.deuda})',desc:'La ODS {ods} se cerró y el cliente tiene deuda pendiente.'})]}),
  T('Productos y logística','⚙ → 🔔','Producto aprobado → avisar al logístico','Avisa al logístico cuando el cliente aprueba un producto.',{name:'Producto aprobado → avisar al logístico',trigger:'producto_aprobado',conds:[],actions:[{type:'aviso',owner:log,title:'El cliente aprobó «{producto}» en la ODS {ods}'}]}),
  T('Productos y logística','⚙ → ☑','Producto agregado → tarea de revisar stock','Crea la tarea de revisar si el producto está en stock cuando se agrega a una ODS.',{name:'Producto agregado → revisar stock',trigger:'producto_ods',conds:[],actions:[A({owner:log,list:'logistica',dueN:0,title:'Revisar stock de «{producto}» (ODS {ods})'})]}),
  T('Pagos y ventas','＄ → 💬','Pago registrado → comentario','Deja un comentario en la bitácora de la ODS cuando se registra un pago o abono.',{name:'Pago registrado → comentario',trigger:'pago_registrado',conds:[],actions:[{type:'comentario',title:'Se registró un pago de {monto} en la ODS {ods}.'}]}),
  T('Pagos y ventas','＄ → 🔔','Pago registrado → avisar a administración','Avisa a la administración de cada pago o abono.',{name:'Pago registrado → avisar a administración',trigger:'pago_registrado',conds:[],actions:[{type:'aviso',owner:'u-admin',title:'Pago de {monto} · ODS {ods} · {cliente}'}]}),
  T('Pagos y ventas','▧ → ☑','Nota de venta → enviar por WhatsApp','Crea la tarea de enviar la nota de venta al cliente por WhatsApp.',{name:'Nota de venta → enviar al cliente',trigger:'nota_creada',conds:[{k:'celular',v:'si'}],actions:[A({owner:caja,list:'postventa',dueN:0,title:'Enviar la nota {nota} a {cliente.nombre} por WhatsApp',desc:'Celular: {cliente.tel}'})]}),
  T('Citas','▣ → ☑','Cita cancelada → ofrecer otra fecha','Crea la tarea de llamar al cliente cuando se cancela una cita.',{name:'Cita cancelada → ofrecer otra fecha',trigger:'cita_cancelada',conds:[{k:'celular',v:'si'}],actions:[A({owner:caja,list:'postventa',dueN:1,title:'Llamar a {cliente} para ofrecer otra fecha (cita {cita})'})]}),
  T('Citas','▣ → 🔔','Cita de cliente con deuda → avisar a caja','Avisa a la cajera cuando se agenda la cita de un cliente con deuda.',{name:'Cita de cliente con deuda → avisar a caja',trigger:'cita_creada',conds:[{k:'deuda',v:'si'}],actions:[{type:'aviso',owner:caja,title:'{cliente} tiene deuda pendiente y agendó la cita {cita}'}]}),
  T('Vehículos','◇ → ☑','Vehículo nuevo → completar datos','Crea la tarea de completar VIN y motor cuando se registra un vehículo sin esos datos.',{name:'Vehículo nuevo → completar datos',trigger:'vehiculo_creado',conds:[{k:'campo',mod:'vehiculo',f:'vin',op:'notiene',v:''}],actions:[A({owner:caja,list:'postventa',dueN:2,title:'Completar VIN y motor del vehículo {placa}'})]}),
  T('Tareas','☑ → 🔔','Tarea atrasada → avisar','Avisa al jefe de taller cuando una tarea pasa su fecha límite sin completarse.',{name:'Tarea atrasada → avisar',trigger:'tarea_atrasada',conds:[],actions:[{type:'aviso',owner:jefe,title:'Atrasada: {tarea}'}]}),
  T('Tareas','☑ → 🔔','Tarea urgente creada → avisar','Avisa al jefe de taller cuando se crea una tarea de prioridad Urgente.',{name:'Tarea urgente → avisar',trigger:'tarea_creada',conds:[{k:'prioridad',v:'Urgente'}],actions:[{type:'aviso',owner:jefe,title:'Nueva tarea urgente: {tarea}'}]})])};
