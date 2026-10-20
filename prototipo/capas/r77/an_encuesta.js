
/* --------------------------------------------------------------------------
   R7.7 · Encuesta de satisfacción con ENLACE: el cliente abre el enlace, ve una
   página de una sola pantalla, responde y la respuesta llega al sistema
   (alimenta el NPS y las métricas de satisfacción).
   En el prototipo el enlace es #encuesta=<ODS> y la respuesta se guarda en el
   mismo navegador; en el sistema real será una página pública con un enlace
   firmado de un solo uso (ver docs/api/CONTRATO_API_R77.md).
   -------------------------------------------------------------------------- */
const r77SurveyLink=oid=>location.href.split('#')[0]+'#encuesta='+encodeURIComponent(oid);
r74SurveyText=function(o){const v=vehicle(o.vehicle),cl=client(v.client);return `Hola ${cl.name||''}, gracias por confiar en ${r73Company().name}. Cuéntanos cómo te fue con la ODS ${o.code} (${v.plate||''}) en esta encuesta de 1 minuto: ${r77SurveyLink(o.id)}`};
function r77SurveyCopy(oid){const t=r77SurveyLink(oid);try{navigator.clipboard?.writeText(t)}catch{}toast('Enlace de la encuesta copiado.')}
const r74SurveyAlc=r74Survey;
r74Survey=function(oid){r74SurveyAlc(oid);const row=$('modalbody')&&$('modalbody').querySelector('.wide.row');if(row)row.insertAdjacentHTML('beforeend',button('Copiar enlace de la encuesta',`r77SurveyCopy('${oid}')`)+button('Ver como lo ve el cliente',`r77SurveyPage('${oid}',true)`))};
function r77SurveyClose(){document.getElementById('r77sv')?.remove()}
function r77SurveyPage(oid,preview){r77SurveyClose();const o=db.orders.find(x=>x.id===oid),div=document.createElement('div');div.id='r77sv';div.className='r77-sv';
  if(!o){div.innerHTML='<div class="r77-svbox"><h1>Enlace no válido</h1><p>Esta encuesta no existe o ya no está disponible.</p></div>';document.body.appendChild(div);return}
  const v=vehicle(o.vehicle),cl=client(v.client);
  div.innerHTML=`<div class="r77-svbox"><p class="r77-svtag">${preview?'<b>Vista previa</b> · ':''}${esc(r73Company().name)}</p><h1>Cuéntanos cómo te fue</h1><p class="sub">ODS ${esc(o.code)} · ${esc(v.brand||'')} ${esc(v.model||'')} ${esc(v.plate||'')}. Son 7 preguntas y toma 1 minuto.</p>
  <form id="r77svf">${R74_SQ.map(([k,q,opts],i)=>`<fieldset class="r77-svq"><legend>${i+1}. ${esc(q)}</legend><div class="r77-svo">${opts.map(x=>`<label class="r77-svopt"><input type="radio" name="${k}" value="${esc(x)}" required> ${esc(x)}</label>`).join('')}</div></fieldset>`).join('')}
  <label class="r77-svc">Comentario (opcional)<textarea name="comment" rows="3" maxlength="400"></textarea></label><div class="r77-svb">${preview?'<button type="button" onclick="r77SurveyClose()">Cerrar vista previa</button>':''}<button class="primary" type="submit">Enviar respuestas</button></div></form></div>`;
  document.body.appendChild(div);
  document.getElementById('r77svf').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),ans={};R74_SQ.forEach(([k])=>{if(d[k])ans[k]=d[k]});if(d.comment)ans.comment=d.comment;
    (db.r74surveys??=[]).push({id:uid(),order:oid,at:new Date().toISOString(),channel:'Enlace',answers:ans,by:'cliente'});
    db.tasks.filter(t=>t.r74auto?.kind==='post'&&t.r74auto.order===oid&&!['Completada','Cancelada'].includes(t.state)).forEach(t=>t.state='Completada');
    (db.comments??=[]).push({id:uid(),actor:'cliente',date:new Date().toISOString(),order:oid,kind:'Encuesta',text:'Encuesta respondida por el cliente (enlace)'+(ans.nps?' · recomendación '+ans.nps+'/10':'')});
    R73.lastText='Encuesta respondida · ODS '+o.code;try{save('Encuesta respondida',o.code+' · '+(ans.nps||'—')+'/10')}catch{}
    div.querySelector('.r77-svbox').innerHTML=`<h1>¡Gracias, ${esc((cl.name||'').split(' ')[0]||'cliente')}!</h1><p>Tus respuestas llegaron a ${esc(r73Company().name)}.</p>${preview?'<div class="r77-svb"><button class="primary" type="button" onclick="r77SurveyClose()">Cerrar</button></div>':''}`}}
function r77SurveyRoute(){const m=/#encuesta=([^&]+)/.exec(location.hash);if(m)r77SurveyPage(decodeURIComponent(m[1]))}
window.addEventListener('hashchange',r77SurveyRoute);setTimeout(r77SurveyRoute,0);
