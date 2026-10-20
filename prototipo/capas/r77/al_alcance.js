
/* --------------------------------------------------------------------------
   R7.7 · Alcance delimitado de la primera versión (decidido por el investigador).
   - Núcleo: ODS, tareas y automatizaciones, notas de venta, cuentas por cobrar y
     por pagar, cotizaciones, compras, bancos, inventario, maestros, reportes
     con filtro por sede y la encuesta con enlace.
   - BETA (se ven al final del menú y se pueden ocultar en Configuración):
     Cajas, Paquetes, Ingreso y Egreso sin comprobante, Flujo de caja,
     Comparativo, Integraciones y Gemini.
   - Se quitan: Reglas de precios, Auditoría interna (queda la Bitácora).
   - Apertura y cierre de caja: la lógica se conserva pero está APAGADA; el pago
     solo indica a qué caja o banco entró el dinero.
   - Las series de comprobantes se asignan a una sede, no a una caja.
   -------------------------------------------------------------------------- */
db.settings.showBeta??=true;db.settings.useCajas??=false;
const R77_BETA_IDS=['paquetes','cajasm','flujo','comparativo','ing_var','egr_var','integraciones','gemini'];
R77_BETA_IDS.forEach(i=>R77_BETA.add(i));
/* ---------- menú: núcleo y, al final, los módulos beta ---------- */
(function(){const ic=n=>(R75_NAV.find(x=>x.sec===n)||{}).icon||'▦';
  const nav=[{id:'ods'},{id:'inicio'},{id:'tareas'},{id:'timeline'},
    {sec:'Maestros',icon:ic('Maestros'),items:['clientes','proveedores','vehiculos','grupos','planes','solapes','marcasv','series']},
    {sec:'Inventario',icon:ic('Inventario'),items:['catalogo','locales','movinv','kardex','marcasp','categorias']},
    {sec:'Ingresos',icon:ic('Ingresos'),items:['cotizaciones','notas','cobrar']},
    {sec:'Egresos',icon:ic('Egresos'),items:['compras','pagar']},
    {sec:'Seguimiento',icon:ic('Seguimiento'),items:['citas','bitacora']},
    {sec:'Finanzas',icon:ic('Finanzas'),items:['bancos']},
    {sec:'Reportes',icon:ic('Reportes'),items:['rep_post','rep_ventas','rep_items','rep_ops','rep_rent','rep_igv','rep_tec','rep_gar']},
    {sec:'Configuración',icon:ic('Configuración'),items:['automatizaciones','usuarios','ajustes','importar']},
    {sec:'Beta',icon:'β',items:[...R77_BETA_IDS]}];
  R75_NAV.splice(0,R75_NAV.length,...nav);
  Object.assign(R75_MODS,{ing_var:['＋','Ingreso (sin comprobante)'],egr_var:['－','Egreso (sin comprobante)'],cajasm:['▱','Cajas (apertura y cierre)'],paquetes:['❖','Paquetes de servicios y productos']});
  r75Rebuild()})();
const r77NavAlc=r75Nav;
r75Nav=function(){r77NavAlc();if(!db.settings.showBeta)document.querySelectorAll('#nav .r77-sec[data-sec="Beta"]').forEach(x=>x.remove())};
function r77SetCfg(k,v){db.settings[k]=!!v;R73.lastText='Configuración: '+k+' '+(v?'activada':'desactivada');save('Configuración',k+' = '+(!!v))}
/* ---------- Configuración: todo enlazado desde aquí ---------- */
const r77AjustesAlc=views.ajustes;
views.ajustes=()=>{const adm=r72Role()==='Administrador',card=(t,s,js)=>`<button type="button" class="r77-card2" onclick="${js}"><b>${t}</b><small>${s}</small></button>`;
  const hub=`<div class="panel r77-cfghub"><h3>Módulos beta y caja</h3>
  <div class="r72-checks" style="margin-top:12px"><label class="r72-inl"><input type="checkbox" ${db.settings.showBeta?'checked':''} onchange="r77SetCfg('showBeta',this.checked)"> Mostrar los módulos beta en el menú (se ven al final)</label><label class="r72-inl"><input type="checkbox" ${db.settings.useCajas?'checked':''} ${adm?'':'disabled'} onchange="r77SetCfg('useCajas',this.checked)"> Usar apertura y cierre de caja (beta, apagado por ahora)</label></div><p class="sub">Beta: Cajas, Paquetes, Ingreso y Egreso sin comprobante, Flujo de caja, Comparativo, Integraciones y Gemini. No se implementan en la primera versión; se muestran solo para verlos.</p></div>`;
  const h=r77AjustesAlc(),m=/^<div class="heading">[\s\S]*?<div class="row">[\s\S]*?<\/div><\/div>/.exec(h);return m?m[0]+hub+h.slice(m[0].length):hub+h};
/* ---------- cuentas por cobrar y por pagar: solo pendientes (el histórico está en Compras y en Emitir comprobante) ---------- */
(function(){['cobrar','pagar'].forEach(k=>{const b=views[k];views[k]=()=>{R73.cxHist=false;return b().replace(/<div class="seg"><button[^>]*cxHist=false[^>]*>Pendientes<\/button><button[^>]*>Histórico<\/button><\/div>/,'')}})})();
/* ---------- reportes: filtro por sede ---------- */
R77.sede??='';
function r77WithSede(fn){return function(...a){const s=R77.sede||'';if(!s)return fn.apply(this,a);const bak={orders:db.orders,notes:db.notes,appointments:db.appointments},ords=db.orders.filter(o=>(o.branch||'union')===s),ids=new Set(ords.map(o=>o.id));
    db.orders=ords;db.notes=bak.notes.filter(n=>n.branch?n.branch===s:ids.has(n.order));db.appointments=bak.appointments.filter(x=>!x.branch||x.branch===s);
    try{return fn.apply(this,a)}finally{Object.assign(db,bak)}}}
