
/* --------------------------------------------------------------------------
   R7.7 · Finanzas: Flujo de caja diario, Comparativo (estado de resultados)
   y Movimientos de cuentas.
   - El flujo de caja se arma solo con lo que ya registra el sistema (cobros por
     cuenta, pagos de compras, ingresos y egresos sin comprobante) y se completa
     a mano en los rubros que no pasan por el sistema (luz, sueldos, tributos…).
   - Los traslados entre cuentas o cajas NO son ingreso ni egreso: el dinero solo
     cambia de lugar. Se muestran aparte.
   - Las filas se estiran solas: un rubro aparece cuando tiene movimiento.
   La estructura de rubros sigue la del flujo de caja de la empresa; no se copian
   montos ni nombres de terceros.
   -------------------------------------------------------------------------- */
const R77F={open:new Set(),all:false,edit:false,ym:'',f:{from:'',to:'',acc:''}};
const R77_FCG=[
 {id:'gadm',name:'Gastos administrativos',pl:'adm',items:['ITF','Comisiones bancarias','Comisiones por ventas','Artículos de escritorio','Asesoramiento','Combustible','Registros públicos','Regalo a clientes','Caja chica','Insumos para el taller','Otros no especificados']},
 {id:'gser',name:'Gasto de servicios',pl:'serv',items:['Agua','Luz','Telefonía móvil','Internet','Alarma y seguridad','Publicidad']},
 {id:'galq',name:'Alquileres y servicios contratados',pl:'adm',items:['Alquiler de local','Alquiler de equipos y vehículos','Contabilidad','Abogados','Mantenimiento de sede','Limpieza y detergentes']},
 {id:'gsue',name:'Sueldos',pl:'adm',items:[],dyn:'users'},
 {id:'gtri',name:'Aportes, tributos y contraprestaciones',pl:'trib',items:['Impuesto IGV','Renta MYPE','EsSalud','AFP','ONP','Renta de 4ta categoría','Renta de 5ta categoría']},
 {id:'gprov',name:'Pago a proveedores (costo de servicio)',pl:'costo',items:['Otros proveedores'],dyn:'suppliers'}];
const R77_FIN=[['fprest','Préstamos recibidos',1],['famor','Amortización de cuotas',-1],['fint','Intereses del préstamo',-1],['fotro','Otros ingresos financieros',1]];
const r77Slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
function r77Fc(){const d=r77Db();d.fc??={manual:{},custom:[],open:{},tasaPart:0,tasaRenta:29.5,items:{}};const f=d.fc;f.manual??={};f.custom??=[];f.open??={};f.tasaRenta??=29.5;f.tasaPart??=0;f.ingNames??={};return f}
/* rubros de egreso: [{id,name,group,pl,auto}] */
function r77FcRubros(){const f=r77Fc(),out=[];R77_FCG.forEach(g=>{let it=g.items.map(n=>({id:g.id+'.'+r77Slug(n),name:n}));
    if(g.dyn==='users')it=db.users.filter(u=>u.active&&!u.external).map(u=>({id:'gsue.u_'+u.id,name:u.name}));
    if(g.dyn==='suppliers')it=[...db.suppliers.filter(s=>!s.deleted).map(s=>({id:'gprov.s_'+s.id,name:s.name,auto:'prov',sid:s.id})),...it];
    f.custom.filter(c=>c.group===g.id).forEach(c=>it.push({id:c.id,name:c.name,custom:true}));if(g.id==='gprov')it.sort((x,y)=>x.name.localeCompare(y.name,'es'));it.forEach(i=>out.push({...i,group:g.id,pl:g.pl}))});return out}
