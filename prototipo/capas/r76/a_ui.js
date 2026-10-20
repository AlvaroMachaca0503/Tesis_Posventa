
/* ==========================================================================
   R7.6 · quinta ronda de comentarios (16/10/2026)
   Banner oculto (versión en Configuración), estados de tarea reducidos a
   Pendiente / En proceso / Completada, tipo «Evento», ☰ en el Espacio de
   trabajo solo pliega áreas y listas, línea temporal compacta y reporte
   de posventa.
   ========================================================================== */
const R76={tlOpen:!!r72Store('tlOpen')};
/* ---- estados de tarea: solo los tres que usa el taller ---- */
function r6States(){return ['Pendiente','En proceso','Completada']}
R74_SG.splice(0,R74_SG.length,['Sin iniciar',['Pendiente']],['Activa',['En proceso']],['Cerrada',['Completada']]);
/* ---- tipo de tarea: se agrega «Evento» al selector ---- */
const r76PopBase=r74StatePop;
r74StatePop=function(id,el,tab='Estado',q=''){r76PopBase(id,el,tab,q);if(tab!=='Tipo de tarea')return;const p=$('r74pop'),t=db.tasks.find(x=>x.id===id);if(!p||!t||p.querySelector('[data-r76ev]'))return;if(q&&!normal('Evento').includes(normal(q)))return;p.insertAdjacentHTML('beforeend',`<button type="button" data-r76ev="1" class="${t.type==='Evento'?'on':''}" onclick="r74PopClose();r6Inline('${id}','type','Evento')">Evento${t.type==='Evento'?' ✓':''}</button>`)};
/* ---- fecha de cierre de las tareas (para el reporte de posventa) ---- */
function r76Stamp(){db.tasks.forEach(t=>{if(t.state==='Completada'&&!t.doneAt)t.doneAt=new Date().toISOString();if(t.state!=='Completada'&&t.doneAt)delete t.doneAt})}
/* ---- ☰: en el Espacio de trabajo solo pliega áreas y listas ---- */
r72NavToggle=function(){if(page==='tareas'){const on=!document.body.classList.contains('r76-tree');document.body.classList.toggle('r76-tree',on);r72Store('tree',on);return}document.body.classList.toggle('r74-focus');document.body.classList.remove('r72-navmin');r72Store('focus',document.body.classList.contains('r74-focus'))};
/* ---- versión y alcance en Configuración (el banner superior se oculta) ---- */
const r76AjustesBase=views.ajustes;
views.ajustes=()=>r76AjustesBase()+`<div class="panel space r76-ver"><h3>Versión del prototipo</h3><p><b>R_Motriz R7.6 · demo local</b></p><p class="sub">Núcleo de tesis funcional + evolución empresarial demostrativa. No es producción; no incluye SUNAT, inventario, contabilidad, RR. HH., SaaS ni OBD2. Datos sintéticos en este navegador.</p></div>`;
