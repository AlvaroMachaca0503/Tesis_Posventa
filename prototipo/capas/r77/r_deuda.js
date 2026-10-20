
/* --------------------------------------------------------------------------
   R7.7 · Regla «Cliente con deuda»: al crearse una ODS de un cliente con deuda
   pendiente (cuentas por cobrar) se añade la etiqueta «Cliente con deuda» a la
   orden —se ve arriba— y se avisa en la Bitácora para que la cajera lo revise.
   -------------------------------------------------------------------------- */
function r77Debt(cid){if(!cid)return 0;return r2(r73Docs('cobrar').filter(d=>d.party===cid).reduce((a,d)=>a+(+d.saldo||0),0))}
function r77EnsureSeeds2(){const d=r77Db(),mk=(k,r)=>{if(r77Pre(k)||d.gone.includes(k))return;d.rules.push({id:'seed-'+k,pre:k,conds:[],active:true,createdAt:new Date().toISOString(),...r})};
  mk('deuda',{name:'Cliente con deuda → etiqueta y aviso en la bitácora',desc:'Cuando se crea una ODS de un cliente con deuda pendiente, la etiqueta «Cliente con deuda» se muestra arriba de la orden y la bitácora avisa a la cajera.',trigger:'ods_creada',conds:[{k:'deuda',v:'si'}],actions:[{type:'etiqueta',title:'Cliente con deuda'},{type:'comentario',title:'⚠ Revisar al cliente {cliente.nombre}: tiene una deuda pendiente de {cliente.deuda}. Cajera: confirmar antes de entregar el vehículo.'}]})}
/* etiquetas de la orden: se ven arriba y se pueden quitar */
const r77LblHtml=(o,rm)=>(o.labels||[]).map(l=>`<span class="pill red r77-lbl">🏷 ${l==='Cliente con deuda'?`<button type="button" class="r77-debt" title="Ver todas las deudas del cliente" onclick="event.stopPropagation();r77DebtOpen('${o.id}')">${esc(l)} · ver deudas ›</button>`:esc(l)}${rm?`<button type="button" aria-label="Quitar etiqueta" title="Quitar etiqueta" onclick="r77LabelDel('${o.id}','${esc(l).replace(/'/g,'&#39;')}')">✕</button>`:''}</span>`).join('');
function r77LabelDel(id,l){const o=db.orders.find(x=>x.id===id);if(!o)return;const t=String(l).replace(/&#39;/g,"'").replace(/&amp;/g,'&');o.labels=(o.labels||[]).filter(x=>x!==t);r7Log(id,'Etiqueta quitada','Se quitó la etiqueta «'+t+'».');R73.lastText='Etiqueta «'+t+'» quitada de la ODS '+o.code;r72Commit('Etiqueta quitada',o.code)}
const r77CardLbl=r77OdsCard;
r77OdsCard=function(id,menu){const h=r77CardLbl(id,menu),o=db.orders.find(x=>x.id===id);if(!o?.labels?.length)return h;const k='<b>'+esc(o.code)+'</b>';return h.replace(k,k+' '+r77LblHtml(o,false))};
const r77LblOpen=r72OpenOrder;
r72OpenOrder=function(id,...r){const out=r77LblOpen(id,...r),o=db.orders.find(x=>x.id===id),mb=$('modalbody');if(o?.labels?.length&&mb&&$('modal').open&&!mb.querySelector('.r77-lbls')){const h=mb.querySelector('.r77-oshell')?mb.firstElementChild:mb.firstElementChild;const box=`<div class="r77-lbls">${r77LblHtml(o,true)}</div>`;if(h)h.insertAdjacentHTML('beforebegin',box);else mb.insertAdjacentHTML('afterbegin',box)}return out};

/* un clic en «Cliente con deuda» (etiqueta o bitácora) lleva a Cuentas por cobrar con la lista de deudas del cliente */
function r77DebtOpenClient(cid){if(!cid)return toast('La orden no tiene cliente.');if(!(r77Debt(cid)>0))return toast('El cliente ya no tiene deudas pendientes.');try{closeModal()}catch{}R73.cxTab='cobrar';R73.cxHist=false;R73.cxView='cliente';go('cobrar');r73Account('cobrar',cid)}
function r77DebtOpen(oid){const o=db.orders.find(x=>x.id===oid);if(!o)return;r77DebtOpenClient(vehicle(o.vehicle).client)}
const r77BitDebt=views.bitacora;
views.bitacora=()=>{let h=r77BitDebt();db.comments.filter(c=>c.debtClient&&!c.deleted).forEach(c=>{const n=esc(c.text);if(n&&h.includes(n))h=h.split(n).join(n+` <button type="button" class="r77-debt" onclick="r77DebtOpenClient('${c.debtClient}')">Ver deudas del cliente ›</button>`)});return h};
