
/* --------------------------------------------------------------------------
   R7.7 · Nueva orden de servicio con pestañas «ODS» y «Detalle»,
   fotos, garantía con orden de origen y reporte de garantías
   -------------------------------------------------------------------------- */
R77.photos=[];R77.pend=null;
function r77Thumbs(){const el=$('r77thumbs');if(!el)return;el.innerHTML=R77.photos.map((p,i)=>`<span class="r77-th"><img src="${p}" alt="Foto ${i+1}"><button type="button" aria-label="Quitar foto" onclick="R77.photos.splice(${i},1);r77Thumbs()">✕</button></span>`).join('')||'<span class="sub">Sin fotos (máx. 10).</span>'}
function r77Photos(inp){const files=[...inp.files].slice(0,10-R77.photos.length);files.forEach(f=>{const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);R77.photos.push(c.toDataURL('image/jpeg',.7));r77Thumbs()};im.src=rd.result};rd.readAsDataURL(f)});inp.value=''}
function r77OTab(t){const b=$('modalbody');b.querySelectorAll('.r77-otabs button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));b.querySelector('.r77-op1').hidden=t!=='ods';b.querySelector('.r77-op2').hidden=t!=='det'}
function r77OrderOrigins(f){const fd=new FormData(f),vid=fd.get('vehicle'),cid=fd.get('client');return db.orders.filter(o=>!o.deleted&&(vid?o.vehicle===vid:cid?vehicle(o.vehicle).client===cid:false)&&(o.lines||[]).length)}
/* borrador de la cotización: guarda los ítems de la orden mientras se crea */
function r77DraftClean(){if(!db.r72quotes)return;db.r72quotes=db.r72quotes.filter(q=>!(q.draft&&!q.order&&!q.usedBy))}
function r77DraftQuoteOpts(vid,cid,draftId){return db.r72quotes.filter(q=>!q.deleted&&!q.draft&&q.id!==draftId&&!q.usedBy&&!q.order&&r73QLines(q).some(l=>l.name)&&(vid?(q.vehicle===vid||(!q.vehicle&&(!cid||q.client===cid))):(!cid||q.client===cid))).map(q=>[q.id,q.code+' · '+(vehicle(q.vehicle).plate||client(q.client).name||'sin vehículo')+' · '+r73QLines(q).filter(l=>l.name).length+' ítems · '+(r72OrderTotal(q)==null?'por cotizar':money(r72OrderTotal(q)))])}
function r77GridRefresh(){const f=$('r72ods'),g=$('r77newgrid');if(!f||!g)return;g.innerHTML=r72Grid('q:'+f.dataset.draft,{title:'Detalle de la orden'})}
function r77DraftLoad(){const f=$('r72ods'),sel=$('r77dq'),src=sel&&r73Quote(sel.value),q=r73Quote(f.dataset.draft);if(!src)return toast('Elige una cotización del vehículo.');const ls=r73QLines(src).filter(l=>l.name);if(!ls.length)return toast('Esa cotización no tiene ítems.');
  q.lines.push(...ls.map(l=>({...structuredClone(l),id:uid()})));(R77.fromQuotes??=[]).push(src.id);r77GridRefresh();toast('Se cargaron '+ls.length+' ítems de '+src.code+'. Puedes seguir agregando o quitando.')}
function r77OdsSync(f){const root=$('modalbody'),fd=new FormData(f),cid=fd.get('client'),vs=f.querySelector('[name=vehicle]'),cur=vs.value;
  if(f._cid!==cid){f._cid=cid;vs.innerHTML=r72Opt(db.vehicles.filter(v=>!v.deleted&&(!cid||v.client===cid)).map(v=>[v.id,v.plate+' · '+v.model]),cur,'Seleccionar…');if(![...vs.options].some(o=>o.value===cur))vs.value=''}
  else if(vs.value&&!cid){const v=vehicle(vs.value);if(v.client)f.querySelector('[name=client]').value=v.client}
  const dq=r73Quote(f.dataset.draft),vid=f.querySelector('[name=vehicle]').value,ccid=f.querySelector('[name=client]').value;
  if(dq&&dq.draft&&(dq.vehicle!==(vid||null)||dq.client!==(ccid||null))){dq.vehicle=vid||null;dq.client=ccid||vehicle(vid).client||null;r77GridRefresh()}
  const qs=$('r77dq');if(qs){const cu2=qs.value;qs.innerHTML=r72Opt(r77DraftQuoteOpts(vid,ccid,f.dataset.draft),cu2,'-COTIZACIÓN (opcional)-')}
  const gar=fd.get('attentionType')==='Garantía';root.querySelector('.r77-gar1').hidden=!gar;root.querySelector('.r77-gar2').hidden=!gar;
  if(gar){const os=r77OrderOrigins(f),sel=f.querySelector('[name=warrOrder]'),cu=sel.value;sel.innerHTML=r72Opt(os.map(o=>[o.id,'ODS '+o.code+' · '+o.date+' · '+(vehicle(o.vehicle).plate||'')]),cu,os.length?'Seleccionar la ODS de origen…':'No hay ODS del vehículo');
    const o=db.orders.find(x=>x.id===sel.value),box=root.querySelector('.r77-garitems'),keep=new Set([...root.querySelectorAll('[name=warrLine]:checked')].map(i=>i.value));box.innerHTML=o?(o.lines||[]).filter(l=>l.name).map(l=>`<label class="r77-gl"><input type="checkbox" name="warrLine" form="r72ods" value="${l.id}" ${keep.has(l.id)?'checked':''}> <b>${esc(l.name)}</b> <span class="pill">${esc(l.type)}</span> <small>responsable: ${esc(tech(l.tech)||l.technicianName||tech(o.tech)||'—')}</small></label>`).join('')||'<p class="sub">La ODS de origen no tiene ítems.</p>':'<p class="sub">Primero elige la ODS de origen (pestaña ODS).</p>';
    root.querySelector('.r77-garpend').textContent=o?'Pendiente de selección: marca los servicios o productos que se atienden por garantía.':''}}
r72NewOrder=function(prefill={}){
  r77DraftClean();const a=prefill.fromCita&&db.appointments.find(x=>x.id===prefill.fromCita),src=prefill.taskId&&db.tasks.find(t=>t.id===prefill.taskId),n=r72Now();
  const qPre=a?.quote||prefill.quote||'',vId=prefill.vehicle||a?.vehicle||'',cId=a?.client||vehicle(vId).client||'';R77.photos=[];R77.fromQuotes=[];
  let dq=qPre&&r73Quote(qPre);if(!dq){dq=r73NewQuoteRecord({client:cId||null,vehicle:vId||null,branch:r73UserSede()});dq.draft=true}
  r72Show(`<h2>Nueva orden de servicio</h2>${a?`<div class="r7-scope">Desde la cita de <b>${esc(client(a.client).name)}</b> · ${esc(a.date)} ${esc(a.time)}. Se carga su cotización.</div>`:''}
<div class="r77-otabs" role="tablist"><button type="button" class="on" data-t="ods" onclick="r77OTab('ods')">ODS</button><button type="button" data-t="det" onclick="r77OTab('det')">Detalle</button></div>
<form id="r72ods" class="r77-op1" data-draft="${dq.id}" onsubmit="event.preventDefault();r77SubmitOds(this,'${a?.id||''}','${src?.id||''}')"><input type="hidden" name="odsType" value="Avanzada"><input type="hidden" name="quote" value="${dq.id}"><div class="formgrid r77-f2">${r72AttentionFields(prefill.attentionType||'Mantenimiento preventivo')}
<label class="r77-gar1" hidden>Orden de servicio de origen de la garantía *<select name="warrOrder"></select></label>
<label>Fecha de ingreso<input type="date" name="date" value="${n.date}" required></label><label>Hora de ingreso<input type="time" name="time" value="${n.time}" required></label>
<label>Kilometraje<input type="number" name="km" min="0" placeholder="Vacío = sin km confirmado" value="${prefill.km??''}"></label>
<label>Técnico responsable<select name="tech">${r72Opt(techOpts(),prefill.tech||a?.tech||src?.owner)}</select></label>
<label>Logístico (productos)<select name="logistic">${r72Opt(r72Logistics().map(u=>[u.id,u.name]),a?.logistic,'Sin asignar')}</select></label>
<label>Cliente<select name="client">${r72Opt(db.clients.filter(c=>!c.deleted).map(c=>[c.id,c.name]),cId,'Seleccionar…')}</select></label>
<label>Vehículo<select name="vehicle" required>${r72Opt(db.vehicles.filter(v=>!v.deleted&&(!cId||v.client===cId)).map(v=>[v.id,v.plate+' · '+v.model]),vId,'Seleccionar…')}</select></label>
</div>
<fieldset class="r77-fotos"><legend>Evidencia de ingreso (fotos)</legend><div class="row"><label class="r77-file">📁 Cargar fotos<input type="file" accept="image/*" multiple hidden onchange="r77Photos(this)"></label><label class="r77-file">📷 Tomar foto<input type="file" accept="image/*" capture="environment" hidden onchange="r77Photos(this)"></label></div><div id="r77thumbs" class="r77-thumbs"><span class="sub">Sin fotos (máx. 10).</span></div></fieldset>
<p class="sub">El estado del vehículo (checklist e inventario) se agrega después desde «Acciones».</p></form>
<div class="r77-op2" hidden><div class="r77-pane"><label>Cotización previa (opcional): carga sus ítems en la lista. También puedes agregar ítem por ítem.<div class="r77-sel"><select id="r77dq">${r72Opt(r77DraftQuoteOpts(vId,cId,dq.id),'','-COTIZACIÓN (opcional)-')}</select><button type="button" class="r77-add2" onclick="r77DraftLoad()">＋ CARGAR</button></div></label></div>
<fieldset class="r77-gar2" hidden><legend>Ítems de la ODS de origen que se atienden por garantía</legend><p class="sub r77-garpend"></p><div class="r77-garitems"></div><p class="sub">Los ítems marcados se crean en esta orden con cobro S/ 0 y la etiqueta «Garantía».</p></fieldset>
<div id="r77newgrid">${r72Grid('q:'+dq.id,{title:'Detalle de la orden'})}</div>
<p class="sub">Los abonos y pagos aparecen aquí cuando la orden ya esté creada: hasta entonces no hay a qué orden abonar.</p></div>
<footer>${button('Cancelar','closeModal()')}<button class="primary" type="button" onclick="$('r72ods').requestSubmit()">Crear ODS</button></footer>`,{kind:'new-ods',draft:dq.id});
  const f=$('r72ods');f._cid=cId;f.addEventListener('change',e=>{if(['client','vehicle','attentionType','warrOrder'].includes(e.target.name))r77OdsSync(f)});r77OdsSync(f)};
/* los cambios en la lista de ítems refrescan solo la lista, sin perder lo escrito en el formulario */
const r77ReopenBase=r72Reopen;
r72Reopen=function(ref=R72.open){if(ref?.kind==='new-ods')return r77GridRefresh();return r77ReopenBase(ref)};
function r77SubmitOds(f,citaId,taskId){const fd=new FormData(f),gar=fd.get('attentionType')==='Garantía',origin=fd.get('warrOrder'),lines=fd.getAll('warrLine');
  if(!fd.get('vehicle'))return toast('Selecciona el vehículo.');
  if(gar&&!origin){r77OTab('ods');return toast('Una garantía necesita la ODS de origen. Selecciónala primero.')}
  const rr=r72ReadReception;r72ReadReception=()=>null;
  R77.pend={photos:R77.photos.slice(),warranty:gar?{order:origin,lines}:null,draft:f.dataset.draft,from:(R77.fromQuotes||[]).slice()};
  try{r72SubmitOrder(f,citaId,taskId)}finally{r72ReadReception=rr;R77.pend=R77.pend&&null}}
const r77OpenBase=r72OpenOrder;
r72OpenOrder=function(id,...r){const p=R77.pend,o0=db.orders.find(x=>x.id===id);if(p&&o0&&!o0.r77done){o0.r77done=true;if(p.photos.length)o0.photos=p.photos;{const dq=r73Quote(p.draft);if(dq)delete dq.draft;(p.from||[]).forEach(qid=>{const sq=r73Quote(qid);if(sq&&sq.id!==o0.quote){sq.usedBy=o0.id;sq.order=o0.id;sq.lines=[]}})}
    if(p.warranty){const org=db.orders.find(x=>x.id===p.warranty.order);if(org){o0.warranty={from:org.id,fromCode:org.code};(o0.lines||(o0.lines=[]));p.warranty.lines.forEach(lid=>{const l=(org.lines||[]).find(x=>x.id===lid);if(l)o0.lines.push({...structuredClone(l),id:uid(),price:0,discount:0,approved:false,announced:true,fromQuote:undefined,fromQuoteLine:undefined,buyTask:null,warranty:{order:org.id,orderCode:org.code,line:l.id,originTech:l.tech||org.tech||null}})});r7Log(o0.id,'Garantía','Garantía de la ODS '+org.code+' · '+p.warranty.lines.length+' ítems con cobro S/ 0')}}
    try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
  const out=r77OpenBase(id,...r),o=db.orders.find(x=>x.id===id),mb=$('modalbody');
  if(o&&mb&&$('modal').open){const h2=mb.querySelector('h2'),ins=h=>{if(h2)h2.insertAdjacentHTML('afterend',h);else mb.insertAdjacentHTML('afterbegin',h)};
    if(o.photos?.length&&!mb.querySelector('.r77-ph'))ins(`<div class="r77-ph r77-thumbs">${o.photos.map((p,i)=>`<span class="r77-th"><img src="${p}" alt="Foto ${i+1}" onclick="window.open(this.src)"></span>`).join('')}</div>`);
    if(o.warranty&&!mb.querySelector('.r77-wbar')){const wl=(o.lines||[]).filter(l=>l.warranty);ins(`<div class="r77-wbar"><b>🛡 Garantía de la ODS ${esc(o.warranty.fromCode)}</b> · ${wl.length} ítem(s) en garantía (cobro S/ 0): ${wl.map(l=>esc(l.name)).join(', ')||'—'} ${button('Seleccionar ítems de garantía',`r77WarrSelect('${o.id}')`)}</div>`)}}
  return out};
function r77WarrSelect(id){const o=db.orders.find(x=>x.id===id),org=db.orders.find(x=>x.id===o?.warranty?.from);if(!o||!org)return;const used=new Set((o.lines||[]).filter(l=>l.warranty).map(l=>l.warranty.line)),free=(org.lines||[]).filter(l=>l.name&&!used.has(l.id));
  modal(`<h2>Ítems de garantía · ODS ${esc(org.code)}</h2>${free.length?`<p class="sub">Pendiente de selección. Marca lo que se atiende por garantía; se crean con cobro S/ 0 y etiqueta «Garantía».</p>${free.map(l=>`<label class="r77-gl"><input type="checkbox" value="${l.id}"> <b>${esc(l.name)}</b> <span class="pill">${esc(l.type)}</span> <small>responsable: ${esc(tech(l.tech)||l.technicianName||tech(org.tech)||'—')}</small></label>`).join('')}`:'<p class="sub">Ya están todos los ítems de la ODS de origen.</p>'}<footer>${button('Cancelar','closeModal()')}${free.length?button('Añadir a la garantía',`r77WarrAdd('${id}')`,true):''}</footer>`)}
function r77WarrAdd(id){const o=db.orders.find(x=>x.id===id),org=db.orders.find(x=>x.id===o.warranty.from),ids=[...document.querySelectorAll('#modalbody input[type=checkbox]:checked')].map(i=>i.value);if(!ids.length)return toast('Marca al menos un ítem.');
  ids.forEach(lid=>{const l=org.lines.find(x=>x.id===lid);if(l)o.lines.push({...structuredClone(l),id:uid(),price:0,discount:0,approved:false,announced:true,buyTask:null,warranty:{order:org.id,orderCode:org.code,line:l.id,originTech:l.tech||org.tech||null}})});r7Log(o.id,'Garantía',ids.length+' ítems añadidos desde la ODS '+org.code);closeModal();R73.lastText='Ítems de garantía añadidos a la ODS '+o.code;save('Garantía actualizada',o.code);r72OpenOrder(id)}
/* reporte de garantías */
(function(){const rep=R75_NAV.find(n=>n.sec==='Reportes');if(rep&&!rep.items.includes('rep_gar'))rep.items.push('rep_gar');R75_MODS.rep_gar=['🛡','Garantías'];R75_TESIS.add('rep_gar');r75Rebuild()})();
views.rep_gar=()=>{const rows=[];db.orders.filter(o=>!o.deleted&&o.warranty).forEach(o=>{const org=db.orders.find(x=>x.id===o.warranty.from);(o.lines||[]).filter(l=>l.warranty).forEach(l=>{const ol=(org?.lines||[]).find(x=>x.id===l.warranty.line)||{};rows.push([esc(org?.code||o.warranty.fromCode),esc(o.code),esc(l.name),esc(l.type),esc(tech(ol.tech)||ol.technicianName||tech(org?.tech)||'—'),esc(tech(org?.tech)||org?.technicianName||'—'),esc(tech(l.tech)||tech(o.tech)||'—'),esc(tech(o.tech)||o.technicianName||'—'),esc(client(vehicle(o.vehicle).client).name||'—'),esc(vehicle(o.vehicle).plate||'')])})});
  return heading('Garantías','Qué ODS trajo garantías, en qué ODS se atendieron, qué servicios y productos fueron garantía y quiénes son los responsables.')+`<div class="panel">${table(['ODS de origen','ODS que atiende la garantía','Servicio / producto','Tipo','Responsable del ítem (origen)','Técnico de la ODS de origen','Responsable del ítem (garantía)','Técnico de la ODS de garantía','Cliente','Placa'],rows)}</div>`};
r75Nav();