const r77FcGroupName=id=>(R77_FCG.find(g=>g.id===id)||{}).name||id;
const r77FcRubroName=id=>{if(id.startsWith('ing.x_'))return (r77Fc().ingNames||{})[id]||id;const r=r77FcRubros().find(x=>x.id===id);if(r)return r.name;const f=R77_FIN.find(x=>x[0]===id);return f?f[1]:id==='ing.otros'?'Otros ingresos':id==='ing.gravados'?'Otros ingresos gravados':id==='desc'?'Descuentos y rebajas concedidas':id};
const r77Day=iso=>{const d=new Date(iso);return isNaN(d)?String(iso).slice(0,10):d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const r77Dim=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m,0).getDate()};
/* todo lo que mueve el dinero en un mes, por día: cada movimiento es una línea con su concepto y su monto */
const r77Sum=l=>r2((l||[]).reduce((a,e)=>a+(+e.amount||0),0));
function r77FcEntries(){const f=r77Fc();f.entries??=[];if(f.manual&&Object.keys(f.manual).length){Object.entries(f.manual).forEach(([d,o])=>Object.entries(o).forEach(([k,v])=>f.entries.push({id:uid(),date:d,rubro:k,concept:'Registro manual',amount:+v||0})));f.manual={}}return f.entries}
function r77FcData(ym){const days=r77Dim(ym),D={};const dk=i=>ym+'-'+String(i).padStart(2,'0');for(let i=1;i<=days;i++)D[dk(i)]={ing:{},otros:[],otrosGrav:[],egr:{},fin:{},desc:[],tras:[]};
  const inM=d=>d&&d.slice(0,7)===ym&&D[d],push=(o,k,e)=>{(o[k]??=[]).push(e)};
  db.payments.forEach(p=>{const d=r77Day(p.date);if(!inM(d))return;push(D[d].ing,p.account||'sin',{concept:p.ref||('Cobro'+(p.method?' · '+p.method:'')),amount:+p.amount||0})});
  db.purchaseInvoices.forEach(inv=>(inv.payments||[]).forEach(p=>{const d=r77Day(p.date);if(!inM(d))return;push(D[d].egr,'gprov.s_'+inv.supplier,{concept:'Pago '+(inv.docType||'Factura')+' Compra #'+(inv.code||''),amount:+p.amount||0})}));
  (db.r77mov||[]).forEach(m=>{const d=String(m.date||'').slice(0,10);if(!inM(d))return;if(m.transfer){if(m.type==='Egreso')D[d].tras.push({from:m.account,to:m.dest,amount:m.amount,concept:m.concept});return}
    const e={concept:m.concept+(m.party?' · '+m.party:''),amount:+m.amount||0};
    if(m.type==='Ingreso'){const k=m.rubro||'ing.otros';if(k==='ing.gravados')D[d].otrosGrav.push(e);else if(R77_FIN.some(x=>x[0]===k))push(D[d].fin,k,e);else D[d].otros.push(e)}
    else{const k=m.rubro||'gadm.otros_no_especificados';if(R77_FIN.some(x=>x[0]===k))push(D[d].fin,k,e);else push(D[d].egr,k,e)}});
  (db.r73mov||[]).forEach(m=>{const d=r77Day(m.date);if(!inM(d))return;const e={concept:(m.detail||'')+(m.contact?' · '+m.contact:''),amount:+m.amount||0};if(m.type==='Ingreso')D[d].otros.push(e);else push(D[d].egr,m.supplier?'gprov.s_'+m.supplier:'gadm.otros_no_especificados',e)});
  r77FcEntries().forEach(m=>{const d=m.date;if(!inM(d))return;const e={concept:m.concept||'',amount:+m.amount||0,id:m.id,manual:true},k=m.rubro;if(k==='desc')D[d].desc.push(e);else if(R77_FIN.some(x=>x[0]===k))push(D[d].fin,k,e);else if(k==='ing.otros')D[d].otros.push(e);else if(k==='ing.gravados')D[d].otrosGrav.push(e);else if(k.startsWith('ing.x_'))push(D[d].ing,k,e);else push(D[d].egr,k,e)});
  return D}
