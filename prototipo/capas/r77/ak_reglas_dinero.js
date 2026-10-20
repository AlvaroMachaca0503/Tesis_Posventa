
/* --------------------------------------------------------------------------
   R7.7 · Bancos (simple): cada cuenta tiene estas acciones:
   Movimientos · Trasladar a otra cuenta · Ingreso · Egreso · Editar.
   - Ingreso: contacto (opcional), método, valor recibido y concepto.
   - Egreso: proveedor (obligatorio), valor pagado y concepto de pago.
   - Cada persona ve solo las cuentas de su sede; administración y finanzas
     ven todas. Todos los que entran a Bancos ven los montos.
   - El pago a proveedores se hace en Egresos › Compras y Cuentas por pagar.
   - Sin apertura ni cierre de caja: el pago solo indica a qué caja o banco entró.
   -------------------------------------------------------------------------- */
r73I.swap='⇄';
if(!db.users.some(u=>u.id==='u-finanzas'))db.users.push({id:'u-finanzas',name:'Asistente administrativo de finanzas · demo',role:'Finanzas',active:true,sede:'union'});
if(!R74_ROLES.includes('Finanzas'))R74_ROLES.push('Finanzas');
(function(){const s=db.settings;s.bankAmountRoles??=['Administrador'];if(!s.r77FinRol){s.r77FinRol=true;if(!s.bankAmountRoles.includes('Finanzas'))s.bankAmountRoles.push('Finanzas')}if(!s.r77BankAll){s.r77BankAll=true;['Cajera','Logístico'].forEach(r=>{if(!s.bankAmountRoles.includes(r))s.bankAmountRoles.push(r)})}
  const br={'bank-union':'union','bank-prohogar':'prohogar'};db.bankAccounts.forEach(a=>{if(a.branch==null&&br[a.id])a.branch=br[a.id]})})();
const r77SedeCash=sede=>db.bankAccounts.find(a=>!a.deleted&&a.type==='Efectivo'&&a.branch===sede&&!a.adminOnly);
const r77MyCash=()=>r77SedeCash(r73UserSede());
/* cuentas que cada persona ve: las de su sede (administración y el asistente administrativo de finanzas, todas) */
function r77AccVisible(a){if(!a||a.deleted)return false;const role=r72Role();if(role==='Administrador'||role==='Finanzas')return true;return !!a.branch&&a.branch===r73UserSede()&&!a.detra}
const r77AccList=()=>db.bankAccounts.filter(r77AccVisible);
/* los selectores de «banco o cuenta» (cobros, pagos, notas de venta) solo ofrecen las cuentas de la sede */
const r73AccOptsSede=r73AccOpts;
r73AccOpts=function(){const ids=new Set(r77AccList().map(a=>a.id));return r73AccOptsSede().filter(o=>ids.has(o[0]))};
const r7AccountOptionsSede=r7AccountOptions;
r7AccountOptions=function(){const ids=new Set(r77AccList().map(a=>a.id));return r7AccountOptionsSede().filter(o=>ids.has(o[0]))};
/* destinos de un traslado: las cuentas visibles y la caja fuerte (el retiro de caja) */
const r77DestList=()=>{const l=r77AccList(),safe=db.bankAccounts.find(a=>a.id==='safe'&&!a.deleted);return safe&&!l.includes(safe)?[...l,safe]:l};
/* ---------- ingreso y egreso directos desde la cuenta ---------- */
function r77BankMov(accId,type){const a=r73Acc(accId);if(!a||!r77AccVisible(a))return toast('No tienes acceso a esa cuenta.');const eg=type==='Egreso';
  form((eg?'Egresos':'Ingresos')+' · '+a.name,(eg?select('supplier','Proveedor',[['','Seleccionar proveedor…'],...db.suppliers.filter(s=>!s.deleted).map(s=>[s.id,s.name])],''):select('client','Cliente (opcional)',[['','NO HAY SELECCIÓN'],...db.clients.filter(c=>!c.deleted).map(c=>[c.id,c.name])],'')+select('method','Método',R73_METHODS.map(x=>[x,x])))+field('amount',eg?'Valor pagado':'Valor recibido','','number','min="0.01" step="0.01" required')+field('detail',eg?'Concepto de pago':'Concepto de ingreso','','textarea','required'),d=>{
    const amt=+d.amount;if(!(amt>0)){toast('Escribe un monto mayor que 0.');return false}if(eg&&!d.supplier){toast('Selecciona el proveedor: todo egreso sale a nombre de un proveedor.');return false}
    const who=eg?db.suppliers.find(s=>s.id===d.supplier):db.clients.find(c=>c.id===d.client),m={id:uid(),account:accId,type,amount:amt,method:d.method||'Efectivo',contact:who?.name||'',detail:d.detail,date:new Date().toISOString(),actor,seq:r73Seq()};if(eg)m.supplier=d.supplier;else if(d.client)m.client=d.client;
    (db.r73mov??=[]).push(m);a.balance=(+a.balance||0)+(eg?-amt:amt);R73.lastText=type+' '+a.name+' · '+money(amt)+' · '+d.detail;save(type+' registrado',a.name)})}
