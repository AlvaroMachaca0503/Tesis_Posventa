
/* --------------------------------------------------------------------------
   R7.7 · Motor de reglas «Cuando / Y si / Entonces» (formato de ClickUp).
   Todas las reglas viven en una sola lista. Las 3 de R7.4 (km, cita,
   posventa) son reglas «de sistema» con el mismo formato: su cálculo sigue en
   el código de R7.4 y aquí se editan sus parámetros. Las reglas solo crean
   tareas, avisos y comentarios: nunca cambian ODS, citas, agenda ni dinero.
   -------------------------------------------------------------------------- */
const R77={snap:null,tab:'gestionar',q:'',fs:'activo',fo:'',f:{rule:'',status:''},dr:null,maxPerPass:25};
function r77Db(){const d=db.r77??={rules:[],runs:[],keys:{},gone:[]};d.rules??=[];d.runs??=[];d.keys??={};d.gone??=[];return d}
const R77_OBJ=[['order','Órdenes de servicio'],['cita','Citas'],['vehicle','Vehículos'],['task','Tareas o subtareas']];
/* [id, texto del chip «Cuando…», objeto] */
const R77_TR=[['ods_creada','Se cree una ODS','order'],['servicio_externo','Se asigne un servicio a «Servicios externos»','order'],['ods_archivada','Se archive la ODS','order'],['ods_estado','La ODS pase a un estado','order'],['correccion_solicitada','Se solicite editar una ODS cerrada','order'],['correccion_aprobada','Se apruebe editar una ODS cerrada','order'],['correccion_rechazada','No se apruebe editar una ODS cerrada','order'],['encuesta','Se responda una encuesta','order'],['ods_tiempo','Pase un tiempo desde la salida de la ODS','order'],['cita_creada','Se cree la cita','cita'],['cita_confirmada','La cita pase a Confirmada','cita'],['cita_cancelada','La cita pase a Cancelada','cita'],['cita_noasistio','La cita pase a No asistió','cita'],['cita_tiempo','Falte poco para la hora de la cita','cita'],['km_consulta','Se registre una consulta de km','vehicle'],['km_tiempo','Falte poco para el cambio de aceite','vehicle'],['tarea_completada','Se complete la tarea','task'],['tarea_estado','La tarea pase a un estado','task'],['tarea_vence','Llegue la fecha límite','task']];
/* [id, etiqueta, objetos, tipo de valor, solo para el suceso] */
const R77_CD=[['sede','Sede',['order','cita'],'branch'],['celular','Cliente con celular',['order','cita','vehicle'],'bool'],['deuda','Cliente con deuda pendiente',['order','cita','vehicle'],'bool'],['plan','Vehículo con plan preventivo',['order','cita','vehicle'],'none'],['sintecnico','ODS sin técnico asignado',['order'],'none'],['nps','Recomendación de la encuesta (1 a 10)',['order'],'num','encuesta'],['prioridad','Prioridad de la tarea',['task'],'prio'],['etiqueta','Etiqueta de la tarea',['task'],'text'],['tipotarea','Tipo de tarea',['task'],'ttype'],['campo','Dato de un módulo…',['order','cita','vehicle','task'],'campo']];
/* unidades de tiempo y modos (todo editable en las reglas) */
const R77_UN=[['minutos','minutos'],['horas','horas'],['dias','días'],['semanas','semanas'],['meses','meses'],['anios','años']];
const R77_MD=[['habiles','hábiles (según el horario del sistema)'],['consecutivos','consecutivos (calendario)']];
/* módulos y campos que se pueden leer: cliente, vehículo, ODS, cita y tarea */
const R77_MOD={cliente:['Cliente',[['nombre','Nombres y apellidos',x=>x.c?.name],['doc','Documento (DNI/RUC)',x=>x.c?.doc],['tipodoc','Tipo de documento',x=>x.c?.docType],['tel','Celular',x=>x.c?.phone],['correo','Correo',x=>x.c?.email],['dir','Dirección',x=>x.c?.address||x.c?.direccion],['deuda','Deuda pendiente',x=>x.c?.id?money(r77Debt(x.c.id)):'']]],
  vehiculo:['Vehículo',[['placa','Placa',x=>x.v?.plate],['marca','Marca',x=>x.v?.brand],['modelo','Modelo',x=>x.v?.model],['anio','Año',x=>x.v?.year],['vin','VIN',x=>x.v?.vin],['motor','Motor',x=>x.v?.engine],['km','Kilometraje',x=>x.v?.km],['plan','Plan preventivo',x=>x.v?.plan]]],
  ods:['Orden de servicio',[['codigo','Código',x=>x.o?.code],['ingreso','Fecha de ingreso',x=>x.o?.date],['salida','Fecha de salida',x=>x.o?.closed?String(x.o.closed).slice(0,10):''],['estado','Estado',x=>x.o?(typeof r77StLabel==='function'?r77StLabel(x.o.state):x.o.state):''],['km','Kilometraje',x=>x.o?.km],['tecnico','Técnico',x=>x.o?(tech(x.o.tech)||x.o.technicianName||''):''],['total','Total',x=>x.o?money(orderTotal(x.o)):'']]],
  cita:['Cita',[['codigo','Código',x=>x.a?.code],['fecha','Fecha',x=>x.a?.date],['hora','Hora',x=>x.a?.time],['estado','Estado',x=>x.a?.state]]],
  tarea:['Tarea',[['titulo','Título',x=>x.t?.title],['estado','Estado',x=>x.t?.state],['prioridad','Prioridad',x=>x.t?.priority],['vence','Fecha límite',x=>x.t?.due],['etiquetas','Etiquetas',x=>x.t?.tags]]],
  solicitud:['Solicitud de edición',[['motivo','Motivo',x=>x.req?.reason],['solicitante','Solicitante',x=>x.req?tech(x.req.requester):''],['estado','Estado',x=>x.req?.state]]]};
