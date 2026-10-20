
/* --------------------------------------------------------------------------
   Al archivar una ODS: diálogo «Finalizar» (WhatsApp / SMS / sin enviar / ver
   ODS / salir). En la ODS archivada: botón «Opciones» (reenviar, ver, devolver).
   No hay integración real con WhatsApp ni SMS: se copia el texto y se registra
   el envío.
   -------------------------------------------------------------------------- */
const r75Btn=(t,js,cls='')=>`<button type="button" class="${cls}" onclick="${js}">${t}</button>`;
function r75Sent(oid,via){const o=db.orders.find(x=>x.id===oid);if(!o)return;const t=r74SurveyText(o);try{navigator.clipboard?.writeText(t)}catch{}R74.waText=t;(db.r75sent??=[]).push({id:uid(),order:oid,via,at:new Date().toISOString(),by:actor});(db.comments??=[]).push({id:uid(),actor,date:new Date().toISOString(),order:oid,kind:'Encuesta',text:'Encuesta enviada por '+via+' (texto copiado; sin integración real)'});R73.lastText='Encuesta enviada por '+via+' · ODS '+o.code;save('Encuesta enviada',o.code+' · '+via);toast('Texto de la encuesta copiado. Registrado el envío por '+via+'.')}
function r75CloseDlg(oid,mode){const o=db.orders.find(x=>x.id===oid);if(!o)return;const re=mode==='opciones',n=(db.r75sent||[]).filter(s=>s.order===oid).length;
  r72Show(`<div class="r75-dlg"><h2>${re?'Opciones':'¡Finalizar!'}</h2><p>${re?`La ODS <b>${esc(o.code)}</b> está archivada.`:`La ODS <b>${esc(o.code)}</b> se cerrará.`}${n?` <small>Envíos registrados: ${n}.</small>`:''}</p><p class="sub">${re?'Elige qué hacer con esta orden.':'¿Quiere enviar la encuesta de satisfacción al cliente?'}</p><div class="r75-dbtns">${button(re?'Reenviar por WhatsApp':'Vía WhatsApp',`r75Sent('${oid}','WhatsApp');closeModal()`,true)}${button(re?'Reenviar por SMS':'Vía SMS',`r75Sent('${oid}','SMS');closeModal()`)}${re?'':button('Finalizar sin enviar',`closeModal()`)}${button('Ver ODS',`r72OpenOrder('${oid}')`)}${re?r75Btn('Devolver ODS',`r75Back('${oid}')`,'r73-red'):''}${button(re?'No / salir':'Salir',`closeModal()`)}</div></div>`)}
function r75Back(oid){closeModal();setTimeout(()=>reopen(oid),30)}
const r75SetBase=r7SetOrderState;
r7SetOrderState=function(id,value){const o=db.orders.find(x=>x.id===id),was=o?.state,ui=window.event?.target?.tagName==='SELECT';r75SetBase(id,value);if(o&&ui&&value==='Archivada'&&was!=='Archivada')setTimeout(()=>r75CloseDlg(id,'finalizar'),60)};
const r75OpenOrderBase=r72OpenOrder;
r72OpenOrder=function(id,...r){const out=r75OpenOrderBase(id,...r),o=db.orders.find(x=>x.id===id),bar=$('modalbody')?.querySelector('.r74-sbar');if(o&&bar&&!bar.querySelector('.r75-opt'))bar.insertAdjacentHTML('beforeend',r75Btn('Opciones',`r75CloseDlg('${id}','opciones')`,'r75-opt'));return out};
const r75SurveyBase=r74Survey;
r74Survey=function(oid){r75SurveyBase(oid);const sel=$('modalbody')?.querySelector('select[name=channel]');if(sel&&![...sel.options].some(o=>o.value==='SMS'))sel.insertAdjacentHTML('beforeend','<option value="SMS">SMS</option>')};
