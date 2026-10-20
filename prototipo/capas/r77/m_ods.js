
/* --------------------------------------------------------------------------
   R7.7 · Editar orden con dos pestañas:
     ODS     → encabezado (atención, ingreso, km, técnico, logístico, cliente,
               vehículo, motivo), estado del vehículo y fotos
     Detalle → vincular cotización + la misma estructura de la cotización
               (ítems, totales, cuánto debe pagar y pagos)
   «Estado del vehículo» (checklist e inventario) se agrega desde Acciones.
   -------------------------------------------------------------------------- */
R77.otab={};
function r77OTabSet(id,t){R77.otab[id]=t;const b=$('modalbody');if(!b)return;b.querySelectorAll('.r77-oshell>.r77-otabs button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));b.querySelector('.r77-os1').hidden=t!=='ods';b.querySelector('.r77-os2').hidden=t!=='det'}
function r77OrderPhotoAdd(id,inp){const o=db.orders.find(x=>x.id===id);if(!o)return;const files=[...inp.files].slice(0,10-(o.photos?.length||0));let left=files.length;if(!left)return;files.forEach(f=>{const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);(o.photos??=[]).push(c.toDataURL('image/jpeg',.7));if(--left===0){R73.lastText='Fotos de la ODS '+o.code+' actualizadas';r72Commit('Fotos de la ODS',o.code)}};im.src=rd.result};rd.readAsDataURL(f)});inp.value=''}
function r77OrderPhotoDel(id,i){const o=db.orders.find(x=>x.id===id);if(!o?.photos)return;o.photos.splice(i,1);R73.lastText='Foto quitada de la ODS '+o.code;r72Commit('Foto quitada',o.code)}
function r77OrderClient(sel,id){const vs=sel.closest('.r72-fields').querySelector('[data-r77v]');const cur=vs.value;vs.innerHTML=r72Opt(db.vehicles.filter(v=>!v.deleted&&(!sel.value||v.client===sel.value)).map(v=>[v.id,v.plate+' · '+(v.model||'')]),cur,'Seleccionar…')}
function r77OrderLinkQuote(id,qid){const o=db.orders.find(x=>x.id===id),q=qid&&r73Quote(qid);if(!o)return;if(!q)return toast('Elige una cotización.');const ls=r73QLines(q).filter(l=>l.name);if(!ls.length)return toast('La cotización no tiene ítems.');
  o.lines??=[];o.lines.push(...ls.map(l=>({...structuredClone(l),id:uid(),approved:false,announced:true,fromQuote:q.id,fromQuoteLine:l.id,buyTask:null})));q.lines=[];q.order=o.id;q.usedBy=o.id;o.quote=q.id;if(q.appointment&&!o.appointment)o.appointment=q.appointment;
  r7Log(o.id,'Cotización vinculada',q.code+' · '+ls.length+' ítems');try{r72SyncEvent('o:'+o.id);r72SyncBlocks('o:'+o.id)}catch{}R77.otab[id]='det';R73.lastText='Cotización '+q.code+' vinculada a la ODS '+o.code;r72Commit('Cotización vinculada',o.code)}