/* captura a mano: cada línea lleva su concepto y su monto; las del sistema no se tocan */
const r77FcCanEdit=()=>['A','E'].includes(r77Lv('flujo'));
function r77FcAdd(date,k,amount,concept){if(!r77FcCanEdit())return toast('Tu rol solo puede ver el flujo de caja.');const n=parseFloat(String(amount).replace(',','.'));if(!isFinite(n)||n<=0)return toast('Escribe un monto mayor que 0.');r77FcEntries().push({id:uid(),date,rubro:k,concept:String(concept||'').trim()||'Registro manual',amount:r2(n)});R73.lastText='Flujo de caja: '+r77FcRubroName(k)+' '+date;save('Flujo de caja',r77FcRubroName(k)+' · '+date)}
function r77FcEdit(id,field,v){if(!r77FcCanEdit())return;const L=r77FcEntries(),e=L.find(x=>x.id===id);if(!e)return;if(field==='amount'){const n=parseFloat(String(v).replace(',','.'));if(!isFinite(n)||n<=0)L.splice(L.indexOf(e),1);else e.amount=r2(n)}else e.concept=String(v).trim();R73.lastText='Flujo de caja editado';save('Flujo de caja editado',e.concept||'');r77FcModalRefresh()}
function r77FcAddRubro(){const gs=R77_FCG.filter(g=>!g.dyn||g.id==='gprov');form('Agregar rubro al flujo de caja',select('group','Grupo',gs.map(g=>[g.id,g.name]),'gadm')+field('name','Nombre del rubro','','text','required'),d=>{const f=r77Fc();if(f.custom.some(c=>c.group===d.group&&normal(c.name)===normal(d.name)))throw Error('Ya existe ese rubro.');f.custom.push({id:d.group+'.c_'+r77Slug(d.name),group:d.group,name:d.name.trim()});R77F.open.add(d.group);R73.lastText='Rubro agregado: '+d.name;save('Rubro del flujo de caja',d.name)})}
const r77FcYm=()=>R77F.ym||(r74Iso(r74Now()).slice(0,7));
function r77FcMonth(v){R77F.ym=v||r77FcYm();render()}
function r77FcShift(n){const [y,m]=r77FcYm().split('-').map(Number),d=new Date(y,m-1+n,1);R77F.ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');render()}
function r77FcToggle(g){R77F.open.has(g)?R77F.open.delete(g):R77F.open.add(g);render()}
/* saldo de apertura de un mes: manual, o el saldo final del mes anterior */
function r77FcOpening(ym){const f=r77Fc();if(f.opening&&f.opening[ym]!=null)return f.opening[ym];const first=r77FcEntries().map(e=>e.date).concat((db.payments||[]).map(p=>r77Day(p.date))).sort()[0];const [y,m]=ym.split('-').map(Number),pm=new Date(y,m-2,1),pk=pm.getFullYear()+'-'+String(pm.getMonth()+1).padStart(2,'0');
  if(!first||first.slice(0,7)>=ym)return f.opening?.base??0;return r77FcClose(pk)}
function r77FcClose(ym){const D=r77FcData(ym);let s=r77FcOpening(ym);Object.keys(D).sort().forEach(d=>{const t=r77FcTotals(D[d]);s=r2(s+t.ing-t.egr+t.fin)});return s}
function r77FcTotals(day){const ing=Object.values(day.ing).reduce((a,l)=>a+r77Sum(l),0)+r77Sum(day.otros)+r77Sum(day.otrosGrav),egr=Object.values(day.egr).reduce((a,l)=>a+r77Sum(l),0),fin=R77_FIN.reduce((a,[k,,sg])=>a+sg*r77Sum(day.fin[k]),0);return {ing:r2(ing),egr:r2(egr),fin:r2(fin)}}
function r77FcOpenSet(v){const f=r77Fc(),ym=r77FcYm(),n=parseFloat(v);f.opening??={};if(v===''||!isFinite(n))delete f.opening[ym];else f.opening[ym]=r2(n);R73.lastText='Saldo inicial del mes guardado';save('Flujo de caja: saldo inicial',ym)}
/* lista de movimientos de un rubro en un día (la usa la celda y su ventana de detalle) */
function r77FcList(D,key){if(key.startsWith('acc:'))return D.ing[key.slice(4)]||[];if(key==='ing.otros')return D.otros;if(key==='ing.gravados')return D.otrosGrav;if(key==='desc')return D.desc;if(key.startsWith('ing.x_'))return D.ing[key]||[];if(R77_FIN.some(x=>x[0]===key))return D.fin[key]||[];return D.egr[key]||[]}
const r77FcBank=id=>db.bankAccounts.find(a=>a.id===id)?.name||'Sin cuenta';
const r77FcKeyName=key=>key.startsWith('acc:')?'Cobros · '+r77FcBank(key.slice(4)):r77FcRubroName(key);
/* una sola fila por rubro o proveedor: el día muestra el total y, si hay más de un pago, «Pago de n facturas» (clic para ver el detalle) */
views.flujo=()=>{const ym=r77FcYm(),D=r77FcData(ym),f=r77Fc(),keys=Object.keys(D).sort(),days=keys.length,rub=r77FcRubros(),cols=2*days+2,fmt=n=>n?(n<0?'-':'')+Math.abs(n).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}):'',adm=r72Role()==='Administrador';
  const hdr=`<tr><th class="r77-fcl" rowspan="2">Día</th>${keys.map(d=>`<th colspan="2" class="r77-fcd">${+d.slice(8)}</th>`).join('')}<th rowspan="2">Total</th></tr><tr>${keys.map(()=>'<th class="r77-fcc">Concepto</th><th>Monto</th>').join('')}</tr>`;
  const row=(label,lists,key,cls='')=>{const tot=r2(lists.reduce((a,l)=>a+r77Sum(l),0));return `<tr class="${cls}"><th class="r77-fcl">${label}</th>${keys.map((d,j)=>{const L=lists[j]||[],n=L.length,k=key?' r77-fck':'',oc=key?` onclick="r77FcOpen('${key}','${d}')" title="Ver el detalle o agregar un pago"`:'';
      if(!n)return `<td class="r77-fcc${k}"${oc}></td><td class="r77-fcn${k}"${oc}></td>`;
      const txt=n===1?esc(L[0].concept):(key&&key.startsWith('gprov')?`Pago de ${n} facturas ▾`:`${n} movimientos ▾`);
      return `<td class="r77-fcc${k}"${oc}>${txt}</td><td class="r77-fcn${k}"${oc}>${fmt(r77Sum(L))}</td>`}).join('')}<td class="r77-fcn"><b>${fmt(tot)}</b></td></tr>`};
  const sumRow=(label,vals,cls)=>`<tr class="${cls}"><th class="r77-fcl">${label}</th>${vals.map(v=>`<td class="r77-fcc"></td><td class="r77-fcn">${fmt(v)}</td>`).join('')}<td class="r77-fcn"><b>${fmt(r2(vals.reduce((a,b)=>a+b,0)))}</b></td></tr>`;
  const sect=t=>`<tr class="r77-fcs"><th class="r77-fcl">${t}</th><td colspan="${cols-1}"></td></tr>`;
  const accs=[...new Set(keys.flatMap(d=>Object.keys(D[d].ing)))].sort();
  let h=sect('INGRESOS');
  accs.forEach(a=>{h+=row(a.startsWith('ing.x_')?esc(r77FcRubroName(a)):'Cobros · '+esc(r77FcBank(a)),keys.map(d=>D[d].ing[a]||[]),a.startsWith('ing.x_')?a:'acc:'+a)});
  h+=row('Otros ingresos',keys.map(d=>D[d].otros),'ing.otros');h+=row('Otros ingresos gravados',keys.map(d=>D[d].otrosGrav),'ing.gravados');
  h+=sumRow('TOTAL INGRESOS',keys.map(d=>r77FcTotals(D[d]).ing),'r77-fct');
  h+=sect('EGRESOS');
  R77_FCG.filter(g=>g.id!=='gsue'||f.showSue).forEach(g=>{const items=rub.filter(r=>r.group===g.id),open=R77F.open.has(g.id),lists=items.map(r=>keys.map(d=>D[d].egr[r.id]||[])),gt=keys.map((d,i)=>r2(lists.reduce((a,l)=>a+r77Sum(l[i]),0)));
    h+=`<tr class="r77-fcg"><th class="r77-fcl"><button type="button" onclick="r77FcToggle('${g.id}')" aria-label="Expandir o contraer">${open?'▾':'▸'}</button> ${esc(g.name)}</th>${gt.map(v=>`<td class="r77-fcc"></td><td class="r77-fcn">${fmt(v)}</td>`).join('')}<td class="r77-fcn"><b>${fmt(r2(gt.reduce((a,b)=>a+b,0)))}</b></td></tr>`;
    items.forEach((r,i)=>{const used=lists[i].some(l=>l.length);if(R77F.all||used||open)h+=row(esc(r.name),lists[i],r.id,'r77-fci2')})});
  const egrT=keys.map(d=>{const t=r77FcTotals(D[d]);return t.egr});
  h+=sumRow('TOTAL EGRESOS',egrT,'r77-fct');
  h+=sect('FINANCIAMIENTO');R77_FIN.forEach(([k,n])=>{h+=row(n,keys.map(d=>D[d].fin[k]||[]),k)});h+=sumRow('TOTAL FINANCIAMIENTO',keys.map(d=>r77FcTotals(D[d]).fin),'r77-fct');
  const op=r77FcOpening(ym);let s=op;const sal=keys.map(d=>{const t=r77FcTotals(D[d]);s=r2(s+t.ing-t.egr+t.fin);return s}),ini=keys.map((d,i)=>i===0?op:sal[i-1]);
  const top=`<tr class="r77-fct"><th class="r77-fcl">SALDO INICIAL</th>${ini.map(v=>`<td class="r77-fcc"></td><td class="r77-fcn">${fmt(v)}</td>`).join('')}<td></td></tr>`+row('Descuentos y rebajas concedidas',keys.map(d=>D[d].desc),'desc','r77-fci2');
  const fin=`<tr class="r77-fct r77-fcsal"><th class="r77-fcl">SALDO ESTIMADO DE CAJA</th>${sal.map(v=>`<td class="r77-fcc"></td><td class="r77-fcn">${fmt(v)}</td>`).join('')}<td class="r77-fcn"><b>${fmt(sal.at(-1))}</b></td></tr>`;
  const tr=keys.flatMap(d=>D[d].tras.map(t=>({d,...t})));
  const trh=tr.length?`<div class="panel"><h3>Traslados entre cuentas o cajas (no son ingreso ni egreso)</h3>${table(['Fecha','De','A','Monto','Concepto'],tr.map(t=>[t.d,esc(r77FcBank(t.from)),esc(r77FcBank(t.to)),money(t.amount),esc(t.concept)]))}</div>`:'';
  const [yy,mm]=ym.split('-'),mes=new Date(+yy,+mm-1,1).toLocaleDateString('es-PE',{month:'long',year:'numeric'});
  return heading('Flujo de caja','Cada día tiene dos columnas: el concepto y el monto. Hay una sola fila por proveedor o rubro; haz clic en un día para ver el detalle de sus pagos o agregar más.',(adm?button('⬆ Cargar flujo desde Excel','r77FcxOpen()'):'')+button('+ Rubro','r77FcAddRubro()')+button('Comparativo','go(\'comparativo\')'))+`<div class="panel r77-fcbar"><div class="row"><button type="button" onclick="r77FcShift(-1)" aria-label="Mes anterior">‹</button><input type="month" value="${ym}" onchange="r77FcMonth(this.value)" aria-label="Mes"><button type="button" onclick="r77FcShift(1)" aria-label="Mes siguiente">›</button><b style="text-transform:capitalize">${esc(mes)}</b><label class="r72-inl"><input type="checkbox" ${R77F.all?'checked':''} onchange="R77F.all=this.checked;render()"> Mostrar todos los rubros</label>${adm?`<label class="r72-inl"><input type="checkbox" ${f.showSue?'checked':''} onchange="r77FcSue(this.checked)"> Mostrar sueldos (oculto por ahora)</label>`:''}<label>Saldo inicial del mes <input type="number" step="0.01" class="r77-fci" style="width:120px" value="${(f.opening&&f.opening[ym]!=null)?f.opening[ym]:op}" onchange="r77FcOpenSet(this.value)"></label></div></div>
  <div class="r77-fcwrap"><table class="r77-fc"><thead>${hdr}</thead><tbody>${top}${h}${fin}</tbody></table></div>${trh}<p class="sub">Lo que ya registra el sistema (cobros, pagos de facturas de compra, ingresos y egresos con rubro) entra solo en la fila del proveedor o rubro y su día; no se edita aquí. Lo que agregues a mano en el detalle sí se puede corregir.</p>`};
