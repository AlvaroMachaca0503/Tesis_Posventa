
/* ==========================================================================
   R7.3 · segunda ronda de comentarios del tesista (16/10/2026)
   Capa añadida al final, igual que R5/R6/R7/R7.2.
   ========================================================================== */
const R73={showSub:false,tlMode:'compacto',citaView:'Lista',citaSede:'',cxTab:'cobrar',cxView:'cliente',cxHist:false,dp:null,noteDraft:null,purDraft:null,lastText:null};
const R73_SEDES=[['union','Sede Unión'],['prohogar','Sede Prohogar']];
const r73Sede=id=>id==='ambas'?'Ambas sedes':R73_SEDES.find(s=>s[0]===id)?.[1]||'—';
const r73UserSede=()=>['union','prohogar'].includes(actorUser()?.sede)?actorUser().sede:'union';
const r73ReopenBase=r72Reopen;
r72Reopen=function(ref=R72.open){if(!ref)return;const f={quote:r73OpenQuote,note:r73ViewNote,purchase:r73ViewPurchase,chat:orderChat}[ref.kind];if(f)return f(ref.id);if(ref.kind==='account')return r73AccountModal();return r73ReopenBase(ref)};
function r73Seq(){db.r73seq=(db.r73seq||15000)+1;return db.r73seq}
function r73Date(iso){if(!iso)return '—';const d=new Date(iso);return isNaN(d)?String(iso).slice(0,10):d.toLocaleDateString('en-CA')}
function r73Time(iso){if(!iso||String(iso).length<=10)return '—';const d=new Date(iso);return isNaN(d)?'—':d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})}

/* --- etiqueta corta del evento: «ODS» en lugar de «Orden de servicio» --- */
const r73SyncEventBase=r72SyncEvent;
r72SyncEvent=function(k){if(k?.startsWith('q:')){const q=r72Box(k);if(!q||!q.appointment||q.order)return null}const t=r73SyncEventBase(k);if(t){if(t.eventTag==='Orden de servicio')t.eventTag='ODS';t.title=t.title.replace(/^Orden de servicio · /,'ODS · ')}return t};

/* --- cotización como entidad propia: sin asignar, en cita o en ODS (una sola lista) --- */
function r73Quote(id){return db.r72quotes.find(q=>q.id===id)}
function r73QK(q){return q.order?'o:'+q.order:'q:'+q.id}
function r73QModule(q){return q.order?'ODS':q.appointment?'Cita':'Sin asignar'}
function r73QLines(q){return q.order?(db.orders.find(o=>o.id===q.order)?.lines||[]):q.lines}
function r73QClient(q){const a=q.appointment&&db.appointments.find(x=>x.id===q.appointment),o=q.order&&db.orders.find(x=>x.id===q.order);return q.client||a?.client||vehicle(o?.vehicle||q.vehicle||a?.vehicle).client||null}
function r73QVehicle(q){const a=q.appointment&&db.appointments.find(x=>x.id===q.appointment),o=q.order&&db.orders.find(x=>x.id===q.order);return o?.vehicle||a?.vehicle||q.vehicle||null}
r72BoxVehicle=function(k){const b=r72Box(k);if(!b)return {};if(k.startsWith('o:'))return vehicle(b.vehicle);return vehicle(r72Cita(k)?.vehicle||b.vehicle)};
r72BoxLabel=function(k){const b=r72Box(k);if(!b)return '—';if(k.startsWith('o:'))return 'ODS '+b.code+' · '+(vehicle(b.vehicle).plate||'sin placa');const a=r72Cita(k);return b.code+(a?' (cita '+(a.code||'')+' · '+(vehicle(a.vehicle).plate||client(a.client).name||'sin vehículo')+')':' · '+(vehicle(b.vehicle).plate||client(b.client).name||'sin asignar'))};
r72BoxLocked=function(k){const b=r72Box(k);if(!b)return true;if(k.startsWith('o:'))return b.state==='Archivada'||!!db.notes.find(n=>n.order===b.id)&&b.state==='Archivada';return !!b.order};
function r73NewQuoteRecord(extra={}){const q={id:uid(),code:r72QuoteCode(),lines:[],createdAt:new Date().toISOString(),createdBy:actor,usedBy:null,order:null,appointment:null,client:null,vehicle:null,branch:r73UserSede(),...extra};db.r72quotes.push(q);return q}

