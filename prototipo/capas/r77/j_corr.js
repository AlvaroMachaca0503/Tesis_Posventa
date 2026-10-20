
/* --------------------------------------------------------------------------
   R7.7 · Edición de una ODS cerrada: la solicitud crea una tarea para el jefe
   de taller (regla de Automatizaciones). Aprobar / No aprobar completan la
   tarea y quedan en la Bitácora; si se aprueba, otra regla crea la tarea de
   la cajera y la ODS se puede editar sin cambiar la fecha de salida.
   -------------------------------------------------------------------------- */
function r77EnsureSeeds(){const d=r77Db(),jefe=db.users.find(u=>u.role==='Jefe de taller'&&u.active)?.id||'u-admin',caja=r74AutoCfg().owner,mk=(k,r)=>{if(r77Pre(k)||d.gone.includes(k))return;d.rules.push({id:'seed-'+k,pre:k,conds:[],active:true,createdAt:new Date().toISOString(),...r})};
  mk('corr1',{name:'Aprobar edición de ODS cerrada',desc:'Cuando se solicita editar una ODS cerrada, crea la tarea de aprobación para el jefe de taller (Aprobar / No aprobar).',trigger:'correccion_solicitada',actions:[{...r77NewAct('tarea'),owner:jefe,list:'operativa',priority:'Alta',dueN:0,tags:'Aprobación',title:'Aprobar edición de la ODS {ods.codigo}',desc:'{solicitud.solicitante} pide editar la ODS {ods.codigo} ({vehiculo.placa}), que ya está cerrada.\nMotivo: {solicitud.motivo}'}]});
  mk('corr2',{name:'Edición aprobada → tarea a la cajera',desc:'Cuando el jefe de taller aprueba editar una ODS cerrada, crea la tarea para la cajera. La ODS sigue en «Cerrado» y la fecha de salida no cambia.',trigger:'correccion_aprobada',actions:[{...r77NewAct('tarea'),owner:caja,list:'postventa',priority:'Alta',dueN:0,tags:'Edición aprobada',title:'Tarea aprobada para edición de la ODS {ods.codigo}',desc:'El jefe de taller aprobó editar la ODS {ods.codigo}. Sigue en «Cerrado»; la fecha de salida no cambia. Al terminar, marca esta tarea como completada.'}]})}
/* decidir una solicitud */
function r77CorrDecide(reqId,ok,reason){const r=db.correctionRequests.find(x=>x.id===reqId);if(!r)return;if(r.state!=='Pendiente')return toast('Esta solicitud ya fue resuelta.');const role=r72Role();if(!['Jefe de taller','Administrador'].includes(role))return toast('Aprueba el jefe de taller o el administrador.');
  const o=db.orders.find(x=>x.id===r.order);if(!o)return;r.state=ok?'Aprobada':'No aprobada';r.approvedBy=actor;r.approvedAt=new Date().toISOString();if(!ok)r.rejectReason=reason||'';
  db.tasks.filter(t=>t.reqId===reqId&&t.r77?.event==='correccion_solicitada'&&t.state!=='Completada').forEach(t=>{t.state='Completada';t.description=(t.description||'')+'\nResultado: '+(ok?'Aprobada':'No aprobada por: '+(reason||'sin motivo'))});
  r7Log(o.id,ok?'Edición aprobada':'Edición no aprobada',ok?'Se aprobó editar la ODS cerrada. La fecha de salida no cambia.':'No se aprobó editar la ODS cerrada. Motivo: '+(reason||'sin motivo'));
  if(ok)o.editGrant={request:reqId,by:actor,to:r.requester,at:new Date().toISOString()};
  R73.lastText='Edición de la ODS '+o.code+(ok?' aprobada':' no aprobada');save(ok?'Edición aprobada':'Edición no aprobada',o.code)}
