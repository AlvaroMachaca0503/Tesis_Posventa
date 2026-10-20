
/* --------------------------------------------------------------------------
   Lista editable de ítems compartida por la cotización de la cita y la ODS.
   Columnas: tipo, ítem (buscador «código - nombre»), cantidad/H-H, costo (bloqueado
   salvo logística/administrador), precio unitario, descuento, subtotal, total,
   rentabilidad, responsable y eliminar. El técnico no ve costos ni rentabilidad.
   -------------------------------------------------------------------------- */
function r72Grid(k,opts={}){
  const box=r72Box(k);if(!box)return '';box.lines??=[];
  const locked=r72BoxLocked(k)||opts.readonly,tech=r72IsTech(),com=r72Commercial(),canCost=r72CanCost(),sel=R72.sel[k]??=new Set();
  const dis=locked?'disabled':'';
  const head=['<th class="r72-ck"></th>','<th>Tipo</th>','<th class="r72-item">Ítem</th>','<th>Cant./H-H</th>',com?'<th title="Solo logística o administrador lo edita">Costo unit. 🔒</th>':'','<th>P. unitario</th>',com?'<th>Desc.</th>':'',com?'<th>Subtotal</th>':'','<th>Total</th>',com?'<th>Rentab.</th>':'','<th>Responsable</th>','<th>Estado</th>','<th></th>'].join('');
  const num=(l,f,v,extra='')=>`<input type="number" class="r72-num" ${dis} ${extra} value="${v??''}" onchange="r72Set('${k}','${l.id}','${f}',this.value)">`;
  const row=l=>{
    const svc=l.type==='servicio',profit=r72LineProfit(l),tot=r72LineTotal(l),pct=profit!=null&&tot?Math.round(profit/tot*100):null;
    const priceLocked=tech&&!svc; /* el técnico ve el precio final del producto, pero no lo cambia */
    const owners=svc?techOpts():r72Logistics().map(u=>[u.id,u.name]);
    const canDel=!locked&&(!tech||(l.createdBy===actor&&!l.approved));
    return `<tr class="${l.approved?'':'r72-new'}">
<td class="r72-ck"><input type="checkbox" ${dis} ${sel.has(l.id)?'checked':''} onchange="r72Toggle('${k}','${l.id}',this.checked)" aria-label="Seleccionar ítem"></td>
<td><select ${dis||(tech&&l.approved?'disabled':'')} onchange="r72Set('${k}','${l.id}','type',this.value)"><option value="servicio" ${svc?'selected':''}>Servicio</option><option value="producto" ${svc?'':'selected'}>Producto</option></select></td>
<td class="r72-item"><div class="r72-combo"><input ${dis} data-k="${k}" data-l="${l.id}" data-type="${l.type}" data-focus="${l.id}" value="${esc(r72LineLabel(l))}" placeholder="Escribe para buscar…" autocomplete="off" oninput="r72Suggest(this)" onfocus="r72Suggest(this)" onkeydown="r72SugKey(event,this)" onblur="r72SugHide(this)" onchange="r72SetName('${k}','${l.id}',this.value)"><div class="r72-sug" hidden></div></div>${l.external?'<small class="r72-tag">externo</small>':''}</td>
<td>${svc?num(l,'hours',l.hours,'min="0" step="0.25" title="H-H: no multiplica el precio"'):num(l,'qty',l.qty,'min="0" step="1"')}<small class="sub">${svc?'H-H':'und.'}</small></td>
${com?`<td>${canCost?num(l,'cost',l.cost,'min="0" step="0.01"'):`<span class="r72-lock">${l.cost==null?'—':money(l.cost)}</span>`}</td>`:''}
<td>${priceLocked?`<span class="r72-lock" title="Precio bloqueado para el técnico">${l.price==null?'Por cotizar':money(l.price)}</span>`:num(l,'price',l.price,'min="0" step="0.01"')}<small class="sub">${svc?'precio final':'por unidad'}</small></td>
${com?`<td>${num(l,'discount',l.discount||0,'min="0" step="0.01"')}</td><td class="r72-r">${money(r72LineSubtotal(l))}</td>`:''}
<td class="r72-r"><b>${money(tot)}</b></td>
${com?`<td class="r72-r ${profit==null?'':profit<0?'r7-error':'r7-ok'}">${profit==null?'—':money(profit)+(pct!=null?' · '+pct+'%':'')}</td>`:''}
<td><select ${dis} onchange="r72Set('${k}','${l.id}','${svc?'tech':'logistic'}',this.value)">${r72Opt(owners,svc?l.tech:l.logistic,svc?'Sin técnico':'Sin logístico')}</select></td>
<td><span class="pill ${l.approved?'green':'orange'}">${l.approved?'Aprobado':'Nuevo'}</span>${svc?'':`<small class="sub">${esc(l.logisticTag||'Por cotizar')}</small>`}</td>
<td>${canDel?`<button type="button" class="r72-trash" title="Eliminar ítem" aria-label="Eliminar ítem" onclick="r72Remove('${k}','${l.id}')">${R72_TRASH}</button>`:''}</td></tr>`};
  const cols=com?13:9,svcs=box.lines.filter(l=>l.type==='servicio'),prods=box.lines.filter(l=>l.type==='producto');
  const add=type=>locked?'':`<tr class="r72-add"><td></td><td colspan="${cols-1}"><button type="button" onclick="r72AddLine('${k}','${type}')">＋ ${type==='servicio'?'Servicio':'Producto'}</button></td></tr>`;
  const group=(t,ls)=>`<tr class="r72-group"><td colspan="${cols}">${t} · ${ls.length}</td></tr>`;
  const sum=f=>r2(box.lines.reduce((a,l)=>a+(f(l)||0),0)),hh=r72Hours(box),totalKnown=box.lines.every(l=>l.price!=null&&l.price!=='');
  const totals=`<div class="r72-totals">${com?`<span>Subtotal <b>${money(sum(r72LineSubtotal))}</b></span><span>Descuentos <b>${money(sum(l=>+l.discount||0))}</b></span>`:''}<span>Total <b>${totalKnown?money(sum(r72LineTotal)):'Pendiente de cotizar'}</b></span>${com?`<span>Costo <b>${money(sum(r72LineCost))}</b></span><span>Rentabilidad <b>${money(sum(r72LineProfit))}${sum(r72LineTotal)?' · '+Math.round(sum(r72LineProfit)/sum(r72LineTotal)*100)+'%':''}</b></span>`:''}<span>H-H <b>${hh}</b></span></div>`;
  const bulk=sel.size&&!locked?`<div class="r6-bulk r72-bulk"><b>${sel.size} seleccionados</b><label>Asignar logístico<select id="r72-bulk-log">${r72Opt(r72Logistics().map(u=>[u.id,u.name]))}</select></label>${button('Aplicar a productos',`r72BulkLogistic('${k}')`,true)}<label>Asignar técnico<select id="r72-bulk-tech">${r72Opt(techOpts())}</select></label>${button('Aplicar a servicios',`r72BulkTech('${k}')`)}${button('Quitar selección',`R72.sel['${k}'].clear();r72Refresh()`)}</div>`:'';
  return `<div class="panel space r72-gridbox"><div class="row spread"><h3>${esc(opts.title||'Detalle')}</h3><span class="sub">${locked?'Bloqueado':'Escribe en «Ítem» para buscar por código o por cualquier palabra del nombre'}</span></div>${bulk}<div class="scroll"><table class="r72-grid"><thead><tr>${head}</tr></thead><tbody>${group('Servicios',svcs)}${svcs.map(row).join('')}${add('servicio')}${group('Productos',prods)}${prods.map(row).join('')}${add('producto')}</tbody></table></div>${totals}<p class="sub">Servicios: la cantidad son H-H y no cambia el precio final. Productos: cantidad × precio unitario. Un ítem nuevo deja la decisión del cliente en Pendiente hasta que caja la apruebe.</p></div>`;
}