/* --- bitácora única: los comentarios de la cita pasan a la ODS; @mención de ítem o subtarea --- */
r72Log=function(k,kind,text){if(!k)return;if(k.startsWith('o:'))return r7Log(k.slice(2),kind,text);const q=r72Box(k),a=r72Cita(k);db.comments.push({id:uid(),order:null,appointment:a?.id||null,quote:q?.id||null,actor,date:new Date().toISOString(),kind,text});R73.lastText=kind+': '+text};
const r73LogBase=r7Log;r7Log=function(order,kind,text,extra={}){const o=db.orders.find(x=>x.id===order);r73LogBase(order,kind,text,{appointment:o?.appointment||null,...extra});R73.lastText=kind+': '+text};
function r73ThreadRows(ref){return db.comments.filter(c=>(ref.order&&c.order===ref.order)||(ref.appointment&&c.appointment===ref.appointment)||(ref.quote&&c.quote===ref.quote)).sort((a,b)=>a.date.localeCompare(b.date))}
function r73MentionHtml(c){if(!c.mention)return '';const t=c.mention.task&&db.tasks.find(x=>x.id===c.mention.task);return `<button type="button" class="r73-mention" ${t?`onclick="closeModal();go('tareas');openTaskPanel('${t.id}')"`:'disabled'}>@${esc(c.mention.label)}</button> `}
function r73Thread(ref,opts={}){const rows=r73ThreadRows(ref),k=opts.k,box=k&&r72Box(k),ev=k&&r72EventOf(k);
  const subs=ev?db.tasks.filter(s=>s.parent===ev.id&&!s.deleted):[];const pre=opts.mention||'';
  return `<div class="r73-thread">${rows.map(c=>`<article class="r6-comment ${c.auto?'r73-auto':''}"><header><b>${esc(tech(c.actor)||c.actor)}</b><small>${r73Date(c.date)} ${r73Time(c.date)}</small></header><span class="r6-typebadge">${esc(c.kind||'Comentario')}</span><p>${r73MentionHtml(c)}${esc(c.text)}</p>${c.photo?`<img src="${c.photo}" alt="Adjunto" class="chatphoto">`:''}</article>`).join('')||'<p class="sub">Sin mensajes todavía. Lo que se escriba aquí queda en la bitácora de la '+(ref.order?'ODS':'cita')+'.</p>'}</div>
<form class="r6-compose r73-compose" onsubmit="event.preventDefault();r73Post(this,${JSON.stringify(ref).replace(/"/g,'&quot;')})"><div class="row"><label>Mencionar<select name="mention"><option value="">— Sin mención (orden general) —</option>${subs.map(s=>`<option value="${s.id}" ${s.id===pre||s.r72line===pre?'selected':''}>@${esc(s.title)}</option>`).join('')}</select></label></div><textarea name="message" required placeholder="Escribe o dicta qué pasó con este servicio o producto. Ctrl + Enter envía." onkeydown="if(event.ctrlKey&&event.key==='Enter')this.form.requestSubmit()"></textarea><div class="r6-composebar"><label class="btn">＋ Foto<input name="attachment" type="file" accept="image/*" hidden></label><button type="button" onclick="r6Dictate(this.form.elements.message)">🎙 Voz a texto</button><button class="primary">Enviar a la bitácora ➤</button></div></form>`}
function r73Post(f,ref){const text=f.elements.message.value.trim(),sid=f.elements.mention.value,s=sid&&db.tasks.find(t=>t.id===sid),file=f.elements.attachment.files[0];if(!text)return;
  const row={id:uid(),order:ref.order||null,appointment:ref.appointment||null,quote:ref.quote||null,actor,date:new Date().toISOString(),kind:s?'Comentario de ítem':'Comentario',text,mention:s?{task:s.id,line:s.r72line||null,label:s.title}:null};
  const done=()=>{R73.mentionPreset='';db.comments.push(row);R73.lastText='Comentario: '+(s?'@'+s.title+' ':'')+text;save('Comentario en bitácora',text.slice(0,60))};
  if(file&&file.size<700000){const r=new FileReader();r.onload=()=>{row.photo=r.result;done()};r.readAsDataURL(file)}else done()}