r73Mov=function(accId,type){r77BankMov(accId,type)};
/* ---------- traslado: desde una cuenta, escogiendo el destino ---------- */
const r77MovNewB2=r77MovNew;
r77MovNew=function(type){r77MovNewB2(type);const f=$('editor');if(!f)return;const acc=r77AccList(),opt=(arr,ph)=>(ph?`<option value="">${ph}</option>`:'')+arr.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');
  const o=f.querySelector('[name=account]'),d=f.querySelector('[name=dest]'),ov=o?.value,dv=d?.value;
  if(o){o.innerHTML=opt(acc);if([...o.options].some(x=>x.value===ov))o.value=ov}if(d){d.innerHTML=opt(r77DestList(),'Seleccionar…');if([...d.options].some(x=>x.value===dv))d.value=dv}};
function r77TrasFrom(id){const a=r73Acc(id);if(!a||!r77AccVisible(a))return toast('No tienes acceso a esa cuenta.');
  r77MovNew('Transferencia');const f=$('editor');if(!f)return;
  const o=f.querySelector('[name=account]');o.innerHTML=`<option value="${id}">${esc(a.name)}</option>`;o.value=id;
  const dsel=f.querySelector('[name=dest]');[...dsel.options].forEach(x=>{if(x.value===id)x.remove()});
  const kl=f.querySelector('[name=kind]')?.closest('label');if(kl)kl.hidden=true;const h=$('modalbody').querySelector('h2');if(h)h.textContent='Trasladar desde «'+a.name+'»'}
/* la cuenta muestra también sus traslados en «Movimientos» */
const r73MovsB=r73Movs;
r73Movs=function(accId){const out=r73MovsB(accId),nm=id=>r77Acc2(id)?.name||'—';
  (db.r77mov||[]).filter(m=>m.account===accId).forEach(m=>out.push({key:'m77:'+m.id,date:m.at||(m.date+'T12:00:00'),seq:m.code,detail:(m.transfer?(m.type==='Ingreso'?'Traslado recibido de '+nm(m.from):'Traslado enviado a '+nm(m.dest)):m.type)+' · '+m.concept,contact:m.party||'',debit:m.type==='Ingreso'?m.amount:0,credit:m.type==='Egreso'?m.amount:0,method:m.method||'Efectivo'}));
  return out.sort((a,b)=>String(b.date).localeCompare(String(a.date)))};
/* ---------- Bancos ---------- */
const r77BancosK=views.bancos;
views.bancos=()=>{if(!r73CanSeeBank())return r77BancosK();const adm=r72Role()==='Administrador';
  return heading('Bancos','Cuentas bancarias y cajas de efectivo de tu sede. Cada cuenta permite ver sus movimientos, trasladar a otra cuenta y registrar ingresos y egresos (el egreso es a un proveedor). El pago de facturas de compra se hace en Egresos.',adm?button('+ Cuenta','r73EditAcc()',true):'')+`<div class="panel">${table(['Acciones','Nombre','Número','Tipo','Sede','Saldo inicial','Saldo actual'],r77AccList().map(a=>[r73Act(r73Btn('list','Movimientos',`r73MovList('${a.id}')`),r73Btn('swap','Trasladar a otra cuenta',`r77TrasFrom('${a.id}')`),r73Btn('add','Ingreso',`r77BankMov('${a.id}','Ingreso')`,'r73-green'),r73Btn('minus','Egreso',`r77BankMov('${a.id}','Egreso')`,'r73-red'),adm?r73Btn('edit','Editar',`r73EditAcc('${a.id}')`):'',adm&&!r73Movs(a.id).length?r73Btn('del','Eliminar',`r73DelAcc('${a.id}')`,'r73-red'):''),`<b>${esc(a.name)}</b>`,esc(a.number||'—'),esc(a.type),esc(a.branch?r73Sede(a.branch):'—'),money(a.initial||0),money(a.balance)]))}</div>`};
/* ingreso y egreso sin comprobante (beta) ya no dependen de la caja */
function r77MovVisible(){return true}
