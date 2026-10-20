
/* --------------------------------------------------------------------------
   Migración y arranque R7.4
   -------------------------------------------------------------------------- */
function r74Ensure(){
  /* series de comprobantes */
  db.r73noteSeq??={};
  if(!db.r74series){const mk=(series,docType)=>{const used=db.notes.filter(n=>n.series===series).map(n=>+n.number||0);return {id:uid(),docType,series,current:Math.max(0,...used,+(db.r73noteSeq?.[series]||0)),email:'',address:'',phone:'',active:true}};db.r74series=[mk('N001','Nota de venta'),mk('N002','Nota de venta'),mk('B001','Boleta de venta'),mk('F001','Factura')];db.r74series[2].active=false;db.r74series[3].active=false}
  /* cajas: sede, usuarios y series */
  db.cashBoxes.forEach(b=>{if(!['union','prohogar'].includes(b.branch))b.branch='union';b.users??=b.user?[b.user]:[];b.series??=[];b.active??=true});
  const addBox=(id,name,branch,users,ser,account)=>{if(db.cashBoxes.some(b=>b.id===id))return;db.cashBoxes.push({id,name,branch,users,series:db.r74series.filter(s=>s.series===ser).map(s=>s.id),account,open:false,initial:0,start:0,active:true})};
  addBox('box-union','Caja Unión','union',['u-caja','u-admin'],'N001','cash-union');addBox('box-prohogar','Caja Prohogar','prohogar',['u-admin'],'N002','cash-prohogar');
  db.cashBoxes.forEach(b=>{if(b.id==='box-alvaro'&&!b.series.length)b.series=db.r74series.filter(s=>s.series==='N001').map(s=>s.id)});
  /* usuarios: datos completos y roles */
  db.users.forEach(u=>{if(!u.firstName){const p=String(u.name||'').split(/\s*·\s*/)[0].split(' ');u.firstName??=p[0]||'';u.lastName??=p.slice(1).join(' ')||'demo';u.lastName2??='';u.secondName??=''}u.roles??=[u.role].filter(Boolean);u.email??='';u.phone??=''});
  /* clientes y proveedores: tipo de documento */
  db.clients.forEach(c=>{c.docType??=String(c.doc||'').replace(/\D/g,'').length===11?'RUC':c.doc?'DNI':'DNI'});(db.suppliers||[]).forEach(s=>{s.docType??=String(s.ruc||s.doc||'').replace(/\D/g,'').length===8?'DNI':'RUC'});
  /* categorías */
  if(!db.r74cats)db.r74cats=R74_CATS.map(([name,system],i)=>({id:'cat-'+(i+1),name,system,description:'',active:true}));
  db.catalog.forEach(c=>{if(c.category===undefined)c.category=r74GuessCat(c.name);if(c.type==='servicio')c.brand=null});
  /* marcas */
  if(!db.r74vbrands){const base={KIA:['PICANTO','RIO','SOLUTO','SPORTAGE'],HYUNDAI:['I10','ACCENT','GRAND I10','TUCSON'],TOYOTA:['YARIS','COROLLA','HILUX','RAV4'],CHEVROLET:['SPARK','SAIL','ONIX'],NISSAN:['VERSA','SENTRA','MARCH'],SUZUKI:['SWIFT','ALTO','CELERIO']};db.vehicles.forEach(v=>{const b=String(v.brand||'').toUpperCase().trim(),m=String(v.model||'').toUpperCase().trim();if(!b)return;base[b]??=[];if(m&&!base[b].includes(m))base[b].push(m)});db.r74vbrands=Object.entries(base).map(([name,models])=>({id:uid(),name,models}))}
  db.r74pbrands??=[{id:'pb-gen',name:'Genérico'},{id:'pb-oem',name:'Original (OEM)'},{id:'pb-alt',name:'Alternativo'}];
  /* grupos G1…G8 */
  if(!db.r74groups){const svc=db.catalog.filter(c=>c.type==='servicio'&&!c.deleted).slice(0,12),pr=f=>svc.map(c=>({catalog:c.id,hours:+c.hours||1,price:Math.round((+c.price||0)*f),exceptions:[],ref:true}));
    db.r74groups=Array.from({length:8},(_,i)=>({id:'G'+(i+1),name:'Grupo '+(i+1),rules:[],plans:[],prices:[],top:12,active:true,note:''}));
    const g2=db.r74groups[1],g3=db.r74groups[2];
    g2.name='Grupo 2 · citycar 1.0–1.2';g2.rules=[{brand:'Kia',model:'Picanto',yearFrom:2014,yearTo:2020,engine:''},{brand:'Hyundai',model:'i10',yearFrom:'',yearTo:'',engine:''}];g2.plans=['G2-PIC','G2-I10'].filter(id=>db.plans.some(p=>p.id===id));g2.prices=pr(1);g2.note='Precios referenciales de demostración: confirmar con el taller.';
    const oil=g2.prices.find(p=>normal(db.catalog.find(c=>c.id===p.catalog)?.name).includes('aceite'));if(oil)oil.exceptions=[{brand:'Hyundai',model:'i10',hours:(+oil.hours||1)+0.25,price:Math.round((+oil.price||0)*1.1)}];
    g3.name='Grupo 3 · sedán / hatchback 1.3–1.5';g3.rules=[{brand:'Toyota',model:'Yaris',yearFrom:'',yearTo:'',engine:''}];g3.plans=['G3-P2'].filter(id=>db.plans.some(p=>p.id===id));g3.prices=pr(1.15);g3.note='Precios referenciales de demostración: confirmar con el taller.'}
  db.vehicles.filter(v=>!v.deleted).forEach(v=>{if(v.group===undefined)r74AssignGroup(v)});
  db.r74surveys??=[];db.r74notif??=[];r74AutoCfg();
  r74Nav();
}
function r74Nav(){const has=id=>modules.some(m=>m[0]===id),after=(ref,item)=>{if(has(item[0]))return;const i=modules.findIndex(m=>m[0]===ref);modules.splice(i>=0?i+1:modules.length,0,item)};
  after('tareas',['automatizaciones','⚙','Automatizaciones']);
  if(!modules.some(m=>m.length===1&&m[0]==='MAESTROS')){const i=modules.findIndex(m=>m.length===1&&m[0]==='ADMINISTRACIÓN');modules.splice(i>=0?i:modules.length,0,['MAESTROS'],['grupos','◫','Grupos de vehículos'],['marcasv','◇','Marcas de vehículo'],['marcasp','◆','Marcas de producto'],['categorias','▦','Categorías'],['series','№','Series de comprobantes'],['cajasm','▱','Cajas (maestro)'])}}
const r74RenderBase=render;
render=function(){r74RenderBase();try{r74Restore(document);r74GridStyle();document.body.classList.toggle('r74-focus',!!r72Store('focus'));const h=document.querySelector('main>header');if(h){let b=h.querySelector('.r74-bell');const html=r74Bell();if(b)b.outerHTML=html;else h.insertAdjacentHTML('beforeend',html)}if(R74.notify){const n=R74.notify;R74.notify=0;const c=r74AutoCfg();if(actor===c.owner||r72Role()==='Administrador')setTimeout(()=>toast((n===1?'Se ha creado 1 tarea nueva':`Se han creado ${n} tareas nuevas`)+': revisa tu bandeja / lista de tareas.'),50)}}catch(e){console.warn('r74 render',e)}};
r74Ensure();
R74.lastAuto=0;syncR5Automations();
setInterval(()=>{const before=db.tasks.length;syncR5Automations();if(db.tasks.length!==before&&!$('modal').open)render()},60000);