function r73Comment(k,lineId){const ev=r72EventOf(k);const s=ev&&db.tasks.find(x=>x.parent===ev.id&&x.r72line===lineId);R73.mentionPreset=s?.id||'';if($('modal').open&&R72.open){closeModal()}if(ev){go('tareas');r6PanelId=ev.id;r6PanelTab='activity';render()}else toast('Este ítem aún no está en un evento: crea la cita o la ODS.')}
orderChat=function(id){const o=db.orders.find(x=>x.id===id);if(!o)return;r72Show(`<div class="row spread"><h2>Bitácora · ODS ${esc(o.code)}</h2><span class="pill">${esc(vehicle(o.vehicle).plate||'')}</span></div>${r73Thread({order:id,appointment:o.appointment},{k:'o:'+id})}<footer>${button('Ver ODS',`r72OpenOrder('${id}')`)}${button('Cerrar','closeModal()')}</footer>`,{kind:'chat',id})};

/* --- auditoría trazable: texto legible, fecha y hora separadas, ODS y cita --- */
function r73Human(detail){let s=String(detail??'');if(/^\{/.test(s)){try{const j=JSON.parse(s);s=Object.entries(j).map(([k,v])=>k+': '+(typeof v==='object'?JSON.stringify(v):v)).join(' · ')}catch{}}
  return s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,id=>{const o=db.orders.find(x=>x.id===id);if(o)return 'ODS '+o.code;const a=db.appointments.find(x=>x.id===id);if(a)return 'Cita '+(a.code||'');const q=db.r72quotes.find(x=>x.id===id);if(q)return q.code;const t=db.tasks.find(x=>x.id===id);if(t)return '«'+t.title+'»';const v=db.vehicles.find(x=>x.id===id);if(v)return v.plate;const c=db.clients.find(x=>x.id===id);if(c)return c.name;const u=db.users.find(x=>x.id===id);if(u)return u.name;for(const b of [...db.orders,...db.r72quotes]){const l=(b.lines||[]).find(x=>x.id===id);if(l)return '«'+r72LineLabel(l)+'»'}return '(registro)'})}
function r73Ctx(){const ref=R72.open,t=r6PanelId&&db.tasks.find(x=>x.id===r6PanelId);let order=null,appointment=null;if(ref?.kind==='ods'||ref?.kind==='chat'){order=ref.id;appointment=db.orders.find(o=>o.id===ref.id)?.appointment||null}else if(ref?.kind==='cita')appointment=ref.id;else if(ref?.kind==='quote'){const q=r73Quote(ref.id);order=q?.order||null;appointment=q?.appointment||null}else if(t){order=t.orderId||null;appointment=t.appointmentId||null}return {order,appointment}}
const r73SaveBase=save;
save=function(action,detail){const text=R73.lastText,ctx=r73Ctx();R73.lastText=null;r73SaveBase(action,detail);const a=db.audit[0];if(a&&a.action===action&&!a.text){a.text=text||r73Human(detail);a.order??=ctx.order;a.appointment??=ctx.appointment;try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}};
function r73AuditRows(filter={}){return db.audit.filter(a=>(!filter.order||a.order===filter.order)&&(!filter.appointment||a.appointment===filter.appointment)).map(a=>({date:a.date,actor:tech(a.actor)||a.actor,kind:a.action,text:a.text||r73Human(a.detail),order:a.order,appointment:a.appointment}))}
function r73OrderCode(id){return db.orders.find(o=>o.id===id)?.code||''}
function r73CitaCode(id){return db.appointments.find(a=>a.id===id)?.code||''}
let r73LogCita='';
views.bitacora=()=>{const rows=[...db.comments.filter(c=>(!logOrder||c.order===logOrder)&&(!r73LogCita||c.appointment===r73LogCita)).map(c=>({date:c.date,actor:tech(c.actor)||c.actor,kind:c.kind||'Comentario',text:(c.mention?'@'+c.mention.label+' · ':'')+c.text,order:c.order,appointment:c.appointment,photo:c.photo})),...r73AuditRows({order:logOrder,appointment:r73LogCita}).filter(r=>logOrder||r73LogCita?true:!!(r.order||r.appointment))].sort((a,b)=>b.date.localeCompare(a.date));
  return heading('Bitácora','Comentarios y eventos de las citas y ODS, con texto legible. Los eventos de cada tarea Evento se guardan aquí.',button('+ Comentario','commentOrder()',true))+`<div class="filterbar"><label>ODS<select onchange="logOrder=this.value;render()"><option value="">Todas</option>${db.orders.filter(o=>o.origin!=='histórico'||db.comments.some(c=>c.order===o.id)).map(o=>`<option value="${o.id}" ${logOrder===o.id?'selected':''}>${esc(o.code)} · ${esc(vehicle(o.vehicle).plate)}</option>`).join('')}</select></label><label>Cita<select onchange="r73LogCita=this.value;render()"><option value="">Todas</option>${db.appointments.map(a=>`<option value="${a.id}" ${r73LogCita===a.id?'selected':''}>${esc(a.code||'')} · ${esc(vehicle(a.vehicle).plate||client(a.client).name||'')}</option>`).join('')}</select></label></div><div class="panel space">${table(['Fecha','Hora','Persona','Tipo','Detalle','ODS','Cita'],rows.slice(0,400).map(r=>[r73Date(r.date),r73Time(r.date),esc(r.actor),esc(r.kind),esc(r.text)+(r.photo?`<br><img class="chatphoto" alt="Foto" src="${r.photo}">`:''),r.order?button(esc(r73OrderCode(r.order)),`r72OpenOrder('${r.order}')`):'—',r.appointment?button(esc(r73CitaCode(r.appointment)),`r72OpenCita('${r.appointment}')`):'—']))}</div>`};