/* estado del vehículo: checklist e inventario */
function r77OrderVeh(id){const o=db.orders.find(x=>x.id===id);if(!o)return;modal(`<h2>Estado del vehículo · ODS ${esc(o.code)}</h2><p class="sub">Checklist e inventario de lo que trae el vehículo.</p><form id="r77vst" onsubmit="event.preventDefault();r77OrderVehSave('${id}',this)">${r72ReceptionFields(o.reception||{})}<footer>${button('Cancelar',`closeModal();r72OpenOrder('${id}')`)}<button class="primary" type="submit">Guardar</button></footer></form>`)}
function r77OrderVehSave(id,f){const o=db.orders.find(x=>x.id===id);if(!o)return;o.reception=r72ReadReception(f);o.odsType='Avanzada';r7Log(o.id,'Estado del vehículo','Se registró el checklist e inventario del vehículo');R73.lastText='Estado del vehículo de la ODS '+o.code+' guardado';closeModal();save('Estado del vehículo',o.code);r72OpenOrder(id)}
/* pestañas dentro del modal de la orden */
const r77OrdShellBase=r72OpenOrder;
r72OpenOrder=function(id,...r){const out=r77OrdShellBase(id,...r);try{r77OrderShell(id)}catch(err){console.warn('r77 orden',err)}return out};
function r77OrderShell(id){const o=db.orders.find(x=>x.id===id),mb=$('modalbody');if(!o||!mb||!$('modal').open||mb.querySelector('.r77-oshell')||!mb.querySelector(':scope>.r72-fields'))return;
  const kids=[...mb.children],header=kids[0],footer=mb.querySelector(':scope>footer'),gi=kids.findIndex(k=>k.matches?.('.r72-gridbox')),lock=o.state==='Archivada'&&!o.editGrant;if(gi<0)return;
  const p1=document.createElement('div'),p2=document.createElement('div');p1.className='r77-os1';p2.className='r77-os2';
  kids.slice(1,gi).forEach(k=>{if(k!==footer)p1.appendChild(k)});kids.slice(gi).forEach(k=>{if(k!==footer)p2.appendChild(k)});
  p1.querySelectorAll('.r77-ph').forEach(x=>x.remove());header.querySelectorAll('.pill').forEach(x=>{if(/^(Express|Avanzada)$/.test(x.textContent.trim()))x.remove()});
  const v=vehicle(o.vehicle),fields=p1.querySelector('.r72-fields');
  fields?.insertAdjacentHTML('beforeend',`<label>Cliente<select ${lock?'disabled':''} onchange="r77OrderClient(this,'${id}')">${r72Opt(db.clients.filter(c=>!c.deleted).map(c=>[c.id,c.name]),v.client,'Seleccionar…')}</select></label><label>Vehículo<select data-r77v ${lock?'disabled':''} onchange="r72SetOrder('${id}','vehicle',this.value)">${r72Opt(db.vehicles.filter(x=>!x.deleted&&(!v.client||x.client===v.client)).map(x=>[x.id,x.plate+' · '+(x.model||'')]),o.vehicle)}</select></label>`);
  if(fields){fields.classList.add('r77-f2');const lab=n=>[...fields.children].find(c=>c.tagName==='LABEL'&&c.textContent.trim().toLowerCase().startsWith(n.toLowerCase())),mot=lab('Motivo de ingreso');
    const attL=lab('Tipo de atención');if(attL){const cur=String(o.attentionType||''),known=R6_ATTENTION.includes(cur)&&cur!=='Otro';
      attL.innerHTML=`Tipo de atención<select ${lock?'disabled':''} onchange="r77AttSel('${id}',this)">${R6_ATTENTION.map(x=>`<option ${x===(known?cur:'Otro')?'selected':''}>${esc(x)}</option>`).join('')}</select><input class="r77-att-other" ${known?'hidden':''} ${lock?'disabled':''} placeholder="Escribe el tipo de atención" value="${esc(known||cur==='Otro'?'':cur)}" onchange="r77AttOther('${id}',this.value)">`}
    mot?.remove();[...document.querySelectorAll('#modalbody .r7-scope')].forEach(x=>{if(/^Motivo de ingreso/.test(x.textContent.trim()))x.remove()});
    ['Estado','Decisión del cliente','Tipo de atención','Fecha de ingreso','Hora de ingreso','Kilometraje','Técnico responsable','Logístico','Cliente','Vehículo'].forEach(n=>{const e=lab(n);if(e)fields.appendChild(e)})}
  const ph=o.photos||[];p1.insertAdjacentHTML('beforeend',`<fieldset class="r77-fotos"><legend>Evidencia de ingreso (fotos)</legend><div class="row">${lock?'':`<label class="r77-file">📁 Cargar fotos<input type="file" accept="image/*" multiple hidden onchange="r77OrderPhotoAdd('${id}',this)"></label><label class="r77-file">📷 Tomar foto<input type="file" accept="image/*" capture="environment" hidden onchange="r77OrderPhotoAdd('${id}',this)"></label>`}${button('Estado del vehículo / inventario',`r77OrderVeh('${id}')`)}</div><div class="r77-thumbs">${ph.map((p,i)=>`<span class="r77-th"><img src="${p}" alt="Foto ${i+1}" onclick="window.open(this.src)">${lock?'':`<button type="button" aria-label="Quitar foto" onclick="r77OrderPhotoDel('${id}',${i})">✕</button>`}</span>`).join('')||'<span class="sub">Sin fotos.</span>'}</div></fieldset>`);
  const q=o.quote&&r73Quote(o.quote),avail=db.r72quotes.filter(x=>!x.deleted&&!x.usedBy&&!x.order&&r73QLines(x).some(l=>l.name)&&(!v.client||!x.client||x.client===v.client)),link=q?`<div class="r77-pane"><b>Cotización vinculada:</b> <span class="pill">${esc(q.code)}</span> ${button('Ver cotización',`r73OpenQuote('${q.id}')`)}</div>`:`<div class="r77-pane"><label>Cotización previa (para vincularla a esta orden)<div class="r77-sel"><select id="r77olq" ${lock?'disabled':''}>${r72Opt(avail.map(x=>[x.id,x.code+' · '+(client(x.client).name||'sin cliente')+' · '+(vehicle(x.vehicle).plate||'')+' · '+r73QLines(x).filter(l=>l.name).length+' ítems']),'','-COTIZACIÓN-')}</select>${lock?'':`<button type="button" class="r77-add2" onclick="r77OrderLinkQuote('${id}',$('r77olq').value)">＋ VINCULAR</button>`}</div></label></div>`;
  p2.insertAdjacentHTML('afterbegin',link);
  if(r72Commercial()&&!/Abonos|Pagos/.test(p2.textContent))p2.insertAdjacentHTML('beforeend',r72PaymentsPanel({order:id}));
  const tab=R77.otab[id]||'ods',sh=document.createElement('div');sh.className='r77-oshell';sh.innerHTML=`<div class="r77-otabs" role="tablist"><button type="button" data-t="ods" class="${tab==='ods'?'on':''}" onclick="r77OTabSet('${id}','ods')">ODS</button><button type="button" data-t="det" class="${tab==='det'?'on':''}" onclick="r77OTabSet('${id}','det')">Detalle</button></div>`;
  sh.appendChild(p1);sh.appendChild(p2);p1.hidden=tab!=='ods';p2.hidden=tab!=='det';header.insertAdjacentElement('afterend',sh)}
