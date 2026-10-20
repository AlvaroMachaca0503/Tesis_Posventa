
/* --------------------------------------------------------------------------
   R7.7 · Ingresos y Egresos en el menú; la caja se apertura y se cierra
   dentro de «Emitir comprobante» (notas de venta), no en un módulo aparte
   -------------------------------------------------------------------------- */
(function(){const nav=R75_NAV;
  const rm=id=>nav.forEach(n=>{if(n.items)n.items=n.items.filter(i=>i!==id)});
  ['caja','cobrar','pagar','compras','cotizaciones','notas'].forEach(rm);
  const drop=name=>{const i=nav.findIndex(n=>n.sec===name);if(i>=0)nav.splice(i,1)};
  drop('Cuentas');drop('Compras');drop('Ventas');drop('Ingresos');drop('Egresos');
  const at=nav.findIndex(n=>n.sec==='Seguimiento');
  nav.splice(at<0?nav.length:at,0,{sec:'Ingresos',icon:'↗',items:['cotizaciones','notas','cobrar']},{sec:'Egresos',icon:'↙',items:['compras','pagar']});
  R75_MODS.notas=['▧','Emitir comprobante (nota de venta)'];
  r75Rebuild()})();
/* caja del usuario: una abierta a la vez; puede aperturar cualquiera de su sede que esté libre */
const r77MyBox=()=>db.cashBoxes.find(b=>b.open&&b.openedBy===actor)||db.cashBoxes.find(b=>b.open&&b.user===actor&&!b.openedBy);
function r77FreeBoxes(){const sede=r73UserSede(),admin=r72Role()==='Administrador';return db.cashBoxes.filter(b=>b.active!==false&&!b.open&&(admin||b.branch===sede)&&!db.cashBoxes.some(x=>x.open&&x.branch===b.branch))}
const r77Sede=b=>db.branches.find(x=>x.id===b.branch)?.name||b.branch;
function r77CajaOpen(){const mine=r77MyBox();if(mine)return toast('Ya tienes abierta «'+mine.name+'». Ciérrala antes de aperturar otra.');const free=r77FreeBoxes();if(!free.length){const busy=db.cashBoxes.find(b=>b.open&&b.branch===r73UserSede());return toast(busy?'La sede ya tiene su caja abierta («'+busy.name+'», a cargo de '+(tech(busy.openedBy)||'otro usuario')+'). Solo se abre una caja por sede.':'No hay cajas libres en tu sede.')}
  form('Aperturar caja',select('box','Seleccione una caja',free.map(b=>[b.id,b.name+' · '+r77Sede(b)]))+field('initial','Importe S/',0,'number','min="0" step="0.01" required')+`<p class="wide sub">Solo se listan las cajas de tu sede que no están abiertas. Una caja abierta pertenece a un solo usuario hasta que se cierre. Moneda: soles.</p>`,d=>{const b=db.cashBoxes.find(x=>x.id===d.box);if(!b||b.open){toast('Esa caja ya fue aperturada.');return false}if(db.cashBoxes.some(x=>x.open&&x.branch===b.branch)){toast('Esa sede ya tiene una caja abierta: solo se apertura una caja por sede.');return false}b.open=true;b.initial=+d.initial||0;b.openedAt=new Date().toISOString();b.openedBy=actor;b.user=actor;b.start=db.movements.length;R73.lastText='Caja «'+b.name+'» aperturada';save('Caja abierta',b.name)})}
