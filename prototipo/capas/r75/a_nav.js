
/* ==========================================================================
   R7.5 · cuarta ronda de comentarios (16/10/2026)
   Menú por secciones plegables, etiqueta «tesis», cuentas por cobrar y por
   pagar separadas, tablas angostas y redimensionables.
   ========================================================================== */
const R75={open:new Set(),notify:0};
/* Estructura del menú, tomada de las capturas de Tuulapp y del sistema anterior. */
const R75_NAV=[
  {id:'inicio'},{id:'tareas'},{id:'timeline'},
  {sec:'Maestros',icon:'☰',items:['clientes','proveedores','vehiculos','grupos','planes','marcasv','marcasp','categorias','catalogo','series','cajasm']},
  {sec:'Ventas',icon:'↗',items:['cotizaciones','ods','notas']},
  {sec:'Postventa',icon:'☎',items:['citas','bitacora','automatizaciones']},
  {sec:'Cuentas',icon:'CC',items:['caja','cobrar','pagar']},
  {sec:'Compras',icon:'↙',items:['compras']},
  {sec:'Finanzas',icon:'▰',items:['bancos']},
  {sec:'Reportes',icon:'▥',items:['rep_ventas','rep_items','rep_ops','rep_rent','rep_tec','reportes']},
  {sec:'Configuración',icon:'⚙',items:['usuarios','ajustes','importar','auditoria']}];
/* Módulos que vienen de la tesis (se les pone la etiqueta «tesis»). */
const R75_TESIS=new Set(['clientes','vehiculos','ods','planes','timeline','tareas','citas','cotizaciones','bitacora','automatizaciones','grupos']);
const R75_MODS={inicio:['◈','Métricas'],tareas:['☑','Espacio de trabajo'],timeline:['↗','Línea temporal'],clientes:['◎','Clientes'],proveedores:['♢','Proveedores'],vehiculos:['◇','Vehículos'],grupos:['◫','Grupos de vehículos'],planes:['▦','Planes preventivos'],marcasv:['◇','Marcas de vehículo'],marcasp:['◆','Marcas de producto'],categorias:['▦','Categorías'],catalogo:['≡','Productos y servicios'],series:['№','Series de comprobantes'],cajasm:['▱','Cajas'],
  cotizaciones:['⌁','Cotizaciones'],ods:['▤','Órdenes de servicio'],notas:['▧','Notas de venta'],citas:['▣','Citas'],bitacora:['◉','Bitácora'],automatizaciones:['⚙','Automatizaciones'],caja:['▱','Cajas por sede (apertura)'],cobrar:['◴','Cuentas por cobrar'],pagar:['◵','Cuentas por pagar'],compras:['↙','Compras y comprobantes'],bancos:['▰','Bancos'],
  rep_ventas:['▥','Ventas generales'],rep_items:['▥','Ventas por ítems'],rep_ops:['▥','Operaciones'],rep_rent:['▥','Rentabilidades'],rep_tec:['▥','Técnicos'],reportes:['▥','Resumen operativo'],usuarios:['♧','Usuarios'],ajustes:['⚙','Configuración'],importar:['⇧','Carga masiva'],auditoria:['↺','Auditoría interna']};
function r75Rebuild(){const flat=R75_NAV.flatMap(n=>n.sec?n.items:[n.id]);modules.splice(0,modules.length,...flat.map(id=>[id,...R75_MODS[id]]))}
function r75Item(id,sub){const m=R75_MODS[id];return `<button class="${page===id?'active':''} ${sub?'r75-sub':'r75-top'}" onclick="go('${id}')"><b>${m[0]}</b>${m[1]}${R75_TESIS.has(id)?'<span class="r75-tag">tesis</span>':''}</button>`}
function r75Nav(){const nav=$('nav');if(!nav)return;nav.innerHTML=R75_NAV.map(n=>{if(!n.sec)return r75Item(n.id,false);const open=R75.open.has(n.sec),has=n.items.includes(page);return `<div class="r75-sec ${open?'open':''}"><button type="button" class="r75-sh ${has?'has':''}" aria-expanded="${open}" onclick="r75Tog('${n.sec}')"><b>${n.icon}</b>${n.sec}<i aria-hidden="true">${open?'▴':'▾'}</i></button>${open?`<div class="r75-items">${n.items.map(id=>r75Item(id,true)).join('')}</div>`:''}</div>`}).join('')}
function r75Tog(s){R75.open.has(s)?R75.open.delete(s):R75.open.add(s);r75Nav()}
/* Cuentas por cobrar y por pagar: dos módulos. */
const r75CobrarBase=views.cobrar;
function r75Cuentas(kind){R73.cxTab=kind;let h=r75CobrarBase();h=h.replace(/<div class="tabs">[\s\S]*?<\/div>(?=<div class="filterbar">)/,'');return h.replace(/<h1>[^<]*<\/h1>/,`<h1>Cuentas por ${kind==='cobrar'?'cobrar':'pagar'}</h1>`)}
views.cobrar=()=>r75Cuentas('cobrar');
views.pagar=()=>r75Cuentas('pagar');
