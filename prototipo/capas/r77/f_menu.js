
/* --------------------------------------------------------------------------
   R7.7 · Menú reorganizado, nombres de estados y acciones de la orden
   (Archivar / Eliminar viven en el menú de Acciones, no son estados)
   -------------------------------------------------------------------------- */
(function(){const nav=R75_NAV;
  const ven=nav.find(n=>n.sec==='Ventas');ven.items=ven.items.filter(i=>i!=='ods');
  if(!nav.some(n=>n.id==='ods'))nav.unshift({id:'ods'});
  const mae=nav.find(n=>n.sec==='Maestros');mae.items=mae.items.filter(i=>!['marcasp','categorias','catalogo'].includes(i));
  if(!nav.some(n=>n.sec==='Inventario'))nav.splice(nav.indexOf(mae)+1,0,{sec:'Inventario',icon:'▦',items:['catalogo','marcasp','categorias']});
  const pv=nav.find(n=>n.sec==='Postventa'||n.sec==='Seguimiento');pv.sec='Seguimiento';pv.items=['citas','bitacora'];
  const cfg=nav.find(n=>n.sec==='Configuración');if(!cfg.items.includes('automatizaciones'))cfg.items.unshift('automatizaciones');
  const rep=nav.find(n=>n.sec==='Reportes');rep.items=rep.items.filter(i=>i!=='reportes');
  r75Rebuild()})();
page='ods';
/* nombres de estados: internos (Recepción, En proceso, Entrega, Archivada) y lo que se muestra */
const R77_SL={'Recepción':'En recepción','En proceso':'En proceso','Entrega':'En entrega','Archivada':'Cerrado'};
const R77_TABL={'Recepción':'En recepción','En proceso':'En proceso','Entrega':'En entrega','Archivada':'Cerrado'};
const r77StLabel=s=>R77_SL[s]||s;
/* estados de tarea (cuatro): Pendiente = En recepción · En proceso = En proceso · En espera = En entrega · Completada = Cerrado */
r6States=function(){return ['Pendiente','En proceso','En espera','Completada']};
R74_SG.splice(0,R74_SG.length,['Sin iniciar',['Pendiente']],['Activa',['En proceso','En espera']],['Cerrada',['Completada']]);
const R77_T2O={'Pendiente':'Recepción','En proceso':'En proceso','En espera':'Entrega','Completada':'Archivada'},R77_O2T={'Recepción':'Pendiente','En proceso':'En proceso','Entrega':'En espera','Archivada':'Completada'};
/* el evento de una ODS lleva el estado equivalente de la orden, y al revés */
const r77SyncEvBase=r72SyncEvent;
r72SyncEvent=function(k){const t=r77SyncEvBase(k);if(t&&k.startsWith('o:')){const o=r72Box(k);if(o&&R77_O2T[o.state])t.state=R77_O2T[o.state]}return t};
const r77InlineMap=r6Inline;
r6Inline=function(id,field,value){const t=db.tasks.find(x=>x.id===id);if(field==='state'&&t?.r72k?.startsWith('o:')&&R77_T2O[value]){const o=r72Box(t.r72k);if(o&&o.state!==R77_T2O[value]){r7SetOrderState(o.id,R77_T2O[value]);return}}return r77InlineMap(id,field,value)};
/* barra de procesos de la ODS: 4 estados + Archivados (órdenes ocultas) */
const r77OdsBase=views.ods;
views.ods=()=>{const h=r77OdsBase(),vis=o=>!o.deleted,cnt=s=>db.orders.filter(o=>o.state===s&&vis(o)).length;
  const html=`<div class="tabs">${states.map(s=>`<button class="processbtn ${s===odsState?'selected':''}" onclick="odsState='${s}';render()">${esc(R77_TABL[s]||s)}<i class="r77-led s-${s.replace(/ /g,"_")} ${cnt(s)?'on':''}" role="img" aria-label="${cnt(s)} órdenes" title="${cnt(s)} órdenes"></i></button>`).join('')}</div>`;
  return h.replace(/<div class="tabs">[\s\S]*?<\/div>(?=<div class="filterbar">)/,html)};