/* --- buscador: coincide con cualquier parte del código o del nombre --- */
function r72Matches(q,type){const n=normal(q);return db.catalog.filter(c=>!c.deleted&&(!type||c.type===type)&&(!n||normal(r72CatLabel(c)).includes(n))).slice(0,12)}
function r72Suggest(input){const box=input.parentElement.querySelector('.r72-sug');if(!box)return;const items=r72Matches(input.value,input.dataset.type);box.innerHTML=items.map((c,i)=>`<button type="button" class="${i===0?'hl':''}" onmousedown="event.preventDefault();r72Pick('${input.dataset.k}','${input.dataset.l}','${c.id}')"><b>${esc(c.code||'—')}</b> - ${esc(c.name)}<small>${c.type==='servicio'?(c.hours??'—')+' H-H · ':''}${money(c.price)}${c.type==='producto'?(c.stock===false?' · sin stock':' · en stock'):''}</small></button>`).join('')||'<div class="sub r72-none">Sin coincidencias: se guardará como ítem externo</div>';box.hidden=false}
function r72SugHide(input){setTimeout(()=>{const b=input.parentElement?.querySelector('.r72-sug');if(b)b.hidden=true},160)}
function r72SugKey(e,input){const box=input.parentElement.querySelector('.r72-sug'),bs=[...box.querySelectorAll('button')];if(!bs.length)return;let i=bs.findIndex(b=>b.classList.contains('hl'));if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bs[i]?.classList.remove('hl');i=(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length;bs[i].classList.add('hl')}else if(e.key==='Enter'&&!box.hidden&&i>=0){e.preventDefault();bs[i].dispatchEvent(new MouseEvent('mousedown'))}else if(e.key==='Escape')box.hidden=true}