function r77FcSue(v){r77Fc().showSue=!!v;save('Flujo de caja','Sueldos '+(v?'visibles':'ocultos'))}
/* ventana de detalle de un rubro en un día: lista de pagos, total y agregar más */
const R77FM={key:'',date:''};
function r77FcModalHtml(){const {key,date}=R77FM,D=r77FcData(date.slice(0,7))[date],L=r77FcList(D,key),sys=key.startsWith('acc:')||!r77FcCanEdit(),nm=r77FcKeyName(key),dt=new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'});
  const rows=L.map(e=>e.manual&&!sys?`<tr><td><input class="r77-fci r77-fcix" value="${esc(e.concept)}" onchange="r77FcEdit('${e.id}','concept',this.value)" aria-label="Concepto"></td><td><input class="r77-fci" type="number" step="0.01" min="0" value="${e.amount}" onchange="r77FcEdit('${e.id}','amount',this.value)" aria-label="Monto"></td><td><span class="pill">Manual</span></td><td><button type="button" onclick="r77FcDel('${e.id}')" aria-label="Quitar este pago" title="Quitar">✕</button></td></tr>`:`<tr><td>${esc(e.concept)}</td><td class="r77-fcn">${money(e.amount)}</td><td><span class="pill green">Sistema</span></td><td></td></tr>`).join('');
  return `<h2>${esc(nm)} · ${esc(dt)}</h2><div class="r77-fcm"><table class="r77-fcmt"><thead><tr><th>Concepto</th><th>Monto</th><th>Origen</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="sub">Todavía no hay pagos este día.</td></tr>'}</tbody><tfoot><tr><th>Total</th><th class="r77-fcn" id="r77fcmt">${money(r77Sum(L))}</th><th></th><th></th></tr></tfoot></table>
  ${sys?'<p class="sub">'+(key.startsWith('acc:')?'Estos cobros vienen de las notas de venta y órdenes; se corrigen allí.':'Tu rol solo puede ver el flujo.')+'</p>':`<div class="r77-fcma"><b>Agregar un pago</b><input class="r77-fci r77-fcix" id="r77fcm-c" placeholder="Concepto (ej. Pago Factura Compra #…)" aria-label="Concepto nuevo"><input class="r77-fci" type="number" step="0.01" min="0" id="r77fcm-a" placeholder="Monto" aria-label="Monto nuevo"><button type="button" class="primary" onclick="r77FcModalAdd()">+ Agregar</button></div>`}
  <footer>${button('Cerrar','closeModal()')}</footer></div>`}