const R77_FAM_MODS={order:['cliente','vehiculo','ods'],cita:['cliente','vehiculo','cita'],vehicle:['cliente','vehiculo'],task:['tarea','ods','cliente','vehiculo','cita']};
function r77ModsFor(trigger){const t=r77Tr(trigger);if(!t)return [];const m=R77_FAM_MODS[t[2]];return trigger.startsWith('correccion_')?[...m,'solicitud']:m}
function r77Field(mod,f,x){const m=R77_MOD[mod],fd=m?.[1].find(z=>z[0]===f);if(!fd)return undefined;const v=fd[2](x);return v==null?'':v}
const R77_OPS=[['tiene','tiene dato'],['notiene','no tiene dato'],['igual','es igual a'],['contiene','contiene']];
/* fechas con unidad y modo: minutos y horas son de reloj; días, semanas, meses y años pueden ser hábiles o consecutivos */
function r77IsBizDay(iso){return !!scheduleFor(iso)?.open}
function r77BizShift(iso,n){const d=new Date(iso+'T12:00:00'),s=n<0?-1:1;let k=Math.abs(n),g=0;while(k>0&&g++<4000){d.setDate(d.getDate()+s);if(r77IsBizDay(r74Iso(d)))k--}return r74Iso(d)}
function r77RollBiz(iso,dir){const d=new Date(iso+'T12:00:00');let g=0;while(!r77IsBizDay(r74Iso(d))&&g++<14)d.setDate(d.getDate()+(dir==='antes'?-1:1));return r74Iso(d)}
function r77OffDay(iso,n,unit,mode,dir){n=+n||0;const s=dir==='antes'?-1:1,d=new Date(iso+'T12:00:00');
  if(unit==='dias')return mode==='consecutivos'?(d.setDate(d.getDate()+s*n),r74Iso(d)):r77BizShift(iso,s*n);
  if(unit==='semanas')d.setDate(d.getDate()+s*7*n);else if(unit==='meses')d.setMonth(d.getMonth()+s*n);else if(unit==='anios')d.setFullYear(d.getFullYear()+s*n);else return iso;
  const o=r74Iso(d);return mode==='consecutivos'?o:r77RollBiz(o,dir)}