const r77CardsBase=orderCards;
orderCards=function(){if(!states.includes(odsState))odsState=states[0];return r77CardsBase().replace(/(<article class="ticket orderrow" onclick="openOrder\('([^']+)'\)">)(<div class="row spread">)(<b>[^<]*<\/b>)/g,(m,a,id,b,c)=>`${a}${b}${c}<button type="button" class="r77-opt r77-copt" aria-haspopup="menu" aria-label="Acciones" title="Acciones" onclick="event.stopPropagation();r77OdsMenu(event,this,'${id}')">⚙<small>▾</small></button>`)};
/* menú de acciones genérico (para tarjetas) */
function r77MenuShow(btn,items){const was=btn.classList.contains('on');r77MenuClose();if(was)return;const m=document.createElement('div');m.id='r77menu';m.className='r77-menu';m.setAttribute('role','menu');
  items.forEach(it=>{const b=document.createElement('button');b.type='button';b.className='r77-mi'+(it.red?' red':'');b.setAttribute('role','menuitem');b.innerHTML=`<span class="r77-mic">${it.icon||''}</span><span>${esc(it.label)}</span>`;b.onclick=ev=>{ev.stopPropagation();r77MenuClose();it.fn()};m.appendChild(b)});
  document.body.appendChild(m);btn.classList.add('on');const r=btn.getBoundingClientRect(),mw=m.offsetWidth,mh=m.offsetHeight;m.style.left=Math.min(Math.max(8,r.right-mw),innerWidth-mw-8)+'px';let y=r.bottom+4;if(y+mh>innerHeight-8)y=Math.max(8,r.top-mh-4);m.style.top=y+'px'}
function r77OdsMenu(e,btn,id){const o=db.orders.find(x=>x.id===id);if(!o)return;e.stopPropagation();
  r77MenuShow(btn,[{icon:'👁',label:'Ver ODS',fn:()=>openOrder(id)},{icon:'✎',label:'Editar',fn:()=>r72OpenOrder(id)},{icon:'▤',label:'Documentos',fn:()=>orderDocuments(id)},{icon:'☰',label:'Bitácora',fn:()=>orderLog(id)},{icon:'🗑',label:'Eliminar orden',red:true,fn:()=>r77OdsDelete(id)}])}
function r77OdsDelete(id){const o=db.orders.find(x=>x.id===id);if(!o)return;if(db.notes.some(n=>n.order===id))return toast('Esta ODS tiene nota de venta: no se puede eliminar. Puedes archivarla.');if(!confirm('¿Eliminar la ODS '+o.code+' por completo? No se puede deshacer.'))return;db.orders=db.orders.filter(x=>x.id!==id);R73.lastText='ODS '+o.code+' eliminada';save('ODS eliminada',o.code)}
/* etiquetas visibles de los estados en listas, píldoras y selectores de estado de la ODS */
function r77Labels(root){if(!root)return;root.querySelectorAll('select[onchange*="r7SetOrderState"] option').forEach(o=>{const l=R77_SL[o.value||o.textContent];if(l)o.textContent=l});
  root.querySelectorAll('.pill').forEach(p=>{const t=p.textContent.trim();if(t==='Recepción'||t==='Entrega')p.textContent=R77_SL[t];else if(t==='Archivada')p.textContent='Cerrado'})}
const r77LblRender=render;render=function(){r77LblRender();try{r77Labels(document)}catch{}};
const r77LblShow=r72Show;r72Show=function(html,ref){r77LblShow(html,ref);try{r77Labels($('modalbody'))}catch{}};
/* el encabezado ya no muestra «Guardado local» */
const r77ShellBase=r77ShellSync;r77ShellSync=function(){r77ShellBase();document.querySelectorAll('main>header .pill').forEach(p=>{if(/Guardado local/i.test(p.textContent))p.remove()})};
r75Nav();
