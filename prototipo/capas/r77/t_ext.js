
/* --------------------------------------------------------------------------
   R7.7 · Servicios externos y productos internos / externos
   - «Servicios externos» es un técnico del sistema (no se edita ni se borra).
     Se usa para lo que se terceriza (tornería, plancha y pintura, soldadura…)
     y se vende con margen.
   - Al asignarle un servicio, una regla manda la cotización al jefe de taller.
     El jefe crea subtareas para el logístico: comprar productos o llevar el
     producto al proveedor del servicio.
   - Producto interno: entra al stock. Producto externo: se compra y se vende
     el mismo día y no entra al stock.
   -------------------------------------------------------------------------- */
const R77_EXT='u-externo';
function r77ExtEnsure(){const u=db.users.find(x=>x.id===R77_EXT);if(!u)db.users.push({id:R77_EXT,name:'Servicios externos',role:'Técnico',roles:['Técnico','Servicios externos'],email:'',sede:'union',branch:'Arequipa',active:true,system:true,external:true});else Object.assign(u,{name:'Servicios externos',role:'Técnico',roles:['Técnico','Servicios externos'],active:true,system:true,external:true})}
function r77ExtLines(){const out=[],seen=new Set();db.orders.forEach(o=>{if(o.deleted)return;(o.lines||[]).forEach(l=>{if(l.type==='servicio'&&l.tech===R77_EXT&&l.name&&!seen.has(l.id)){seen.add(l.id);out.push({k:'o:'+o.id,box:o,line:l})}})});(db.r72quotes||[]).forEach(q=>{if(q.deleted||q.draft||q.order)return;(q.lines||[]).forEach(l=>{if(l.type==='servicio'&&l.tech===R77_EXT&&l.name&&!seen.has(l.id)){seen.add(l.id);out.push({k:'q:'+q.id,box:q,line:l})}})});return out}
function r77ExtFind(lineId){return r77ExtLines().find(z=>z.line.id===lineId)||null}
function r77EnsureSeeds3(){const d=r77Db(),jefe=db.users.find(u=>u.role==='Jefe de taller'&&u.active)?.id||'u-admin',mk=(k,r)=>{if(r77Pre(k)||d.gone.includes(k))return;d.rules.push({id:'seed-'+k,pre:k,conds:[],active:true,createdAt:new Date().toISOString(),...r})};
  mk('ext1',{name:'Servicio externo → cotizar con el jefe de taller',desc:'Cuando se asigna un servicio a «Servicios externos» (tornería, plancha y pintura, soldadura…), se crea la tarea para que el jefe de taller lo cotice con el proveedor y agregue su margen.',trigger:'servicio_externo',actions:[{...r77NewAct('tarea'),owner:jefe,list:'operativa',priority:'Alta',dueN:0,tags:'Servicio externo',title:'Cotizar servicio externo: {servicio} · {origen} · {vehiculo.placa}',desc:'Servicio de terceros: «{servicio}». Cotiza con el proveedor, registra su costo y el margen de venta. Si hace falta, crea subtareas para el logístico (comprar productos o llevar el producto al proveedor).\nVehículo: {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio} · placa {vehiculo.placa} · motor {vehiculo.motor} · VIN {vehiculo.vin}'}]})}
/* el usuario del sistema no se edita ni se desactiva */
const r77EditUserBase=r73EditUser;r73EditUser=function(id){if(id===R77_EXT)return toast('«Servicios externos» es un usuario del sistema: no se edita ni se elimina.');return r77EditUserBase(id)};
const r77DelUserBase=r73DelUser;r73DelUser=function(id){if(id===R77_EXT)return toast('«Servicios externos» es un usuario del sistema: no se edita ni se elimina.');return r77DelUserBase(id)};
function r77ExtUsersView(){if(page!=='usuarios')return;document.querySelectorAll('#view table.r74-t tbody tr').forEach(tr=>{if(!/Servicios externos/.test(tr.innerText)||tr.dataset.r77x)return;tr.dataset.r77x='1';tr.querySelector('.r77-optw')?.remove();tr.querySelectorAll('td').forEach(td=>{if(/^Activo$/.test(td.innerText.trim()))td.insertAdjacentHTML('beforeend',' <span class="pill">Sistema</span>')})})}
const r77ExtRender=render;render=function(){r77ExtRender();try{r77ExtUsersView()}catch{}};
/* subtareas para el logístico */
function r77ExtSub(taskId,kind){const t=db.tasks.find(x=>x.id===taskId),z=r77ExtFind(t?.r77ext?.line);if(!t||!z)return toast('No se encontró el servicio.');const box=z.box,logi=box.logistic||(typeof r72Logistics==='function'?r72Logistics()[0]?.id:null)||db.users.find(u=>u.role==='Logístico'&&u.active)?.id||actor;
  const title=kind==='comprar'?'Comprar productos para el servicio externo «'+z.line.name+'» · '+box.code:'Llevar el producto al proveedor del servicio «'+z.line.name+'» · '+box.code,
    desc=(kind==='comprar'?'Comprar los productos necesarios para el servicio externo y tenerlos listos.':'Llevar el repuesto o producto al local del proveedor del servicio para su arreglo, y registrar quién lo recibe.')+'\n— Datos del vehículo —\n'+r77VehText(box);
  const s={id:uid(),type:'Tarea',list:'logistica',owner:logi,title,state:'Pendiente',priority:'Normal',start:today(),end:today(),due:today(),startTime:'08:00',endTime:'18:00',createdBy:actor,createdAt:new Date().toISOString(),tags:'Servicio externo',description:desc,parent:t.id,deleted:false,r77extSub:{line:z.line.id,kind},...(z.k.startsWith('o:')?{orderId:box.id}:{})};
  db.tasks.push(s);try{r72Log(z.k,'Subtarea de servicio externo',title+' · para '+tech(logi))}catch{}R73.lastText='Subtarea creada: '+title;save('Subtarea de servicio externo',box.code)}