function r77When(n,unit,mode,dir,base){const b=base||r74Now();if(unit==='minutos'||unit==='horas'){const t=new Date(b.getTime()+(dir==='antes'?-1:1)*(+n||0)*(unit==='horas'?3600e3:60e3));return {date:r74Iso(t),time:r74Hm(t)}}return {date:r77OffDay(r74Iso(b),n,unit,mode,dir),time:null}}
const r77UnL=u=>R77_UN.find(x=>x[0]===u)?.[1]||u;
const R77_AT=[['tarea','Crear tarea'],['etiqueta','Añadir etiqueta a la ODS'],['aviso','Enviar notificación'],['comentario','Añadir comentario en la ODS']];
const r77Tr=id=>R77_TR.find(x=>x[0]===id);
const R77_SCAN={km_tiempo:{kind:'km',fn:'r74KmScan',def:{km:500,days:7}},cita_tiempo:{kind:'cita',fn:'r74CitaScan',def:{n:60,unit:'minutos',mode:'horario',dir:'antes'}},ods_tiempo:{kind:'post',fn:'r74PostScan',def:{n:5,unit:'dias',mode:'habiles',dir:'despues',win:7}}};
const r77Pre=k=>r77Db().rules.find(r=>r.pre===k);
const r77ScanRule=trig=>r77Db().rules.find(r=>r.trigger===trig);
function r77Active(r){return !!r.active}
function r77CondOk(cd,trigger){const t=r77Tr(trigger);if(!t)return false;const c=R77_CD.find(x=>x[0]===cd.k);if(!c||!c[2].includes(t[2])||(c[4]&&c[4]!==trigger))return false;if(cd.k==='campo')return r77ModsFor(trigger).includes(cd.mod)&&!!R77_MOD[cd.mod]?.[1].some(z=>z[0]===cd.f);return true}
function r77CondsFor(trigger){const t=r77Tr(trigger);return t?R77_CD.filter(c=>c[2].includes(t[2])&&(!c[4]||c[4]===trigger)):[]}
function r77CondText(cd){const v=cd.v;switch(cd.k){case'sede':return 'Sede es '+(db.branches.find(b=>b.id===v)?.name||v);case'celular':return v==='no'?'Cliente sin celular':'Cliente con celular';case'deuda':return v==='no'?'Cliente sin deuda':'Cliente con deuda';case'plan':return 'Vehículo con plan preventivo';case'sintecnico':return 'ODS sin técnico asignado';case'nps':return 'Recomendación ≤ '+v;case'prioridad':return 'Prioridad es '+v;case'etiqueta':return 'Etiqueta contiene «'+v+'»';case'tipotarea':return 'Tipo de tarea es '+v;case'campo':{const m=R77_MOD[cd.mod],f=m?.[1].find(z=>z[0]===cd.f);return (m?.[0]||cd.mod)+' · '+(f?.[1]||cd.f)+' '+(R77_OPS.find(o=>o[0]===cd.op)?.[1]||'')+((cd.op==='igual'||cd.op==='contiene')?' «'+v+'»':'')}}return cd.k}
function r77TrLabel(r){const p=r.p||{},sl=s=>typeof r77StLabel==='function'?r77StLabel(s):s;if(r.trigger==='km_tiempo')return `Falten ≤ ${p.km??500} km o ≤ ${p.days??7} días para el cambio de aceite`;if(r.trigger==='cita_tiempo')return `Falten ${p.n??60} ${r77UnL(p.unit||'minutos')}${(p.mode||'horario')==='horario'?' (horario de atención)':''} para la cita pendiente`;if(r.trigger==='ods_tiempo'){const hab=(p.unit||'dias')!=='minutos'&&(p.mode||'habiles')==='habiles';return `Pasen ${p.n??5} ${r77UnL(p.unit||'dias')}${hab?' hábiles':''} ${p.dir==='antes'?'antes':'después'} de la salida de la ODS`}if(r.trigger==='ods_estado')return `La ODS pase a «${sl(p.state||'En proceso')}»`;if(r.trigger==='tarea_estado')return `La tarea pase a «${p.state||'En proceso'}»`;return r77Tr(r.trigger)?.[1]||'…'}
function r77Obj(r){const t=r77Tr(r.trigger);return R77_OBJ.find(o=>o[0]===t?.[2])?.[1]||'…'}
function r77ActLabel(a){return R77_AT.find(x=>x[0]===a.type)?.[1]||'…'}
/* --- detección de sucesos: se compara el estado de los datos con la foto anterior --- */
function r77SnapNow(){const s={o:{},os:{},a:{},k:{},s:{},t:{},cr:{},x:{}};r77ExtLines().forEach(z=>{s.x[z.line.id]=1});(db.correctionRequests||[]).forEach(x=>s.cr[x.id]=x.state);db.orders.forEach(o=>{s.o[o.id]=!!(o.archived||o.state==='Archivada');s.os[o.id]=o.state});db.appointments.forEach(a=>s.a[a.id]=a.state);db.vehicles.forEach(v=>s.k[v.id]=(v.kmReads||[]).length);(db.r74surveys||[]).forEach(x=>s.s[x.id]=1);db.tasks.forEach(t=>s.t[t.id]=t.state);return s}
function r77Events(){const old=R77.snap,cur=r77SnapNow();R77.snap=cur;if(!old)return [];const ev=[];
  db.orders.forEach(o=>{if(cur.o[o.id]&&old.o[o.id]===false)ev.push({tr:'ods_archivada',id:o.id,ent:o,sv:''});if(old.os[o.id]===undefined&&!o.deleted)ev.push({tr:'ods_creada',id:o.id,ent:o,sv:''});if(old.os[o.id]!==undefined&&old.os[o.id]!==o.state)ev.push({tr:'ods_estado',id:o.id,ent:o,sv:o.state})});
  db.appointments.forEach(a=>{if(a.deleted)return;const was=old.a[a.id];if(was===undefined)ev.push({tr:'cita_creada',id:a.id,ent:a,sv:''});else if(was!==a.state){const m={'Confirmada':'cita_confirmada','Cancelada':'cita_cancelada','No asistió':'cita_noasistio'}[a.state];if(m)ev.push({tr:m,id:a.id,ent:a,sv:a.state})}});
  db.vehicles.forEach(v=>{const n=(v.kmReads||[]).length;if(old.k[v.id]!==undefined&&n>old.k[v.id])ev.push({tr:'km_consulta',id:v.id,ent:v,sv:String(n)})});
  (db.r74surveys||[]).forEach(x=>{if(!old.s[x.id]&&!x.deleted)ev.push({tr:'encuesta',id:x.id,ent:x,sv:''})});
  db.tasks.forEach(t=>{const was=old.t[t.id];if(was&&!['Completada','Cancelada'].includes(was)&&t.state==='Completada')ev.push({tr:'tarea_completada',id:t.id,ent:t,sv:''});if(was!==undefined&&was!==t.state)ev.push({tr:'tarea_estado',id:t.id,ent:t,sv:t.state})});
  (db.correctionRequests||[]).forEach(q=>{const was=old.cr[q.id];if(was===undefined)ev.push({tr:'correccion_solicitada',id:q.id,ent:q,sv:''});else if(was!==q.state){if(q.state==='Aprobada')ev.push({tr:'correccion_aprobada',id:q.id,ent:q,sv:''});else if(q.state==='No aprobada')ev.push({tr:'correccion_rechazada',id:q.id,ent:q,sv:''})}});
  r77ExtLines().forEach(z=>{if(!old.x[z.line.id])ev.push({tr:'servicio_externo',id:z.line.id,ent:z.box,line:z.line,k:z.k,sv:''})});
  return ev}
