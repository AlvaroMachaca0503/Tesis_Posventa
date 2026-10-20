
/* --------------------------------------------------------------------------
   Citas: cliente obligatorio, vehículo opcional, inicio y fin aproximado, nota,
   estados Pendiente → Confirmada → Completada | Cancelada | No asistió.
   Toda cita tiene su cotización (misma lista que la ODS) y crea un Evento.
   -------------------------------------------------------------------------- */
const R72_CITA_STATES=['Pendiente','Confirmada','Cancelada','No asistió','Completada'];
function r72QuoteCode(){return 'COT-'+String((db.r72quotes.length||0)+1).padStart(5,'0')}
function r72OrderCode(){return 'ODSP-'+new Date().getFullYear()+'-'+String(db.orders.filter(o=>o.origin==='demo').length+1).padStart(6,'0')}
function r72VehOptions(clientId,value){return '<option value="">Sin vehículo</option>'+db.vehicles.filter(v=>!clientId||v.client===clientId).map(v=>`<option value="${v.id}" ${v.id===value?'selected':''}>${esc(v.plate+' · '+(v.brand||'')+' '+(v.model||''))}</option>`).join('')}
function r72CitaForm(a={},mode='new'){
  const n=r72Now(),start=a.time||'09:00',date=a.date||selectedDate||n.date,endT=a.endTime||timeText(minutes(start)+60);
  return `<div class="formgrid">
<label>Cliente<select name="client" required onchange="this.form.elements.vehicle.innerHTML=r72VehOptions(this.value,'')"><option value="">Seleccionar…</option>${db.clients.filter(c=>!c.deleted).map(c=>`<option value="${c.id}" ${c.id===a.client?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
<label>Vehículo (opcional)<select name="vehicle">${r72VehOptions(a.client,a.vehicle)}</select></label>
<label>Fecha de inicio<input type="date" name="date" value="${esc(date)}" required></label><label>Hora de inicio<input type="time" name="time" step="900" value="${esc(start)}" required></label>
<label>Fecha de fin aproximada<input type="date" name="endDate" value="${esc(a.endDate||date)}" required></label><label>Hora de fin aproximada<input type="time" name="endTime" step="900" value="${esc(endT)}" required></label>
<label>Técnico responsable<select name="tech">${r72Opt(techOpts(),a.tech)}</select></label>
<label>Asesor de servicio<select name="advisor">${r72Opt(r72Advisors().map(u=>[u.id,u.name]),a.advisor||actor)}</select></label>
<label>Logístico (para todos los productos)<select name="logistic">${r72Opt(r72Logistics().map(u=>[u.id,u.name]),a.logistic,'Sin asignar')}</select></label>
<label>Estado<select name="state">${r72Opt(R72_CITA_STATES.map(s=>[s,s]),a.state||'Pendiente')}</select></label>
<label class="wide" style="grid-column:1/-1">Nota / motivo (servicios previstos; la ve el técnico)<textarea name="note" rows="3">${esc(a.note||'')}</textarea></label></div>`}
function r72NewCita(prefill={}){if(!canManage())return toast('Las citas las gestionan cajera, jefe o administrador.');
  r72Show(`<h2>Nueva cita</h2><form id="r72cita" onsubmit="event.preventDefault()">${r72CitaForm(prefill)}<footer>${button('Cancelar','closeModal()')}<button type="button" onclick="r72SaveCita(this.form,'close')">Guardar</button><button type="button" onclick="r72SaveCita(this.form,'open')">Guardar y abrir cotización</button><button type="button" class="primary" onclick="r72SaveCita(this.form,'ods')" title="Para probar la conversión completa">Guardar y crear ODS</button></footer></form>`)}
function r72ReadCita(f){const d=Object.fromEntries(new FormData(f));if(!d.client)throw Error('Selecciona el cliente.');const s=minutes(d.time),e=minutes(d.endTime);if(s%15||e%15)throw Error('Las horas van en múltiplos de 15 minutos.');if(d.endDate<d.date||(d.endDate===d.date&&e<=s))throw Error('El fin debe ser posterior al inicio.');return d}
function r72SaveCita(f,next,id){let d;try{d=r72ReadCita(f)}catch(err){return toast(err.message)}
  let a=id&&db.appointments.find(x=>x.id===id);
  if(!a){a={id:uid(),createdBy:actor,createdAt:new Date().toISOString(),services:[],log:[]};db.appointments.push(a);const q={id:uid(),code:r72QuoteCode(),appointment:a.id,lines:[],createdAt:new Date().toISOString(),usedBy:null};db.r72quotes.push(q);a.quote=q.id}
  Object.assign(a,{client:d.client,vehicle:d.vehicle||null,date:d.date,time:d.time,endDate:d.endDate,endTime:d.endTime,tech:d.tech,advisor:d.advisor,logistic:d.logistic||null,note:d.note,state:a.state||'Pendiente'});
  const q=db.r72quotes.find(x=>x.id===a.quote),k='q:'+q.id;q.tech=a.tech;q.logistic=a.logistic;
  if(!r72Hours(q))q.durationH=Math.max(0.25,q4((minutes(d.endTime)-minutes(d.time))/60+(d.endDate>d.date?0:0)));
  if(a.logistic)q.lines.filter(l=>l.type==='producto'&&!l.logistic).forEach(l=>l.logistic=a.logistic);
  r72SyncBlocks(k);r72SyncEvent(k);r72Log(k,id?'Cita actualizada':'Cita creada',(vehicle(a.vehicle).plate||client(a.client).name)+' · '+a.date+' '+a.time);
  if(d.state&&d.state!==a.state){save('Cita guardada',a.id);return r72CitaState(a.id,d.state)}
  if(next==='ods'){save('Cita guardada',a.id);return r72CitaState(a.id,'Completada',true)}
  if(next==='open'){save('Cita guardada',q.code);return r72OpenCita(a.id)}
  closeModal();save('Cita guardada',q.code)}
function r72CitaState(id,state,force){const a=db.appointments.find(x=>x.id===id);if(!a)return;const before=a.state;a.state=state;const k='q:'+a.quote;r72Log(k,'Estado de cita',before+' → '+state);
  if(state==='Confirmada')toast('Cita confirmada. Si hay productos, solicita el adelanto antes de comprar.');
  r72SyncBlocks(k);r72SyncEvent(k);save('Estado de cita',state);
  if(state==='Completada'&&!a.order&&(force||confirm('¿Desea crear la orden de servicio con la cotización de esta cita?')))return r72NewOrder({fromCita:id});
  if($('modal').open&&R72.open?.kind==='cita')r72OpenCita(id)}
function r72OpenCita(id){const a=db.appointments.find(x=>x.id===id);if(!a)return;const q=db.r72quotes.find(x=>x.id===a.quote),k='q:'+q.id,v=vehicle(a.vehicle);
  const act={Pendiente:[['Confirmar','Confirmada',1],['Cancelar','Cancelada']],Confirmada:[['Completar (llegó)','Completada',1],['No asistió','No asistió'],['Cancelar','Cancelada']],Cancelada:[['Completar','Completada'],['No asistió','No asistió'],['Reprogramar','Pendiente']],'No asistió':[['Reprogramar','Pendiente',1]],Completada:[]}[a.state]||[];
  const pill={Pendiente:'orange',Confirmada:'',Completada:'green',Cancelada:'red','No asistió':'red'}[a.state];
  r72Show(`<div class="row spread"><div><span class="pill">${esc(q.code)}</span> <span class="pill ${pill}">${esc(a.state)}</span><h2>Cita · ${esc(client(a.client).name||'Cliente')} · ${esc(v.plate||'sin vehículo')}</h2><p class="sub">${esc(a.date)} ${esc(a.time)} → ${esc(a.endDate||a.date)} ${esc(a.endTime||'')} · ${esc(tech(a.tech))} · asesor ${esc(tech(a.advisor))}</p></div><div class="row">${act.map(([t,s,p])=>button(t,`r72CitaState('${id}','${s}')`,!!p)).join('')}${a.order?button('Ver ODS',`r72OpenOrder('${a.order}')`,true):a.state==='Completada'?button('Crear ODS',`r72NewOrder({fromCita:'${id}'})`,true):''}</div></div>
<details class="panel space"><summary><b>Datos de la cita</b> · editar cliente, vehículo, horario, responsables y nota</summary><form id="r72cita" onsubmit="event.preventDefault()">${r72CitaForm(a,'edit')}<footer><button type="button" class="primary" onclick="r72SaveCita(this.form,'open','${id}')">Guardar cambios</button></footer></form></details>
${a.note?`<div class="r7-scope"><b>Nota para el técnico:</b> ${esc(a.note)}</div>`:''}
<div class="panel space row spread"><span>Duración del evento <b>${r72Duration(q)} h</b> ${r72Hours(q)?'(suma de H-H de servicios)':'(sin H-H asignadas)'}</span><label class="r72-inl">Ajustar a<input type="number" min="0.25" step="0.25" value="${r72Duration(q)}" ${r72BoxLocked(k)?'disabled':''} onchange="r72SetDuration('${k}',this.value)"> h</label></div>
${r72Grid(k,{title:'Cotización de la cita'})}${r72PaymentsPanel({appointment:id})}
<details class="panel space"><summary>Historial de la cita (${(a.log||[]).length})</summary>${table(['Fecha','Usuario','Evento','Detalle'],(a.log||[]).slice().reverse().map(x=>[new Date(x.date).toLocaleString('es-PE'),esc(tech(x.actor)),esc(x.kind),esc(x.text)]))}</details>
<footer>${button('Cerrar','closeModal()')}</footer>`,{kind:'cita',id})}
openAppointmentR5=function(id){r72OpenCita(id)};
newAppointment=function(task,prefill){r72NewCita(prefill||{})};newAppointmentR5=newAppointment;
r6CreateAppointment=function(taskId,prefill={},completeSource){const src=db.tasks.find(t=>t.id===taskId);r72NewCita({...prefill,tech:prefill.tech||src?.owner,note:src?.title||''});if(src&&completeSource){src.state='Completada'}};
arrive=function(id){const a=db.appointments.find(x=>x.id===id);if(a?.order)return r72OpenOrder(a.order);r72CitaState(id,'Completada',true)};

/* --- abonos / pagos: se ven en la misma orden o cita --- */
function r72PaymentsPanel(ref){const o=ref.order&&db.orders.find(x=>x.id===ref.order);
  const rows=db.advances.filter(x=>(ref.order&&x.order===ref.order)||(ref.appointment&&x.appointment===ref.appointment)).map(x=>({date:x.date,method:x.method,concept:x.concept||'Abono',amount:x.amount,kind:x.kind||'Abono'})).concat(ref.order?db.payments.filter(p=>p.order===ref.order).map(p=>({date:p.date,method:p.method,concept:p.ref||'Pago',amount:p.amount,kind:'Pago'})):[]);
  const sum=r2(rows.reduce((a,x)=>a+(+x.amount||0),0)),tot=ref.order?r72OrderTotal(o):r72OrderTotal(db.r72quotes.find(q=>q.appointment===ref.appointment));
  const target=ref.order?`'order','${ref.order}'`:`'appointment','${ref.appointment}'`;
  return `<div class="panel space r72-pay"><div class="row spread"><h3>Abonos / pagos</h3>${r72Commercial()?button('+ Nuevo',`r72Pay(${target},false)`):''}</div>${rows.length?`<table><thead><tr><th>Fecha</th><th>Método</th><th>Concepto</th><th class="r72-r">Valor</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${new Date(x.date).toLocaleString('es-PE')}</td><td>${esc(x.method)}</td><td>${esc(x.concept)}</td><td class="r72-r">${money(x.amount)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">No hay abonos registrados</p>'}
<div class="r72-totals"><span>Total abonos <b>${money(sum)}</b></span><span>Total del servicio <b>${tot==null?'Pendiente de cotizar':money(tot)}</b></span><span>Pendiente por pagar <b>${tot==null?'—':money(Math.max(0,tot-sum))}</b></span>${r72Commercial()?button('Registrar pago',`r72Pay(${target},true)`,true):''}</div></div>`}
function r72Pay(kind,id,full){const back=R72.open,o=kind==='order'&&db.orders.find(x=>x.id===id),q=kind==='appointment'&&db.r72quotes.find(x=>x.appointment===id);const tot=o?r72OrderTotal(o):r72OrderTotal(q),paid=db.advances.filter(x=>x[kind]===id).reduce((a,x)=>a+x.amount,0)+(o?db.payments.filter(p=>p.order===id).reduce((a,x)=>a+x.amount,0):0),pend=tot==null?0:Math.max(0,r2(tot-paid));
  R72.returnTo=back;form(full?'Registrar pago':'Nuevo abono / adelanto',field('amount','Valor',full&&pend?pend:'','number','min="0.01" step="0.01" required')+select('account','Caja o cuenta de destino',r7AccountOptions())+select('method','Método',[['Efectivo','Efectivo'],['Transferencia','Transferencia'],['Yape/Plin','Yape / Plin'],['Tarjeta','Tarjeta']])+field('concept','Concepto',full?'Pago del servicio':'Adelanto para compra de productos','text','required'),d=>{const a={id:uid(),[kind]:id,amount:+d.amount,account:d.account,method:d.method,concept:d.concept,kind:full?'Pago':'Abono',date:new Date().toISOString(),actor};if(o)a.order=id;db.advances.push(a);const acc=db.bankAccounts.find(x=>x.id===a.account);if(acc)acc.balance+=a.amount;if(o)r7Log(id,full?'Pago recibido':'Abono recibido',money(a.amount)+' · '+a.method+' · '+a.concept);save(full?'Pago registrado':'Abono registrado',money(a.amount))})}
r7Advance=function(orderId){r72Pay('order',orderId,false)};

/* --------------------------------------------------------------------------
   Crear ODS: express (actual) o avanzada (estado del vehículo); fecha y hora de
   ingreso capturadas y editables; carga una cotización previa; sin precio aquí.
   -------------------------------------------------------------------------- */
const R72_FLUIDS=['Aceite de motor','Líquido de frenos','Líquido de embrague','Refrigerante','Aceite hidráulico','Limpia parabrisas'],R72_INV=['Llanta de repuesto','Kit de carretera','Herramientas','Botiquín','Extintor'],R72_DAMAGE=['Rayado','Fogueado','Sumido','Picado','Golpeado','No presenta daños'],R72_FUEL=['Reserva','1/4','1/2','3/4','Lleno'];
function r72Checks(name,items,values=[]){return `<div class="r72-checks">${items.map(x=>`<label><input type="checkbox" name="${name}" value="${esc(x)}" ${values.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div>`}
function r72ReceptionFields(r={}){return `<fieldset class="r72-adv"><legend>Estado del vehículo · recepción avanzada</legend><div class="formgrid">
<label style="grid-column:1/-1">Objetos de valor reportados<input name="valuables" value="${esc(r.valuables||'')}" placeholder="Especifique objetos aquí"></label>
<label>Nivel de combustible<select name="fuel">${r72Opt(R72_FUEL.map(x=>[x,x]),r.fuel,'Sin registrar')}</select></label><label>Otros fluidos<input name="otherFluids" value="${esc(r.otherFluids||'')}" placeholder="Fluidos que no están en la lista"></label>
<div style="grid-column:1/-1"><b>Fluidos a nivel adecuado</b>${r72Checks('fluids',R72_FLUIDS,r.fluids)}</div>
<div style="grid-column:1/-1"><b>Inventario</b>${r72Checks('inventory',R72_INV,r.inventory)}</div>
<label>Otros (inventario)<input name="otherInventory" value="${esc(r.otherInventory||'')}"></label><label>Documentos<input name="documents" value="${esc(r.documents||'')}" placeholder="Especifique documentos del vehículo"></label>
<div style="grid-column:1/-1"><b>Daños</b>${r72Checks('damage',R72_DAMAGE,r.damage)}</div>
<label>Otros daños<input name="otherDamage" value="${esc(r.otherDamage||'')}"></label><label>Comentarios<textarea name="comments" rows="2" placeholder="Comentarios adicionales sobre el servicio">${esc(r.comments||'')}</textarea></label></div></fieldset>`}
function r72ReadReception(f){const fd=new FormData(f),g=n=>fd.getAll(n);return {valuables:fd.get('valuables')||'',fuel:fd.get('fuel')||'',otherFluids:fd.get('otherFluids')||'',fluids:g('fluids'),inventory:g('inventory'),otherInventory:fd.get('otherInventory')||'',documents:fd.get('documents')||'',damage:g('damage'),otherDamage:fd.get('otherDamage')||'',comments:fd.get('comments')||''}}
function r72AttentionFields(value='Mantenimiento preventivo',other=''){const known=R6_ATTENTION.includes(value);return `<label>Tipo de atención<select name="attentionType" onchange="const o=this.form.querySelector('.r72-other');o.hidden=this.value!=='Otro';o.querySelector('input').required=this.value==='Otro'">${R6_ATTENTION.map(x=>`<option ${x===(known?value:'Otro')?'selected':''}>${x}</option>`).join('')}</select></label><label class="r72-other" ${known&&value!=='Otro'?'hidden':''}>Otro tipo de atención<input name="attentionOther" value="${esc(known?other:value)}" placeholder="Describa el tipo de atención"></label>`}
function r72NewOrder(prefill={}){
  const a=prefill.fromCita&&db.appointments.find(x=>x.id===prefill.fromCita),src=prefill.taskId&&db.tasks.find(t=>t.id===prefill.taskId),n=r72Now();
  const quotes=db.r72quotes.filter(q=>!q.usedBy&&q.lines.length||q.appointment===a?.id),qSel=a?.quote||'';
  r72Show(`<h2>Crear orden de servicio</h2>${a?`<div class="r7-scope">Desde la cita de <b>${esc(client(a.client).name)}</b> · ${esc(a.date)} ${esc(a.time)}. Se carga su cotización y el evento cambia de etiqueta «Cita» a «Orden de servicio».</div>`:''}
<form id="r72ods" onsubmit="event.preventDefault();r72SubmitOrder(this,'${a?.id||''}','${src?.id||''}')"><div class="seg r72-seg" role="radiogroup" aria-label="Tipo de ODS"><label><input type="radio" name="odsType" value="Express" checked onchange="this.form.querySelector('.r72-adv').hidden=true">Express</label><label><input type="radio" name="odsType" value="Avanzada" onchange="this.form.querySelector('.r72-adv').hidden=false">Avanzada</label></div>
<div class="formgrid space"><label>Vehículo<select name="vehicle" required>${r72Opt(db.vehicles.filter(v=>!a?.client||v.client===a.client||!a).map(v=>[v.id,v.plate+' · '+v.model]),prefill.vehicle||a?.vehicle,a&&!a.vehicle?'Seleccionar…':null)}</select></label>
<label>Técnico responsable<select name="tech">${r72Opt(techOpts(),prefill.tech||a?.tech||src?.owner)}</select></label>
<label>Fecha de ingreso<input type="date" name="date" value="${n.date}" required></label><label>Hora de ingreso<input type="time" name="time" value="${n.time}" required></label>
<label>Kilometraje actual<input type="number" name="km" min="0" placeholder="Vacío = sin km confirmado" value="${prefill.km??''}"></label>
<label>Logístico (productos)<select name="logistic">${r72Opt(r72Logistics().map(u=>[u.id,u.name]),a?.logistic,'Sin asignar')}</select></label>
${r72AttentionFields(prefill.attentionType||'Mantenimiento preventivo')}
<label>Cotización previa (carga servicios y productos)<select name="quote">${r72Opt(quotes.map(q=>[q.id,q.code+' · '+(vehicle(db.appointments.find(x=>x.id===q.appointment)?.vehicle).plate||client(db.appointments.find(x=>x.id===q.appointment)?.client).name||'')+' · '+q.lines.length+' ítems · '+(r72OrderTotal(q)==null?'por cotizar':money(r72OrderTotal(q)))]),qSel,'Ninguna')}</select></label>
<label style="grid-column:1/-1">Motivo de ingreso<textarea name="reason" rows="2" placeholder="Lo que reporta el cliente">${esc(a?.note||src?.title||'')}</textarea></label></div>
<div class="r72-advwrap">${r72ReceptionFields()}</div>
<p class="sub">Servicios y productos se editan dentro de la ODS creada (en servicios las H-H no cambian el precio final; en productos cantidad × precio).</p>
<footer>${button('Cancelar','closeModal()')}<button class="primary" type="submit">Crear ODS</button></footer></form>`,{kind:'new-ods'});
  $('modalbody').querySelector('.r72-adv').hidden=true}
function r72SubmitOrder(f,citaId,taskId){const d=Object.fromEntries(new FormData(f));if(!d.vehicle)return toast('Selecciona el vehículo.');if(d.attentionType==='Otro'&&!d.attentionOther?.trim())return toast('Escribe el otro tipo de atención.');
  const a=citaId&&db.appointments.find(x=>x.id===citaId),q=d.quote&&db.r72quotes.find(x=>x.id===d.quote);
  const lines=(q?.lines||[]).filter(l=>l.name).map(l=>({...structuredClone(l),id:uid(),fromQuote:q.id,fromQuoteLine:l.id,approved:false,announced:true,buyTask:null}));
  const o={id:uid(),code:r72OrderCode(),vehicle:d.vehicle,tech:d.tech,logistic:d.logistic||null,km:d.km===''?null:+d.km,state:'Recepción',date:d.date,time:d.time,createdAt:new Date().toISOString(),origin:'demo',billing:'No facturado',attentionType:d.attentionType==='Otro'?d.attentionOther.trim():d.attentionType,odsType:d.odsType,reason:d.reason,reception:d.odsType==='Avanzada'?r72ReadReception(f):null,approval:'Pendiente',branch:'union',appointment:a?.id||q?.appointment||null,quote:q?.id||null,lines,rootTaskState:'Pendiente',productStage:'Solicitud',archived:false};
  if(o.km!=null)vehicle(o.vehicle).km=Math.max(+vehicle(o.vehicle).km||0,o.km);
  db.orders.unshift(o);const k='o:'+o.id;
  if(q){q.usedBy=o.id;r72SyncBlocks('q:'+q.id);db.tasks.filter(t=>t.r72log?.k==='q:'+q.id).forEach(t=>{t.r72log.k=k;t.r72log.lineIds=t.r72log.lineIds.map(id=>lines.find(l=>l.fromQuoteLine===id)?.id).filter(Boolean);t.orderId=o.id})}
  const ca=a||(q&&db.appointments.find(x=>x.id===q.appointment));
  if(ca){const ev=r72EventOf('q:'+ca.quote);if(ev)ev.r72k=k;ca.order=o.id;if(ca.state!=='Completada')ca.state='Completada';db.advances.filter(x=>x.appointment===ca.id&&!x.order).forEach(x=>x.order=o.id);r7Log(o.id,'ODS desde cita','Cita '+db.r72quotes.find(x=>x.id===ca.quote)?.code+' completada; el evento pasó de «Cita» a «Orden de servicio».')}
  if(taskId){const s=db.tasks.find(t=>t.id===taskId);if(s)s.orderId=o.id}
  r7Log(o.id,'ODS creada',o.odsType+' · '+o.attentionType+(q?' · cotización '+q.code+' ('+lines.length+' ítems)':''));
  r72SyncEvent(k);r72SyncBlocks(k);odsState='Recepción';page='ods';save('Nueva ODS',o.code);r72OpenOrder(o.id)}
newOrder=function(prefill){r72NewOrder(prefill||{})};
r6CreateOrder=function(taskId,prefill={}){r72NewOrder({...prefill,taskId})};

/* --------------------------------------------------------------------------
   Vista de la ODS: encabezado, datos editables, detalle editable y abonos.
   La tarea raíz y sus subtareas viven en Espacio de trabajo (tarea Evento).
   -------------------------------------------------------------------------- */
function r72SetOrder(id,f,value){const o=db.orders.find(x=>x.id===id);if(!o)return;const before=o[f];
  if(f==='attentionType'&&value==='Otro'){const v=prompt('Otro tipo de atención');if(!v)return r72Reopen();value=v}
  o[f]=f==='km'?(value===''?null:+value):value;if(f==='logistic')o.lines.filter(l=>l.type==='producto'&&!l.logistic).forEach(l=>l.logistic=value||null);
  r7Log(id,'ODS editada',f+': '+(before??'—')+' → '+(value||'—'));if(['date','time','tech'].includes(f))r72AfterLine('o:'+id);r72Commit('ODS editada',o.code+' · '+f)}
function r72OpenOrder(id){const o=db.orders.find(x=>x.id===id);if(!o)return;o.lines??=[];const k='o:'+id,v=vehicle(o.vehicle),lock=o.state==='Archivada',dis=lock?'disabled':'',com=r72Commercial(),removed=db.removedOrderLines.filter(x=>x.order===id).length,approvedCorrection=db.correctionRequests.some(x=>x.order===id&&x.state==='Aprobada'),r=o.reception;
  const att=R6_ATTENTION.includes(o.attentionType)?o.attentionType:'Otro';
  const recep=o.odsType==='Avanzada'&&r?`<details class="panel space"><summary><b>Estado del vehículo</b> · combustible ${esc(r.fuel||'—')} · ${r.damage?.length?esc(r.damage.join(', ')):'sin daños registrados'}</summary><div class="r72-recep"><p><b>Objetos de valor:</b> ${esc(r.valuables||'—')}</p><p><b>Fluidos a nivel:</b> ${esc(r.fluids?.join(', ')||'—')} ${r.otherFluids?'· otros: '+esc(r.otherFluids):''}</p><p><b>Inventario:</b> ${esc(r.inventory?.join(', ')||'—')} ${r.otherInventory?'· '+esc(r.otherInventory):''}</p><p><b>Documentos:</b> ${esc(r.documents||'—')}</p><p><b>Daños:</b> ${esc(r.damage?.join(', ')||'—')} ${r.otherDamage?'· '+esc(r.otherDamage):''}</p><p><b>Comentarios:</b> ${esc(r.comments||'—')}</p></div></details>`:'';
  r72Show(`<div class="row spread"><div><span class="pill">${esc(o.branch==='prohogar'?'N002 · Prohogar':'N001 · Unión')}</span> <span class="pill">${esc(o.odsType||'Express')}</span> <span class="pill ${o.approval==='Aprobada'?'green':o.approval==='No aprobada'?'red':'orange'}">${esc(o.approval||'Pendiente')}</span><h2>ODS ${esc(o.code)} · ${esc(v.plate||'')} · ${esc((v.brand||'')+' '+(v.model||''))}</h2><p class="sub">${esc(client(v.client).name||'')}${o.appointment?' · desde cita':''}${o.taskId?' · tarea Evento en Espacio de trabajo':''}</p></div><div class="row">${button('💬 Bitácora',`orderChat('${id}')`,true)}${o.taskId?button('Ver evento',`closeModal();go('tareas');openTaskPanel('${o.taskId}')`):''}</div></div>
<div class="r72-fields">
<label>Estado<select onchange="r7SetOrderState('${id}',this.value)">${r72Opt(['Recepción','En proceso','Entrega','Archivada'].map(s=>[s,s]),o.state)}</select></label>
<label>Decisión del cliente<select ${r72CanApprove()?'':'disabled'} onchange="r7SetApproval('${id}',this.value)">${r72Opt(['Pendiente','Aprobada','No aprobada'].map(s=>[s,s]),o.approval||'Pendiente')}</select></label>
<label>Tipo de atención<select ${dis} onchange="r72SetOrder('${id}','attentionType',this.value)">${r72Opt(R6_ATTENTION.map(x=>[x,x==='Otro'&&att==='Otro'?'Otro: '+o.attentionType:x]),att)}</select></label>
<label>Fecha de ingreso<input type="date" ${dis} value="${esc(o.date)}" onchange="r72SetOrder('${id}','date',this.value)"></label>
<label>Hora de ingreso<input type="time" ${dis} value="${esc(o.time||'')}" onchange="r72SetOrder('${id}','time',this.value)"></label>
<label>Kilometraje<input type="number" ${dis} min="0" value="${o.km??''}" placeholder="sin km" onchange="r72SetOrder('${id}','km',this.value)"></label>
<label>Técnico responsable<select ${dis} onchange="r72SetOrder('${id}','tech',this.value)">${r72Opt(techOpts(),o.tech)}</select></label>
<label>Logístico<select ${dis} onchange="r72SetOrder('${id}','logistic',this.value)">${r72Opt(r72Logistics().map(u=>[u.id,u.name]),o.logistic,'Sin asignar')}</select></label>
<label class="r72-wide">Motivo de ingreso<input ${dis} value="${esc(o.reason||'')}" onchange="r72SetOrder('${id}','reason',this.value)"></label></div>
${recep}${r72Grid(k,{title:'Detalle de la orden'})}${removed?`<p class="sub">${removed} ítems retirados quedan en la bitácora y en auditoría.</p>`:''}
${com?r72PaymentsPanel({order:id}):''}
${lock?`<div class="r7-scope"><b>ODS archivada.</b> El detalle queda bloqueado. ${approvedCorrection?'<span class="pill green">Corrección autorizada</span>':button('Solicitar corrección',`r72Sub('ods','${id}','r7RequestCorrection','${id}')`)}</div>`:''}
<footer>${!lock?button('Repartir H-H por igual',`r72Sub('ods','${id}','r7DistributeHours','${id}')`):''}${com?button('Nota de venta',`r72Sub('ods','${id}','newNoteR5','${id}')`):''}${button('Cerrar','closeModal()')}</footer>`,{kind:'ods',id})}
r7OpenOrder=r72OpenOrder;openOrder=function(id){r72OpenOrder(id)};
