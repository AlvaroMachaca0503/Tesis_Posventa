
/* --------------------------------------------------------------------------
   R7.7 · Flujo de caja: carga desde el Excel del flujo diario (una hoja por mes).
   - Se lee en el navegador (el archivo no sale de la computadora ni queda
     guardado en la carpeta del proyecto: solo se guarda lo que se aplica).
   - Carga SOLO los ingresos (efectivo e Interbank por sede) y los pagos a
     proveedores; sueldos y demás egresos no se cargan por ahora.
   - Cada proveedor es UNA fila; cada pago queda como línea con su concepto en
     el día que corresponde. Si el proveedor ya existe en el sistema se usa el
     mismo; si no, se crea como rubro propio del flujo.
   - Volver a cargar el mismo archivo reemplaza lo cargado antes (no duplica).
   -------------------------------------------------------------------------- */
const R77FX={plan:null,busy:false};
const R77FX_MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','septiembre','octubre','noviembre','diciembre'];
const r77FxName=s=>String(s??'').replace(/\s+/g,' ').trim(),r77FxKey=s=>normal(r77FxName(s));
const r77FxDate=v=>{if(typeof v==='number'&&v>30000&&v<80000)return new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5).toISOString().slice(0,10);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v??''));return m?m[0]:''};
/* hojas por mes → ingresos y pagos a proveedores */
function r77FxParse(S){const out={ing:[],prov:[],hojas:[]};
  Object.entries(S).forEach(([k,rows])=>{if(!R77FX_MES.some(m=>k.startsWith(m+'_')))return;const hi=rows.findIndex(r=>r&&normal(r[0])==='fecha');if(hi<0)return;
    const dc=[];rows[hi].forEach((v,j)=>{if(j>0){const d=r77FxDate(v);if(d)dc.push([j,d])}});if(!dc.length)return;out.hojas.push(k);let st='';
    for(let i=hi+1;i<rows.length;i++){const r=rows[i]||[],a=r77FxName(r[0]),n=normal(a);if(!a)continue;
      if(n.startsWith('ingresos (detallar')){st='ing';continue}if(n.startsWith('total ingresos')){st='';continue}if(n.startsWith('pago proveedores')){st='prov';continue}
      if(n.startsWith('compra de activos')||n.startsWith('total egresos')){if(st==='prov')st='';continue}
      if(st==='ing'&&n.startsWith('ingreso'))dc.forEach(([j,d])=>{const v=r77Num(r[j])??r77Num(r[j+1]);if(v>0)out.ing.push({date:d,name:a,amount:v})});
      else if(st==='prov')dc.forEach(([j,d])=>{const v=r77Num(r[j+1]);if(v>0)out.prov.push({date:d,name:a,concept:r77Str(r[j])||'Pago a proveedor',amount:v})})}});
  return out}
function r77FxPlan(P){const sup={};db.suppliers.filter(s=>!s.deleted).forEach(s=>sup[r77FxKey(s.name)]=s);const provs={},months={};
  const mo=d=>months[d.slice(0,7)]??={ing:0,prov:0,ni:0,np:0};
  P.ing.forEach(e=>{const m=mo(e.date);m.ing+=e.amount;m.ni++});
  P.prov.forEach(e=>{const m=mo(e.date),k=r77FxKey(e.name);m.prov+=e.amount;m.np++;const o=provs[k]??={name:r77FxName(e.name),sup:sup[k]||null,n:0,tot:0};o.n++;o.tot+=e.amount});
  const ings={};P.ing.forEach(e=>{ings[r77FxKey(e.name)]=r77FxName(e.name)});
  return {P,provs,months,ings,nProv:Object.keys(provs).length,nSys:Object.values(provs).filter(x=>x.sup).length}}