function r77TimeEvents(){const d=r74Iso(r74Now());return db.tasks.filter(t=>!t.deleted&&t.due===d&&!['Completada','Cancelada'].includes(t.state)).map(t=>({tr:'tarea_vence',id:t.id,ent:t,sv:d}))}
function r77Tid(t){return String(t?.id||'').slice(0,8)}
function r77EventLabel(e){const c=r77Ctx(e);return r77Tr(e.tr)[1]+' · '+(c.ods?'ODS '+c.ods:c.cita?'cita '+c.cita:c.tarea?'«'+c.tarea.slice(0,40)+'»':c.placa||'')}
/* --- datos de contexto para condiciones y variables --- */
function r77Ctx(e){let o=null,a=null,v=null,c=null,t=null,nps=null,req=null;
  if(e.tr==='servicio_externo'){if(e.k.startsWith('o:'))o=e.ent;else{v=vehicle(e.ent.vehicle)}}else
  if(e.tr.startsWith('correccion_')){req=e.ent;o=db.orders.find(x=>x.id===req.order)||null}else
  if(e.tr==='ods_archivada'||e.tr==='ods_estado'||e.tr==='ods_creada')o=e.ent;
  else if(e.tr==='encuesta'){o=db.orders.find(x=>x.id===e.ent.order)||null;nps=e.ent.answers?.nps!=null?+e.ent.answers.nps:null}
  else if(e.tr.startsWith('cita_'))a=e.ent;
  else if(e.tr==='km_consulta')v=e.ent;
  else{t=e.ent;if(t.orderId)o=db.orders.find(x=>x.id===t.orderId)||null;if(t.appointmentId)a=db.appointments.find(x=>x.id===t.appointmentId)||null}
  if(!v)v=vehicle(o?o.vehicle:a?a.vehicle:null);
  c=client(a?.client||v?.client);const br=o?.branch||a?.branch||'';
  return {line:e.line||null,k:e.k||'',servicio:e.line?.name||'',origen:(e.tr==='servicio_externo'?e.ent?.code:o?.code)||'',o,a,v,c,t,nps,req,branch:br,placa:v?.plate||'',cliente:c?.name||'',ods:o?.code||'',cita:a?.code||'',tarea:t?.title||'',sede:db.branches.find(b=>b.id===br)?.name||'',fecha:r74Iso(r74Now())}}