function r77SedeBar(){return `<div class="panel r77-sedebar"><label class="r72-inl">Sede <select onchange="R77.sede=this.value;render()" aria-label="Filtrar el reporte por sede"><option value="">Todas las sedes</option>${R73_SEDES.map(([id,n])=>`<option value="${id}" ${R77.sede===id?'selected':''}>${esc(n)}</option>`).join('')}</select></label></div>`}
(function(){['rep_post','rep_ventas','rep_items','rep_ops','rep_rent','rep_igv','rep_tec','rep_gar'].forEach(k=>{const b=r77WithSede(views[k]);views[k]=()=>{const h=b(),m=/^<div class="heading">[\s\S]*?<div class="row">[\s\S]*?<\/div><\/div>/.exec(h);return m?m[0]+r77SedeBar()+h.slice(m[0].length):r77SedeBar()+h}});
  })();
r72Download=r77WithSede(r72Download);r75RentCsv=r77WithSede(r75RentCsv);
/* «Técnicos»: se agrupa por el técnico de cada SERVICIO, no por el de la orden */
const r72DataSv=r72Data;
r72Data=function(tab){const d=r72DataSv(tab);if(tab!=='tecnicos')return d;const f=r72F('tecnicos'),keep=r=>f.tecnico?r.l.tech===f.tecnico:true,c0=d.cells;
  return {...d,all:d.all.filter(keep),rows:d.rows.filter(keep),cells:r=>c0({...r,o:{...r.o,tech:null}})}};
/* ---------- métricas: sin utilización de la capacidad productiva; «venta de servicios» ---------- */
const r75ChartAlc=r75Chart;
r75Chart=function(id,title,...rest){if(id==='util')return '';if(id==='vmo')title='Venta de servicios';return r75ChartAlc(id,title,...rest)};
const r75InicioAlc=views.inicio;
views.inicio=()=>r75InicioAlc().replace(/<div class="panel r75-kpi"><span class="muted">Utilización de capacidad productiva<\/span>[\s\S]*?<\/div>/,'').replace(/Ventas de mano de obra/g,'Venta de servicios');
/* ---------- series de comprobantes: se asignan a una SEDE ---------- */
(function(){const m={N001:'union',N002:'prohogar'};(db.r74series||[]).forEach(s=>{if(s.branch==null)s.branch=m[s.series]||''})})();
function r74EditSeries(id){const s=id?r74Series(id):{active:true,current:0,branch:''};form(id?'Editar serie':'Nueva serie',select('docType','Tipo de comprobante',R74_DOCS.map(x=>[x,x]),s.docType||'Nota de venta')+field('series','Serie',s.series||'','text','required')+select('branch','Sede a la que pertenece',[['','Todas las sedes'],...R73_SEDES],s.branch||'')+field('current','Número actual',s.current??0,'number','min="0" required')+field('email','Email',s.email||'','email')+field('address','Dirección',s.address||'')+field('phone','Celular',s.phone||'')+`<label class="r72-inl"><input type="checkbox" name="active" ${s.active!==false?'checked':''}> Activo</label><p class="wide sub">La cajera de esa sede emite sus comprobantes con la serie de su sede.</p>`,d=>{const o={docType:d.docType,series:d.series.trim().toUpperCase(),branch:d.branch||'',current:+d.current||0,email:d.email,address:d.address,phone:d.phone,active:!!d.active};if(db.r74series.some(x=>x.series===o.series&&x.id!==id))throw Error('La serie ya existe.');if(id)Object.assign(s,o);else db.r74series.push({id:uid(),...o});R73.lastText='Serie '+o.series+' ('+o.docType+') · '+(o.branch?r73Sede(o.branch):'todas las sedes');save('Serie guardada',o.series)})}
views.series=()=>heading('Series de comprobantes','Cada serie pertenece a una sede: la cajera de esa sede emite sus comprobantes con la serie de su sede.',button('+ Nuevo','r74EditSeries()',true))+`<div class="panel">${table(['Acciones','Serie','Tipo de comprobante','Sede','Número actual','Estado'],db.r74series.map(s=>[r73Act(r73Btn('edit','Editar',`r74EditSeries('${s.id}')`),r73Btn('del','Eliminar',`r74DelSeries('${s.id}')`,'r73-red')),`<b>${esc(s.series)}</b>`,esc(s.docType.toUpperCase()),esc(s.branch?r73Sede(s.branch):'Todas'),s.current,`<span class="pill ${s.active!==false?'green':'red'}">${s.active!==false?'Activo':'Inactivo'}</span>`]))}</div>`;
function r74NoteSeriesFor(o){const sede=r72Role()==='Administrador'&&o?.branch?o.branch:r73UserSede(),all=db.r74series.filter(s=>s.active!==false&&s.docType==='Nota de venta'),mine=all.filter(s=>s.branch===sede),any=all.filter(s=>!s.branch);return mine.length?[...mine,...any]:any.length?any:all}
/* pie del menú: la versión vigente */
const r77RenderPie=render;
render=function(){r77RenderPie();try{const f=document.querySelector('aside>div:last-child');if(f&&/R7\.[0-6]/.test(f.innerHTML))f.innerHTML=f.innerHTML.replace(/R7\.[0-6]/,'R7.7')}catch{}};