function r77FcOpen(key,date){R77FM.key=key;R77FM.date=date;modal(r77FcModalHtml())}
function r77FcModalRefresh(){const m=$('modalbody');if($('modal').open&&R77FM.key)m.innerHTML=r77FcModalHtml()}
function r77FcModalAdd(){const c=document.getElementById('r77fcm-c'),a=document.getElementById('r77fcm-a');if(!a||a.value==='')return toast('Escribe el monto.');const n=parseFloat(String(a.value).replace(',','.'));if(!isFinite(n)||n<=0)return toast('Escribe un monto mayor que 0.');r77FcAdd(R77FM.date,R77FM.key,a.value,c&&c.value);r77FcModalRefresh()}
function r77FcDel(id){if(!r77FcCanEdit())return;const L=r77FcEntries(),i=L.findIndex(x=>x.id===id);if(i<0)return;L.splice(i,1);R73.lastText='Flujo de caja: pago quitado';save('Flujo de caja','Pago quitado');r77FcModalRefresh()}
/* ---------- comparativo (estado de resultados por mes) ---------- */
function r77FcMonthPL(ym){const D=r77FcData(ym),rub=r77FcRubros(),pl={};rub.forEach(r=>pl[r.id]=r.pl);let ventas=0,desc=0,costo=0,adm=0,serv=0,trib=0,fing=0,fgas=0,grav=0,otros=0;
  Object.values(D).forEach(d=>{ventas+=Object.values(d.ing).reduce((a,l)=>a+r77Sum(l),0);desc+=r77Sum(d.desc);otros+=r77Sum(d.otros);grav+=r77Sum(d.otrosGrav);fing+=r77Sum(d.fin.fotro);fgas+=r77Sum(d.fin.fint);Object.entries(d.egr).forEach(([k,l])=>{const v=r77Sum(l),c=pl[k]||(k.startsWith('gprov')?'costo':k.startsWith('gser')?'serv':k.startsWith('gtri')?'trib':'adm');if(c==='costo')costo+=v;else if(c==='serv')serv+=v;else if(c==='trib')trib+=v;else adm+=v})});
  const f=r77Fc(),neta=ventas-desc,bruta=neta-costo,gop=adm+serv+trib,oper=bruta-gop,uai=oper+otros+fing-fgas+grav,part=Math.max(0,uai)*f.tasaPart/100,renta=Math.max(0,uai-part)*f.tasaRenta/100;
  return {ventas,desc,neta,costo,bruta,adm,serv,trib,gop,oper,otros,fing,fgas,grav,uai,part,renta,util:uai-part-renta}}