function r77Cond(cd,x){switch(cd.k){case'sede':return x.branch===cd.v;case'celular':return !!(x.c?.phone)===(cd.v!=='no');case'deuda':return (r77Debt(x.c?.id)>0)===(cd.v!=='no');case'plan':return !!x.v?.plan;case'sintecnico':return !x.o?.tech;case'nps':return x.nps!=null&&x.nps<=+cd.v;case'prioridad':return x.t?.priority===cd.v;case'etiqueta':return String(x.t?.tags||'').toLowerCase().includes(String(cd.v||'').toLowerCase());case'tipotarea':return x.t?.type===cd.v;case'campo':{const v=String(r77Field(cd.mod,cd.f,x)??'').trim(),w=String(cd.v||'').trim().toLowerCase();return cd.op==='tiene'?v!=='':cd.op==='notiene'?v==='':cd.op==='igual'?v.toLowerCase()===w:v.toLowerCase().includes(w)}}return false}
function r77Fill(s,x){return String(s||'').replace(/\{(\w+)(?:\.(\w+))?\}/g,(m,k,f)=>{if(f){const v=r77Field(k,f,x);return v===undefined?m:(String(v)===''?'—':String(v))}return k in x?(x[k]||'—'):m})}
/* --- ejecución de una acción --- */
function r77Act(r,a,e,x,write){const d=r74Iso(r74Now()),title=r77Fill(a.title,x),text=r77Fill(a.desc,x),who=db.users.find(u=>u.id===a.owner)?.name||a.owner;
  if(a.type==='tarea'){const dn=a.dueN!==undefined?a.dueN:a.days,sn=a.startN!==undefined?a.startN:a.startDays,wd=r77When(dn||0,a.dueUnit||'dias',a.dueMode||'habiles','despues'),ws=(+sn>0)?r77When(sn,a.startUnit||'dias',a.startMode||'habiles','despues'):{date:d,time:null},tg=a.tags?a.tags:r.name,due=wd.date<ws.date?ws.date:wd.date;const t=r74Task({list:a.list||r74AutoCfg().list,owner:a.owner,title,state:a.state||'Pendiente',priority:(!a.priority||a.priority==='auto')?'Normal':a.priority,start:ws.date,due,end:due,...(ws.time?{startTime:ws.time}:{}),...(wd.time&&due===wd.date?{endTime:wd.time}:{}),description:text||'Tarea creada por la regla «'+r.name+'».',tags:tg,r77:{rule:r.id,ruleName:r.name,event:e.tr},...(x.o?{orderId:x.o.id}:{}),...(x.a?{appointmentId:x.a.id}:{}),...(x.req?{reqId:x.req.id}:{}),...(e.tr==='servicio_externo'?{r77ext:{k:e.k,line:e.line.id}}:{}),...(e.tr==='correccion_aprobada'?{r77edit:{request:e.ent.id,order:e.ent.order}}:{})});
    if(write){db.tasks.push(t);return {txt:'Creó la tarea «'+title+'» para '+who+' (vence '+t.due+')',task:t}}return {txt:'Crearía la tarea «'+title+'» para '+who+' (vence '+t.due+')'}}
  if(a.type==='aviso'){if(write)(db.r74notif??=[]).unshift({id:uid(),at:new Date().toISOString(),to:a.owner,tasks:[],read:false,text:'Automatización «'+r.name+'»: '+title});return {txt:(write?'Notificó a ':'Notificaría a ')+who+': «'+title+'»'}}
  if(a.type==='etiqueta'){if(!x.o)return {txt:'No hay ODS para etiquetar',skip:true};if(write){x.o.labels??=[];if(!x.o.labels.includes(title))x.o.labels.push(title)}return {txt:(write?'Etiquetó':'Etiquetaría')+' la ODS '+x.o.code+' con «'+title+'»'}}
  if(a.type==='comentario'){if(!x.o)return {txt:'No hay ODS para comentar',skip:true};if(write)(db.comments??=[]).push({id:uid(),actor:'Automatización: '+r.name,date:new Date().toISOString(),order:x.o.id,kind:'Automatización',text:title,...(((r.conds||[]).some(c=>c.k==='deuda'&&c.v!=='no')&&x.c?.id)?{debtClient:x.c.id}:{})});return {txt:(write?'Comentó':'Comentaría')+' en la ODS '+x.o.code+': «'+title+'»'}}
  return {txt:'Acción desconocida',skip:true}}