function r72Line(k,id){return r72Box(k)?.lines.find(l=>l.id===id)}
function r72Announce(k,l){ /* primera vez que el ítem tiene nombre: aprobación y logística */
  if(l.announced||!l.name)return;l.announced=true;const box=r72Box(k);
  if(k.startsWith('o:')){if(box.approval==='Aprobada'){box.approval='Pendiente';r7Log(box.id,'Reaprobación requerida','Se agregó «'+r72LineLabel(l)+'». La decisión del cliente volvió a Pendiente (No aprobado) hasta que caja lo confirme.')}r7Log(box.id,'Ítem agregado',l.type+': '+r72LineLabel(l)+' · por '+tech(actor))}
  else r72Log(k,'Ítem agregado',r72LineLabel(l));
  if(l.type==='producto'){l.logistic??=box.logistic||null;if(l.logistic)r72EnsureLogTask(k,'cotizar',l.logistic,[l.id],r72IsTech()&&k.startsWith('o:'))}
}
function r72Pick(k,id,catId){const l=r72Line(k,id),c=db.catalog.find(x=>x.id===catId);if(!l||!c)return;R72.picked={id,at:Date.now()};Object.assign(l,{code:c.code||'',name:c.name,type:c.type,catalog:c.id,external:false});if(c.type==='servicio'){l.hours=c.hours??l.hours??0;l.qty=l.hours;if(l.price==null||!l.priceTouched)l.price=c.price??null;l.cost??=0}else{l.qty=l.qty||1;l.price=c.price??null;l.cost=c.cost??null;l.stock=c.stock!==false;l.logisticTag=c.stock===false?'Por cotizar':'Cotizado'}r72Announce(k,l);r72AfterLine(k);r72Commit('Ítem seleccionado del catálogo',r72LineLabel(l))}
function r72SetName(k,id,value){const l=r72Line(k,id);if(!l)return;if(R72.picked?.id===id&&Date.now()-R72.picked.at<800)return; /* el input reemplazado dispara change al desaparecer */const v=value.trim(),hit=db.catalog.find(c=>normal(r72CatLabel(c))===normal(v)||normal(c.name)===normal(v));if(hit)return r72Pick(k,id,hit.id);l.name=v.replace(/^[A-Z]\d{3,5}\s*-\s*/,'');l.code='';l.catalog=null;l.external=!!v;r72Announce(k,l);r72Commit('Ítem externo',v)}
function r72Set(k,id,field,value){const l=r72Line(k,id),box=r72Box(k);if(!l)return;const n=v=>v===''?null:+v;
  if(field==='type'){l.type=value;if(value==='servicio'){l.hours=l.hours??l.qty??0;l.tech??=box.tech||null}else{l.qty=Math.max(1,Math.round(+l.qty||1));l.logistic??=box.logistic||null;l.logisticTag??='Por cotizar'}}
  else if(field==='hours'){const h=q4(n(value)||0);if(h!==(+value||0))toast('Las H-H avanzan en pasos de 0.25.');l.hours=h;l.qty=h}
  else if(field==='qty')l.qty=Math.max(0,n(value)||0);
  else if(field==='price'){l.price=n(value);l.priceTouched=true}
  else if(field==='cost'){if(!r72CanCost())return toast('El costo solo lo registra logística o el administrador.');l.cost=n(value);if(l.type==='producto'&&l.cost!=null&&(!l.logisticTag||l.logisticTag==='Por cotizar'))l.logisticTag='Cotizado'}
  else if(field==='discount')l.discount=Math.max(0,n(value)||0);
  else if(field==='tech')l.tech=value||null;
  else if(field==='logistic'){l.logistic=value||null;if(l.logistic&&l.name&&!['Comprado','Entregado','Conforme'].includes(l.logisticTag))r72EnsureLogTask(k,'cotizar',l.logistic,[l.id])}
  if(['hours','tech','type'].includes(field))r72AfterLine(k);
  r72Commit('Ítem actualizado',r72LineLabel(l)+' · '+field)}