function r77FcCmp(){R77F.f.from=document.getElementById('r77cf')?.value||'';R77F.f.to=document.getElementById('r77ct')?.value||'';render()}
function r77FcRates(){const f=r77Fc(),a=parseFloat(document.getElementById('r77tp')?.value),b=parseFloat(document.getElementById('r77tr')?.value);if(isFinite(a)&&a>=0)f.tasaPart=a;if(isFinite(b)&&b>=0)f.tasaRenta=b;R73.lastText='Comparativo: tasas guardadas';save('Comparativo: tasas','')}
views.comparativo=()=>{const y=(R77F.f.from||r77FcYm()).slice(0,4),from=R77F.f.from||y+'-01',to=R77F.f.to||y+'-12',months=[];let [cy,cm]=from.split('-').map(Number);const [ty,tm]=to.split('-').map(Number);while((cy<ty||(cy===ty&&cm<=tm))&&months.length<24){months.push(cy+'-'+String(cm).padStart(2,'0'));cm++;if(cm>12){cm=1;cy++}}
  const P=months.map(r77FcMonthPL),tot=P.reduce((a,p)=>{Object.keys(p).forEach(k=>a[k]=(a[k]||0)+p[k]);return a},{}),f=r77Fc();
  const L=[['VENTAS','ventas',1],['DESC., REBAJAS Y BONIF. CONCEDIDAS','desc'],['VENTAS NETAS','neta',1],['COSTO DE VENTAS (pago a proveedores)','costo'],['UTILIDAD BRUTA','bruta',1],['GASTOS DE OPERACIÓN','gop',1],['  Gastos administrativos (incluye sueldos y alquileres)','adm'],['  Gastos de servicios','serv'],['  Gastos de tributos','trib'],['UTILIDAD OPERATIVA','oper',1],['OTROS INGRESOS Y GASTOS','','h'],['  Otros ingresos (sin comprobante)','otros'],['  Ingresos financieros','fing'],['  Gastos financieros (intereses)','fgas'],['  Otros ingresos gravados','grav'],['UTILIDAD ANTES DE IMPUESTOS','uai',1],['PARTICIPACIÓN DE TRABAJADORES','part'],['IMPUESTO A LA RENTA','renta'],['UTILIDAD NETA DEL EJERCICIO','util',1]];
  const pc=(v,b)=>b?(Math.round(v/b*1000)/10).toFixed(1)+' %':'—',mname=m=>new Date(+m.slice(0,4),+m.slice(5)-1,1).toLocaleDateString('es-PE',{month:'short'}).toUpperCase();
  const body=L.map(([lb,k,b])=>b==='h'?`<tr class="r77-fcs"><th class="r77-fcl" colspan="${months.length*2+3}">${lb}</th></tr>`:`<tr class="${b?'r77-fct':''}"><th class="r77-fcl">${esc(lb)}</th>${P.map(p=>`<td class="r77-fcn">${money(p[k]||0)}</td><td class="r77-fcn sub">${pc(p[k]||0,p.ventas)}</td>`).join('')}<td class="r77-fcn"><b>${money(tot[k]||0)}</b></td><td class="r77-fcn sub">${pc(tot[k]||0,tot.ventas)}</td></tr>`).join('');
  return heading('Comparativo (estado de resultados)','Compara mes a mes lo que vendiste, lo que gastaste y lo que quedó, en soles y como % de las ventas.',button('Flujo de caja',"go('flujo')"))+`<div class="panel r77-fcbar"><div class="row"><label>Desde <input type="month" id="r77cf" value="${from}"></label><label>Hasta <input type="month" id="r77ct" value="${to}"></label>${button('Filtrar','r77FcCmp()',true)}<label>Participación de trabajadores (%) <input id="r77tp" type="number" step="0.1" min="0" value="${f.tasaPart}" style="width:90px"></label><label>Impuesto a la renta (%) <input id="r77tr" type="number" step="0.1" min="0" value="${f.tasaRenta}" style="width:90px"></label>${button('Guardar tasas','r77FcRates()')}</div></div>
  <div class="r77-fcwrap"><table class="r77-fc"><thead><tr><th class="r77-fcl">Concepto</th>${months.map(m=>`<th colspan="2">${mname(m)} ${m.slice(0,4)}</th>`).join('')}<th colspan="2">TOTAL</th></tr><tr><th class="r77-fcl"></th>${months.map(()=>'<th>S/</th><th>%</th>').join('')}<th>S/</th><th>%</th></tr></thead><tbody>${body}</tbody></table></div><p class="sub">Ventas = cobros registrados en las cuentas. Costo de ventas = pagos a proveedores. Los tributos y gastos que no pasan por el sistema se anotan a mano en el flujo de caja.</p>`};