/* --- procesar sucesos con las reglas (all = todas las activas; only = una regla de prueba) --- */
function r77Process(events,dry,only){const d=r77Db(),out=[],list=only?[only]:d.rules;let made=0;
  for(const e of events){for(const r of list){if(r.trigger!==e.tr||(!r77Active(r)&&!dry))continue;
    if(e.tr==='tarea_completada'&&e.ent.r77?.rule===r.id)continue;
    if((e.tr==='ods_estado'||e.tr==='tarea_estado')&&(r.p?.state||'En proceso')!==e.sv)continue;
    const key=r.id+'|'+e.tr+'|'+e.id+'|'+(e.sv||'');
    if(!dry&&key in d.keys)continue;
    const x=r77Ctx(e),run={id:uid(),at:new Date().toISOString(),sim:r74AutoCfg().sim||null,rule:r.id,ruleName:r.name,event:r77EventLabel(e),key,dry:!!dry};
    const bad=(r.conds||[]).find(cd=>!r77Cond(cd,x));
    if(bad){run.status='No cumple';run.result='Condición: '+r77CondText(bad)}
    else if(made>=R77.maxPerPass&&!dry){run.status='Pausada';run.result='Límite de '+R77.maxPerPass+' acciones por pasada (protección contra bucles)'}
    else{const rs=r.actions.map(a=>r77Act(r,a,e,x,!dry)),ok=rs.filter(z=>!z.skip);run.status=ok.length?(dry?'Prueba':'Ejecutada'):'Omitida';run.result=rs.map(z=>z.txt).join(' · ');
      if(!dry&&ok.length){made++;run.task=rs.find(z=>z.task)?.task.id||null;db.audit.unshift({date:new Date().toISOString(),action:'Automatización: '+r.name,detail:run.result,actor:'Automatización',text:run.result,...(x.o?{order:x.o.id}:{})})}}
    if(!dry){if(run.status!=='Pausada')d.keys[key]=1;d.runs.unshift(run);d.runs=d.runs.slice(0,300)}
    out.push(run)}}
  return {runs:out,made}}