function r77CorrNo(reqId){form('No aprobar la edición',field('reason','Motivo por el que no se aprueba','','textarea','required'),d=>{r77CorrDecide(reqId,false,d.reason)})}
r7ApproveCorrection=function(id){r77CorrDecide(id,true)};
/* terminar la edición */
function r77EditDone(orderId){const o=db.orders.find(x=>x.id===orderId);if(!o||!o.editGrant)return;const rq=o.editGrant.request;o.editGrant=null;db.tasks.filter(t=>t.r77edit?.request===rq&&t.state!=='Completada').forEach(t=>t.state='Completada');r7Log(o.id,'Edición terminada','Terminó la edición autorizada. La ODS sigue cerrada y la fecha de salida no cambió.');R73.lastText='Edición terminada en la ODS '+o.code;save('Edición terminada',o.code)}
const r77InlineBase=r6Inline;
r6Inline=function(id,field,value){const t=db.tasks.find(x=>x.id===id),was=t?.state;r77InlineBase(id,field,value);if(field==='state'&&value==='Completada'&&was!=='Completada'&&t?.r77edit&&db.orders.find(o=>o.id===t.r77edit.order)?.editGrant)r77EditDone(t.r77edit.order)};
/* con la edición autorizada la ODS cerrada no está bloqueada (el estado sigue siendo Cerrado) */
const r77LockedBase=r72BoxLocked;
r72BoxLocked=function(k){if(k.startsWith('o:')&&r72Box(k)?.editGrant)return false;return r77LockedBase(k)};
const r77OpenCorr=r72OpenOrder;
r72OpenOrder=function(id,...r){const out=r77OpenCorr(id,...r),o=db.orders.find(x=>x.id===id),mb=$('modalbody');if(o?.editGrant&&mb&&$('modal').open&&!mb.querySelector('.r77-egr')){const h2=mb.querySelector('h2'),html=`<div class="r77-egr r77-wbar">✎ <b>Edición autorizada</b> por ${esc(tech(o.editGrant.by)||'el jefe de taller')}. La ODS sigue en «Cerrado» y la fecha de salida no cambia. ${button('Terminar edición',`r77EditDone('${o.id}')`,true)}</div>`;if(h2)h2.insertAdjacentHTML('afterend',html);else mb.insertAdjacentHTML('afterbegin',html)}return out};
/* panel de la tarea: Aprobar / No aprobar */
const r77PanelCorr=r6TaskPanel;
r6TaskPanel=function(){const h=r77PanelCorr(),t=db.tasks.find(x=>x.id===r6PanelId);if(!h||!t)return h;let box='';
  if(t.reqId&&t.r77?.event==='correccion_solicitada'){const q=db.correctionRequests.find(x=>x.id===t.reqId),o=db.orders.find(x=>x.id===q?.order);if(q)box=`<div class="r74-autobox r77-appr"><b>✎ Solicitud de edición · ODS ${esc(o?.code||'')}</b><p>Pide: ${esc(tech(q.requester)||q.requester)} · Motivo: ${esc(q.reason)}</p>${q.state==='Pendiente'?`<div class="row">${button('✓ Aprobar',`r77CorrDecide('${q.id}',true)`,true)}${button('✗ No aprobar',`r77CorrNo('${q.id}')`)}${o?button('▤ Ver ODS',`r72OpenOrder('${o.id}')`):''}</div>`:`<p><span class="pill ${q.state==='Aprobada'?'green':'red'}">${esc(q.state)}</span>${q.rejectReason?' · '+esc(q.rejectReason):''}</p>`}</div>`}
  else if(t.r77edit){const o=db.orders.find(x=>x.id===t.r77edit.order);box=`<div class="r74-autobox r77-appr"><b>✎ Edición aprobada · ODS ${esc(o?.code||'')}</b><p>Edita la ODS cerrada; la fecha de salida no cambia.</p><div class="row">${o?button('▤ Abrir ODS',`r72OpenOrder('${o.id}')`,true):''}${o?.editGrant?button('Terminar edición',`r77EditDone('${o.id}')`):''}</div></div>`}
  return box?h.replace('<div class="tabs">',box+'<div class="tabs">'):h};