/* panel de la tarea del jefe: cuadro del servicio externo con costo, precio, margen y subtareas */
const r77ExtPanelBase=r6TaskPanel;
r6TaskPanel=function(){const h=r77ExtPanelBase(),t=db.tasks.find(x=>x.id===r6PanelId);if(!h||!t?.r77ext)return h;const z=r77ExtFind(t.r77ext.line);if(!z)return h;const l=z.line,sup=db.suppliers.filter(s=>!s.deleted).map(s=>[s.id,s.name]),m=r77Marg(l.cost,l.price),lock=z.box.state==='Archivada'&&!z.box.editGrant;
  const subs=db.tasks.filter(s=>s.parent===t.id&&!s.deleted);
  const box=`<div class="r74-autobox r77-ext"><b>🛠 Servicio externo · ${esc(l.name)} · ${esc(z.box.code)}</b><pre class="r77-veh">${esc(r77VehText(z.box))}</pre><p class="sub">Cotiza con el proveedor: elige quién lo hace, cuánto cobra (costo) y a cuánto lo vendes. El margen se calcula solo.</p>
<div class="r74-tw"><table class="r72-grid"><thead><tr><th>Servicio</th><th>Proveedor del servicio</th><th>Costo (lo que cobra)</th><th>Precio de venta</th><th class="r72-r">Margen</th></tr></thead><tbody><tr><td>${esc(l.name)}</td><td><select ${lock?'disabled':''} onchange="r77PurchaseSet('${z.k}','${l.id}','supplier',this.value)">${r72Opt(sup,l.supplier,'Seleccionar proveedor')}</select></td><td><input type="number" step="0.01" min="0" ${lock?'disabled':''} value="${l.cost??''}" onchange="r77PurchaseSet('${z.k}','${l.id}','cost',this.value)"></td><td><input type="number" step="0.01" min="0" ${lock?'disabled':''} value="${l.price??''}" onchange="r77PurchaseSet('${z.k}','${l.id}','price',this.value)"></td><td class="r72-r">${money(m.m)} <small>(${m.pc}%)</small></td></tr></tbody></table></div>
<div class="row">${button('＋ Subtarea: comprar productos',`r77ExtSub('${t.id}','comprar')`,true)}${button('＋ Subtarea: llevar el producto al proveedor',`r77ExtSub('${t.id}','llevar')`)}</div>${subs.length?`<p class="sub">Subtareas para el logístico:</p><ul>${subs.map(s=>`<li>${esc(s.title)} · ${esc(tech(s.owner)||s.owner)} · <span class="pill">${esc(s.state)}</span></li>`).join('')}</ul>`:''}</div>`;
  return h.replace('<div class="tabs">',box+'<div class="tabs">')};
/* productos internos (entran al stock) y externos (se compran y se venden el mismo día) */
const R77_STK=[['interno','Interno (entra al stock)'],['externo','Externo (se compra y vende el mismo día, sin stock)']];
function r77StockType(l){if(l.stockType)return l.stockType;const c=db.catalog.find(x=>!x.deleted&&((l.code&&x.code===l.code)||x.name===l.name));return c?.stockType||'interno'}
const r77CatBase=editCatalog;
editCatalog=function(id){r77CatBase(id);const f=$('editor');if(!f)return;const c=id&&db.catalog.find(x=>x.id===id),grid=f.querySelector('.formgrid')||f;
  grid.insertAdjacentHTML('beforeend',`<label>Tipo de producto<select name="stockType">${R77_STK.map(([k,n])=>`<option value="${k}" ${(c?.stockType||'interno')===k?'selected':''}>${n}</option>`).join('')}</select></label>`);
  f.addEventListener('submit',()=>{const st=f.querySelector('[name=stockType]').value,nm=f.querySelector('[name=name]')?.value;setTimeout(()=>{const it=id?db.catalog.find(x=>x.id===id):(db.catalog.find(x=>x.name===nm)||db.catalog.at(-1));if(it){it.stockType=st;try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}},0)},true)};