/* ---------- el movimiento sin comprobante elige su rubro y distingue «traslado» ---------- */
const r77MovKindB=r77MovKind;
r77MovKind=function(sel){r77MovKindB(sel);try{const f=sel.closest('form'),lab=f.querySelector('.r77-rubro'),s=lab?.querySelector('select');if(!s)return;const kind=sel.value;lab.hidden=kind==='Transferencia';s.innerHTML=r77RubroOpts(kind)}catch{}};
function r77RubroOpts(kind){const o=(id,n)=>`<option value="${id}">${esc(n)}</option>`;if(kind==='Ingreso')return o('ing.otros','Otros ingresos')+o('ing.gravados','Otros ingresos gravados')+R77_FIN.filter(x=>x[2]>0).map(x=>o(x[0],x[1])).join('');
  return R77_FCG.filter(g=>g.dyn!=='users').map(g=>`<optgroup label="${esc(g.name)}">${r77FcRubros().filter(r=>r.group===g.id).map(r=>o(r.id,r.name)).join('')}</optgroup>`).join('')+`<optgroup label="Financiamiento">${R77_FIN.filter(x=>x[2]<0).map(x=>o(x[0],x[1])).join('')}</optgroup>`+(r77Fc().showSue?`<optgroup label="Sueldos">${r77FcRubros().filter(r=>r.group==='gsue').map(r=>o(r.id,r.name)).join('')}</optgroup>`:'')}