function r72AddLine(k,type){const box=r72Box(k);if(r72BoxLocked(k))return toast('Este detalle está bloqueado.');const l={id:uid(),type,code:'',name:'',qty:type==='servicio'?0:1,hours:type==='servicio'?0:null,price:null,cost:type==='servicio'?0:null,discount:0,tech:type==='servicio'?(box.tech||null):null,logistic:type==='producto'?(box.logistic||null):null,approved:false,createdBy:actor,createdAt:new Date().toISOString(),logisticTag:type==='producto'?'Por cotizar':null};box.lines.push(l);R72.focus=l.id;r72Commit('Fila agregada',type)}
function r72Remove(k,id){const box=r72Box(k),i=box.lines.findIndex(l=>l.id===id);if(i<0)return;const l=box.lines[i];if(l.name&&!confirm('¿Eliminar «'+r72LineLabel(l)+'»? Queda registrado en la bitácora.'))return;box.lines.splice(i,1);if(k.startsWith('o:')){db.removedOrderLines.push({...l,order:box.id,removedAt:new Date().toISOString(),removedBy:actor});if(l.name)r7Log(box.id,'Ítem retirado',l.type+': '+r72LineLabel(l)+' · '+money(r72LineTotal(l)))}else if(l.name)r72Log(k,'Ítem retirado',r72LineLabel(l));R72.sel[k]?.delete(id);r72AfterLine(k);r72Commit('Ítem eliminado',r72LineLabel(l))}
function r72Toggle(k,id,on){const s=R72.sel[k]??=new Set();on?s.add(id):s.delete(id);r72Refresh()}
function r72BulkLogistic(k){const u=$('r72-bulk-log')?.value,box=r72Box(k),ids=[...(R72.sel[k]||[])].filter(id=>r72Line(k,id)?.type==='producto');if(!u||!ids.length)return toast('Selecciona productos y un logístico.');ids.forEach(id=>r72Line(k,id).logistic=u);const pend=ids.filter(id=>{const l=r72Line(k,id);return l.name&&!['Comprado','Entregado','Conforme'].includes(l.logisticTag)});if(pend.length)r72EnsureLogTask(k,'cotizar',u,pend);R72.sel[k].clear();r72Log(k,'Productos asignados',ids.length+' productos asignados a '+tech(u));r72Commit('Productos asignados a logística',box.code)}
function r72BulkTech(k){const u=$('r72-bulk-tech')?.value,ids=[...(R72.sel[k]||[])].filter(id=>r72Line(k,id)?.type==='servicio');if(!u||!ids.length)return toast('Selecciona servicios y un técnico.');ids.forEach(id=>r72Line(k,id).tech=u);R72.sel[k].clear();r72AfterLine(k);r72Commit('Servicios asignados',tech(u))}

/* --- duración del evento: al estirar o encoger, las H-H se reparten en proporción --- */
function r72SetDuration(k,value){const box=r72Box(k),target=q4(+value);if(!(target>0))return toast('La duración debe ser mayor que cero y en pasos de 0.25 h.');const svc=box.lines.filter(l=>l.type==='servicio'),sum=r72Hours(box);
  if(sum>0){let acc=0;const raw=svc.map(l=>(+l.hours||0)/sum*target);svc.forEach((l,i)=>{l.hours=Math.max(0,Math.floor(raw[i]*4)/4)});acc=r72Hours(box);let rest=Math.round((target-acc)*4);const order=svc.map((l,i)=>[raw[i]-l.hours,i]).sort((a,b)=>b[0]-a[0]);for(let j=0;rest>0;j=(j+1)%order.length,rest--)svc[order[j][1]].hours+=0.25;svc.forEach(l=>l.qty=l.hours);r72Log(k,'Duración ajustada','H-H totales '+sum+' → '+target+'; reparto proporcional: '+svc.map(l=>r72LineLabel(l)+' '+l.hours).join(', '))}
  else{box.durationH=target;r72Log(k,'Duración ajustada','Sin H-H asignadas: el evento se estira a '+target+' h')}
  r72AfterLine(k);r72Commit('Duración del evento',target+' h')}
function r72AfterLine(k){r72SyncBlocks(k);r72SyncEvent(k)}