/* en Acciones: Estado del vehículo */
const r77OdsMenuBase=r77OdsMenu;
r77OdsMenu=function(e,btn,id){const o=db.orders.find(x=>x.id===id);if(!o)return;e.stopPropagation();
  r77MenuShow(btn,[{icon:'👁',label:'Ver ODS',fn:()=>openOrder(id)},{icon:'✎',label:'Editar',fn:()=>r72OpenOrder(id)},{icon:'🚗',label:'Estado del vehículo',fn:()=>r77OrderVeh(id)},{icon:'▤',label:'Documentos',fn:()=>orderDocuments(id)},{icon:'☰',label:'Bitácora',fn:()=>orderLog(id)},{icon:'🗑',label:'Eliminar orden',red:true,fn:()=>r77OdsDelete(id)}])};

/* «Motivo de ingreso» ya no existe: lo que había pasa al tipo de atención «Otro» con ese texto */
function r77ReasonText(o){const r=String(o.reason||o.motivo||'').trim();if(r)return r;
  /* órdenes precargadas: el motivo quedó en la descripción de su tarea «Evento» */
  if(o.rm)return '';const ev=db.tasks.find(t=>t.type==='Evento'&&t.orderId===o.id&&!t.deleted),d=String(ev?.description||'').trim();
  return d&&d!==String(o.attentionType||'').trim()&&!R6_ATTENTION.includes(d)?d:''}
function r77ReasonMigrate(){let n=0;db.orders.forEach(o=>{const r=r77ReasonText(o);if(r&&o.attentionType!==r){o.attentionType=r;n++}o.rm=1;if('reason' in o)delete o.reason;if('motivo' in o)delete o.motivo});return n}
r77ReasonMigrate();

/* tipo de atención «Otro»: el texto que se escribe pasa tal cual a «Tipo de atención» */
function r77AttSel(id,sel){const inp=sel.parentElement.querySelector('.r77-att-other');if(sel.value==='Otro'){inp.hidden=false;inp.focus();if(inp.value.trim())r72SetOrder(id,'attentionType',inp.value.trim());return}inp.hidden=true;r72SetOrder(id,'attentionType',sel.value)}
function r77AttOther(id,v){if(String(v).trim())r72SetOrder(id,'attentionType',String(v).trim())}