const r77MovNewB=r77MovNew;
r77MovNew=function(type){r77MovNewB(type);try{const f=$('editor');if(!f||f.querySelector('.r77-rubro'))return;const k=f.querySelector('[name=kind]');k.querySelectorAll('option').forEach(op=>{op.textContent={Ingreso:'Ingreso real (entra dinero al negocio)',Egreso:'Egreso real (sale dinero del negocio)',Transferencia:'Traslado entre cuentas o cajas (el dinero solo cambia de lugar)'}[op.value]||op.textContent});
  f.querySelector('[data-r77lab=concept]').insertAdjacentHTML('afterend',`<label class="r77-rubro" ${type==='Transferencia'?'hidden':''}>Rubro del flujo de caja<select name="rubro">${r77RubroOpts(type==='Ingreso'?'Ingreso':'Egreso')}</select></label>`);
  }catch(err){console.warn('r77 rubro',err)}};
/* ---------- menú ---------- */
(function(){R75_MODS.flujo=['≋','Flujo de caja'];R75_MODS.comparativo=['⇆','Comparativo (estado de resultados)'];const f=R75_NAV.find(n=>n.sec==='Finanzas');if(f)['bancos','flujo','comparativo'].forEach((i,k)=>{if(!f.items.includes(i))f.items.splice(k,0,i)});r75Rebuild()})();