views.auditoria=()=>heading('Auditoría interna','Registro técnico inmutable (no se edita ni elimina). La conversación diaria está en la bitácora.')+'<div class="panel"><h3>Correcciones administrativas</h3>'+table(['Acciones','ODS','Solicita','Motivo','Estado'],db.correctionRequests.map(r=>[r.state==='Pendiente'&&actorUser()?.role==='Administrador'?button('Aprobar',"r7ApproveCorrection('"+r.id+"')",true):'—',esc(db.orders.find(o=>o.id===r.order)?.code),esc(tech(r.requester)),esc(r.reason),'<span class="pill '+(r.state==='Aprobada'?'green':'orange')+'">'+r.state+'</span>']))+'</div><div class="panel space"><h3>Eventos del sistema</h3>'+table(['Fecha','Hora','Usuario','Acción','Detalle','ODS','Cita'],r73AuditRows().slice(0,300).map(a=>[r73Date(a.date),r73Time(a.date),esc(a.actor),esc(a.kind),esc(a.text),esc(r73OrderCode(a.order))||'—',esc(r73CitaCode(a.appointment))||'—']))+'</div>';

/* --- todas las tablas con filtro: la columna Acciones va primero --- */
const r73TableBase=table;
table=function(headers,rows){const i=headers.findIndex((h,j)=>/^(acciones|opciones)$/i.test(String(h).trim())||(j===headers.length-1&&String(h).trim()===''&&rows.some(r=>String(r[j]).includes('<button'))));if(i>0){headers=[headers[i]||'Acciones',...headers.filter((_,j)=>j!==i)];headers[0]=headers[0]||'Acciones';rows=rows.map(r=>[r[i],...r.filter((_,j)=>j!==i)])}return r73TableBase(headers,rows)};
function r73Act(...btns){return `<div class="r73-acts">${btns.filter(Boolean).join('')}</div>`}
const r73I={edit:'✎',del:'🗑',open:'↗',add:'＋',pay:'$',list:'☰',print:'⎙',minus:'−'};
function r73Btn(icon,title,js,cls=''){return `<button type="button" class="r73-ib ${cls}" title="${esc(title)}" aria-label="${esc(title)}" onclick="${js}">${r73I[icon]||icon}</button>`}

/* --- diálogo compacto para «Confirmar cambio» --- */
const r73FormBase=form;form=function(title,fields,fn){$('modal').classList.toggle('r73-compact',/^Confirmar cambio/.test(title));r73FormBase(title,fields,fn)};

const r73CloseTaskBase=closeTaskPanel;closeTaskPanel=function(){R73.mentionPreset='';r73CloseTaskBase()};