function r77FxMonthName(ym){return new Date(+ym.slice(0,4),+ym.slice(5)-1,1).toLocaleDateString('es-PE',{month:'long',year:'numeric'})}
function r77FcxOpen(){if(r72Role()!=='Administrador')return toast('Solo el superusuario carga el flujo desde Excel.');R77FX.plan=null;
  modal(`<h2>Cargar flujo de caja desde Excel</h2><div class="r77-fcx"><p class="sub">Elige el archivo del flujo diario (una hoja por mes). Se cargan los <b>ingresos</b> y los <b>pagos a proveedores</b>; los sueldos y los demás egresos no se cargan por ahora. Antes de aplicar verás un resumen. Si vuelves a cargar el mismo archivo, reemplaza lo cargado antes (no duplica).</p><input type="file" accept=".xlsx" onchange="r77FcxPick(this)" aria-label="Archivo de flujo de caja"><div id="r77fcx"></div></div>`)}
async function r77FcxPick(inp){const box=document.getElementById('r77fcx'),f=inp.files&&inp.files[0];if(!f||!box)return;box.innerHTML='<p class="sub">Leyendo el archivo…</p>';
  try{const S=await r77ReadXlsx(f),P=r77FxParse(S);if(!P.hojas.length){box.innerHTML='<p class="sub">No encontré hojas de meses con la fila «FECHA». Revisa que sea el flujo de caja diario.</p>';return}
    const pl=R77FX.plan=r77FxPlan(P),ms=Object.keys(pl.months).sort(),sum=k=>r2(ms.reduce((a,m)=>a+pl.months[m][k],0));
    box.innerHTML=`<div class="r77-impres"><p><b>Vista previa</b> · ${P.hojas.length} hojas de meses · ${pl.nProv} proveedores (${pl.nSys} ya están en el sistema, ${pl.nProv-pl.nSys} se crean como rubro del flujo)</p>
      ${table(['Mes','Ingresos','Pagos a proveedores','N.º de pagos'],ms.map(m=>[esc(r77FxMonthName(m)),money(pl.months[m].ing),money(pl.months[m].prov),String(pl.months[m].np)]).concat([['<b>Total</b>','<b>'+money(sum('ing'))+'</b>','<b>'+money(sum('prov'))+'</b>','<b>'+ms.reduce((a,m)=>a+pl.months[m].np,0)+'</b>']]))}
      <p class="sub">Todavía no se cambió nada.</p><div class="row">${button('Aplicar carga','r77FcxApply()',true)}${button('Cancelar','closeModal()')}</div></div>`}
  catch(e){box.innerHTML='<p class="sub">No pude leer el archivo: '+esc(e.message)+'</p>'}}
function r77FcxApply(){if(r72Role()!=='Administrador')return toast('Solo el superusuario carga el flujo desde Excel.');const pl=R77FX.plan;if(!pl)return;
  const f=r77Fc();f.entries=r77FcEntries().filter(e=>e.src!=='xlsx');f.ingNames??={};
  pl.P.ing.forEach(e=>{const id='ing.x_'+r77Nk(e.name);f.ingNames[id]=r77FxName(e.name);f.entries.push({id:uid(),date:e.date,rubro:id,concept:'Ingresos del día',amount:r2(e.amount),src:'xlsx'})});
  pl.P.prov.forEach(e=>{const k=r77FxKey(e.name),o=pl.provs[k];let id;if(o.sup)id='gprov.s_'+o.sup.id;else{id='gprov.c_'+r77Nk(o.name);if(!f.custom.some(c=>c.id===id))f.custom.push({id,group:'gprov',name:o.name,src:'xlsx'})}
    f.entries.push({id:uid(),date:e.date,rubro:id,concept:e.concept,amount:r2(e.amount),src:'xlsx'})});
  const last=Object.keys(pl.months).sort().at(-1);if(last)R77F.ym=last;R77FX.plan=null;closeModal();
  R73.lastText='Flujo de caja cargado desde Excel';save('Flujo de caja cargado desde Excel',pl.P.ing.length+' ingresos y '+pl.P.prov.length+' pagos a proveedores');toast('Flujo cargado: '+pl.P.ing.length+' ingresos y '+pl.P.prov.length+' pagos a proveedores.')}