/* resumen de la sesión de caja: ventas cobradas por el usuario desde la apertura */
function r77CajaSum(b){const from=b.openedAt||'',by=b.openedBy||actor,pays=db.payments.filter(p=>String(p.date)>=from&&p.actor===by),adv=(db.advances||[]).filter(p=>String(p.date)>=from&&(p.actor===by||!p.actor)),all=[...pays,...adv],by_m={};all.forEach(p=>{const m=p.method||'Efectivo';by_m[m]=(by_m[m]||0)+(+p.amount||0)});const total=Object.values(by_m).reduce((a,x)=>a+x,0),cash=by_m['Efectivo']||0;return {n:all.length,by:by_m,total,cash,expected:(+b.initial||0)+cash}}
function r77CajaTable(b){const s=r77CajaSum(b);return `<h3 class="r77-cvt">Ventas (${s.n})</h3>${table(['SOL','Importe'],[['Apertura (efectivo inicial)',money(b.initial||0)],...Object.entries(s.by).map(([m,v])=>[esc(b.name+' · '+m),money(v)]),['<b>Total ventas</b>','<b>'+money(s.total)+'</b>'],['<b>Efectivo esperado en caja</b>','<b>'+money(s.expected)+'</b>']])}`}
function r77CajaDetail(){const b=r77MyBox();if(!b)return toast('No tienes una caja abierta.');modal(`<h2>Detalle de Caja</h2><p class="sub">${esc(b.name)} · ${esc(r77Sede(b))} · abierta ${esc(new Date(b.openedAt).toLocaleString('es-PE'))}</p>${r77CajaTable(b)}<footer>${button('🖨 Imprimir','window.print()')}${button('✖ Cerrar','closeModal()',true)}</footer>`)}
function r77CajaClose(){const b=r77MyBox();if(!b)return toast('No tienes una caja abierta.');modal(`<h2>Cerrar Caja</h2><p class="sub">${esc(b.name)} · ${esc(r77Sede(b))}</p>${r77CajaTable(b)}<label class="wide">Observaciones<textarea id="r77cobs" rows="3"></textarea></label><footer>${button('💾 Grabar','r77CajaCloseSave()',true)}${button('✖ Cerrar','closeModal()')}</footer>`)}
function r77CajaCloseSave(){const b=r77MyBox();if(!b)return;const s=r77CajaSum(b),obs=$('r77cobs')?.value||'';(db.r77cajas??=[]).push({id:uid(),box:b.id,name:b.name,branch:b.branch,by:b.openedBy||actor,openedAt:b.openedAt,closedAt:new Date().toISOString(),initial:b.initial,total:s.total,expected:s.expected,obs});b.open=false;b.closedAt=new Date().toISOString();b.expected=s.expected;b.closeNote=obs;b.openedBy=null;b.user=null;closeModal();R73.lastText='Caja «'+b.name+'» cerrada';save('Caja cerrada',b.name)}
function r77CajaBar(){const b=r77MyBox();return `<div class="r77-cajabar"><span>ℹ <b>Datos del comprobante</b> · el único comprobante es la <b>nota de venta</b></span><span class="r77-cajaright">${b?`<b>${esc(b.name)}</b>${button('🔍 Ver detalle','r77CajaDetail()')}${r72Role()==='Cajera'?button('☰ Movimientos de mi caja efectivo','r77MyCashMovs()'):''}<button type="button" class="r77-red" onclick="r77CajaClose()">✖ Cerrar caja</button>`:`<span class="sub">Sin caja abierta</span>${button('Aperturar caja','r77CajaOpen()',true)}`}</span></div>`}
const r77NotasBase=views.notas;
views.notas=()=>{const h=r77NotasBase(),i=h.indexOf('<div class="panel">');const bar=db.settings.useCajas?r77CajaBar():'';return i<0?h+bar:h.slice(0,i)+bar+h.slice(i)};
/* emitir una nota exige tener una caja abierta */
const r77NoteBase=newNoteR5;
newNoteR5=function(orderId){if(db.settings.useCajas&&!r77MyBox())return modal(`<h2>Caja sin apertura</h2><p>Aperturar una caja antes de emitir una nota de venta.</p><footer>${button('Aperturar caja','closeModal();r77CajaOpen()',true)}${button('Cerrar','closeModal()')}</footer>`);return r77NoteBase(orderId)};
newNote=newNoteR5;
r75Nav();