function r77Tick(){let evs=[];try{evs=r77Events().concat(r77Db().rules.some(r=>r.active&&['tarea_vence','tarea_atrasada','crm_espera'].includes(r.trigger))?r77TimeEvents():[])}catch(err){console.warn('r77',err)}
  if(!evs.length)return 0;const res=r77Process(evs,false);if(res.runs.length){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
  return res.runs.filter(r=>r.status==='Ejecutada').length}
/* --- las 3 reglas de R7.4 como reglas normales (km, cita, posventa); su cálculo sigue en R7.4 --- */
const R77_PRE={km:{name:'Consultar km al cliente',trigger:'km_tiempo',desc:'Si faltan pocos km o días para el cambio de aceite, crea una tarea para llamar al cliente y preguntar su km. No agenda cita.',title:'Consultar km · {placa} ({motivo})',tags:'Consulta km'},cita:{name:'Confirmar cita',trigger:'cita_tiempo',desc:'Crea la tarea «Confirmar cita» antes de la hora de la cita pendiente. Si es a la apertura, una hora antes del cierre del día hábil anterior.',title:'Confirmar cita {cita} · vehículo {placa}',tags:'Confirmar cita'},post:{name:'Posventa: llamar y enviar encuesta',trigger:'ods_tiempo',desc:'A los días hábiles de la salida de la ODS crea la tarea de llamar al cliente y enviar la encuesta.',title:'Posventa · llamar a {cliente} (ODS {ods}) y enviar encuesta',tags:'Posventa'}};
function r77PreAct(k){const c=r74AutoCfg();return {type:'tarea',owner:c.owner,list:c.list,priority:'auto',dueN:null,dueUnit:'dias',dueMode:'habiles',startN:null,startUnit:'dias',startMode:'habiles',state:'Pendiente',tags:R77_PRE[k].tags,title:R77_PRE[k].title,desc:'{detalle}'}}
function r77DefP(trig){const c=r74AutoCfg();if(trig==='km_tiempo')return {km:c.km.km??500,days:c.km.days??7};if(trig==='cita_tiempo')return {n:c.cita.lead??60,unit:'minutos',mode:'horario',dir:'antes'};if(trig==='ods_tiempo')return {n:c.post.biz??5,unit:'dias',mode:'habiles',dir:'despues',win:c.post.max??7};if(trig==='ods_estado'||trig==='tarea_estado')return {state:'En proceso'};return {}}
function r77EnsureSys(){const d=r77Db(),c=r74AutoCfg(),map={sys_km:'km_tiempo',sys_cita:'cita_tiempo',sys_post:'ods_tiempo'};
  d.rules.forEach(r=>{if(r.sys){r.pre=r.sys;delete r.sys}if(map[r.trigger])r.trigger=map[r.trigger];const sc=R77_SCAN[r.trigger];if(sc){r.p??=r77DefP(r.trigger);const p=r.p;if(r.trigger==='ods_tiempo'&&p.biz!==undefined&&p.n===undefined){p.n=p.biz;p.win=p.max;p.unit='dias';p.mode='habiles';p.dir='despues'}if(r.trigger==='cita_tiempo'&&p.lead!==undefined&&p.n===undefined){p.n=p.lead;p.unit='minutos';p.mode='horario';p.dir='antes'}if(r.active===undefined)r.active=!!c[sc.kind].active}
    (r.actions||[]).forEach(a=>{if(a.type==='tarea'&&r.pre&&a.title===undefined)Object.assign(a,r77PreAct(r.pre),{owner:a.owner,list:a.list});if(a.type==='tarea'&&a.dueN===undefined&&a.days!==undefined){a.dueN=a.days;a.dueUnit='dias';a.dueMode='habiles';a.startN=a.startDays;a.startUnit='dias';a.startMode='habiles'}})});
  Object.entries(R77_PRE).forEach(([k,s])=>{if(r77Pre(k)||d.gone.includes(k))return;const sc=R77_SCAN[s.trigger];d.rules.unshift({id:'sys-'+k,pre:k,name:s.name,desc:s.desc,trigger:s.trigger,conds:[],actions:[r77PreAct(k)],active:!!c[sc.kind].active,p:r77DefP(s.trigger),createdAt:new Date().toISOString()})})}
/* variables propias de cada regla de tiempo */
function r77ScanEv(t){const a=t.r74auto;return a.kind==='km'?{tr:'km_consulta',id:a.vehicle,ent:vehicle(a.vehicle)}:a.kind==='cita'?{tr:'cita_creada',id:a.appointment,ent:db.appointments.find(x=>x.id===a.appointment)}:{tr:'ods_archivada',id:a.order,ent:db.orders.find(x=>x.id===a.order)}}
function r77Shape(rule,t){const e=r77ScanEv(t);if(!e.ent)return t;const x=r77Ctx(e),a=t.r74auto,ap=e.ent;
  Object.assign(x,{detalle:t.description,titulo:t.title,motivo:(/\(([^()]*)\)\s*$/.exec(t.title)||[])[1]||'',km_estimado:(+a.estimate||0).toLocaleString('es-PE'),km_aceite:(+a.oilKm||0).toLocaleString('es-PE'),servicios:(a.items||[]).map(z=>z.st+' · '+z.n).join('; '),salida:a.exit||'',fecha_cita:a.kind==='cita'?ap.date:'',hora_cita:a.kind==='cita'?ap.time:''});
  if(!(rule.conds||[]).every(cd=>r77Cond(cd,x)))return null;
  const act=rule.actions.find(z=>z.type==='tarea'),b=r74Iso(r74Now());
  if(act){if(act.title)t.title=r77Fill(act.title,x);if(act.desc)t.description=r77Fill(act.desc,x);if(act.owner)t.owner=act.owner;if(act.list)t.list=act.list;if(act.priority&&act.priority!=='auto')t.priority=act.priority;
    const dn=act.dueN!==undefined?act.dueN:act.days,sn=act.startN!==undefined?act.startN:act.startDays;
    if(dn!==null&&dn!==undefined&&dn!==''){const w=r77When(dn,act.dueUnit||'dias',act.dueMode||'habiles','despues');t.due=t.end=w.date;if(w.time)t.endTime=w.time}
    if(+sn>0){const w=r77When(sn,act.startUnit||'dias',act.startMode||'habiles','despues');t.start=w.date;if(w.time)t.startTime=w.time}
    if(act.state)t.state=act.state;if(act.tags!==undefined)t.tags='Automatización'+(act.tags?', '+act.tags:'')}
  rule.actions.filter(z=>z!==act).forEach(z=>r77Act(rule,z,e,x,true));
  return t}
const R77_ORIG_ADDBIZ=window.r74AddBiz,R77_ORIG_CITAAT=window.r74CitaAt;
Object.entries(R77_SCAN).forEach(([trig,s])=>{const base=window[s.fn];window[s.fn]=function(){const r=r77ScanRule(trig),p=r?.p||{};let out,swapA=false,swapC=false;
  try{if(trig==='ods_tiempo'&&r&&!((p.unit||'dias')==='dias'&&(p.mode||'habiles')==='habiles'&&(p.dir||'despues')==='despues')){swapA=true;window.r74AddBiz=(date,n)=>r77OffDay(date,n,p.unit,p.mode,p.dir)}
    if(trig==='cita_tiempo'&&r&&p.mode==='reloj'){swapC=true;window.r74CitaAt=(a,lead)=>({at:new Date(new Date(a.date+'T'+a.time)-lead*6e4),prev:false})}
    out=base()}finally{if(swapA)window.r74AddBiz=R77_ORIG_ADDBIZ;if(swapC)window.r74CitaAt=R77_ORIG_CITAAT}
  if(swapA)out.forEach(t=>{t.due=t.end=R77_ORIG_ADDBIZ(r74Iso(r74Now()),1)});
  return r?out.map(t=>r77Shape(r,t)).filter(Boolean):out}});
const r77RunBase=window.r74RunAuto;
window.r74RunAuto=function(reason){const c=r74AutoCfg();Object.entries(R77_SCAN).forEach(([trig,s])=>{const r=r77ScanRule(trig);c[s.kind].active=!!(r&&r.active);const p=r?.p;if(!p)return;if(trig==='km_tiempo')Object.assign(c.km,{km:p.km,days:p.days});if(trig==='cita_tiempo')c.cita.lead=Math.max(1,(+p.n||60)*(p.unit==='horas'?60:p.unit==='dias'?1440:1));if(trig==='ods_tiempo'){c.post.biz=Math.max(1,+p.n||5);c.post.max=Math.max(c.post.biz,+p.win||c.post.biz)}});return r77RunBase(reason)};
/* --- validación y resumen --- */
function r77Validate(r){if(!r.name?.trim())return 'Ponle un nombre a la regla.';if(!r77Tr(r.trigger))return 'Elige el desencadenante.';
  if((r.trigger==='ods_estado'||r.trigger==='tarea_estado')&&!r.p?.state)return 'Elige el estado del desencadenante.';
  if(['ods_tiempo','cita_tiempo'].includes(r.trigger)&&!(+r.p?.n>0))return 'El tiempo del desencadenante debe ser mayor que 0.';
  for(const cd of r.conds||[]){if(!r77CondOk(cd,r.trigger)){const c=R77_CD.find(x=>x[0]===cd.k);return 'La condición «'+c[1]+'» no se puede usar con el desencadenante «'+r77Tr(r.trigger)[1]+'»: ese suceso no trae esa información.'}if(['sede','nps','prioridad','etiqueta','tipotarea'].includes(cd.k)&&!String(cd.v||'').trim())return 'Completa el valor de la condición «'+R77_CD.find(x=>x[0]===cd.k)[1]+'».';if(cd.k==='campo'&&['igual','contiene'].includes(cd.op)&&!String(cd.v||'').trim())return 'Completa el valor de la condición «Dato de un módulo».'}
  if(!r.actions?.length)return 'Añade al menos una acción.';
  if(R77_SCAN[r.trigger]&&r77Db().rules.some(z=>z.id!==r.id&&z.trigger===r.trigger))return 'Ya existe otra regla con el desencadenante «'+r77Tr(r.trigger)[1]+'»: edítala en lugar de crear otra.';
  for(const a of r.actions){if(a.type!=='comentario'&&!a.owner)return 'Elige a quién va dirigida la acción «'+r77ActLabel(a)+'».';if(!a.title?.trim())return 'Escribe el título o el texto de la acción «'+r77ActLabel(a)+'».';if(a.type==='comentario'&&!['order','task'].includes(r77Tr(r.trigger)[2]))return 'Añadir comentario solo se puede cuando el suceso está ligado a una ODS (ODS o tarea).';if(a.type==='etiqueta'&&!['order','task'].includes(r77Tr(r.trigger)[2]))return 'Añadir etiqueta solo se puede cuando el suceso está ligado a una ODS.'}
  return ''}
