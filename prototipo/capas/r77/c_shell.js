
/* --------------------------------------------------------------------------
   R7.7 · Barra superior: hora simulada (todo el sistema), pantalla completa,
   buscador global y menú ☰ del espacio de trabajo
   -------------------------------------------------------------------------- */
/* Reloj del sistema: con hora simulada, todo `new Date()` parte de esa hora */
const R77_RD=Date;let r77Off=0;
function r77SetClock(v){r77Off=v?new R77_RD(v).getTime()-R77_RD.now():0}
window.Date=class extends R77_RD{constructor(...a){if(a.length===0)super(R77_RD.now()+r77Off);else super(...a)}static now(){return R77_RD.now()+r77Off}};
const r77SimBase=r74SimSet;
/* al cambiar la hora simulada, todo el sistema se pone en esa fecha y las automatizaciones corren de inmediato */
function r77ClockSync(){const d=today();month=d.slice(0,7);selectedDate=d;Object.values(R74.cal||{}).forEach(c=>{if(c)c.date=d})}
r74SimSet=function(v){r77SetClock(v);r77ClockSync();R74.lastAuto=0;r77SimBase(v);let made=[];try{made=r74RunAuto('hora simulada')}catch(err){console.warn(err)}let n=0;try{n=r77Tick()}catch(err){console.warn(err)}
  if(made.length||n){R74.notify=(R74.notify||0)+made.length+n;try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}render()}};
/* pantalla completa (escritorio y tableta) */
function r77Full(){const d=document,el=d.documentElement,on=d.fullscreenElement||d.webkitFullscreenElement;
  try{const p=on?(d.exitFullscreen||d.webkitExitFullscreen)?.call(d):(el.requestFullscreen||el.webkitRequestFullscreen)?.call(el);if(!p&&!on&&!(el.requestFullscreen||el.webkitRequestFullscreen))throw 0;p?.catch?.(()=>toast('Este navegador no permite pantalla completa.'))}catch{toast('Este navegador no permite pantalla completa. En iPad: Compartir → Añadir a pantalla de inicio.')}}
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,()=>{const b=$('r77fs');if(b)b.textContent=(document.fullscreenElement||document.webkitFullscreenElement)?'⤡':'⛶'}));
/* buscador global */
const r77N=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function r77Search(q){const n=r77N(q).trim();if(n.length<2)return [];const has=(...f)=>f.some(x=>r77N(x).includes(n)),G=[],add=(g,icon,list,fn)=>{const l=list.slice(0,6);if(l.length)G.push({g,icon,items:l.map(fn)})};
  add('Módulos','◈',modules.filter(m=>m.length>1&&has(m[2])),m=>({t:m[2],s:'Abrir módulo',a:`go('${m[0]}')`}));
  add('Tareas','☑',db.tasks.filter(t=>!t.deleted&&has(t.title,t.tags,t.description,r77Tid(t))),t=>({t:t.title,s:(t.state||'')+' · vence '+(t.due||'—'),a:`go('tareas');openTaskPanel('${t.id}')`}));
  add('Clientes','◎',db.clients.filter(c=>!c.deleted&&has(c.name,c.doc,c.phone,c.email)),c=>({t:c.name,s:[c.doc,c.phone].filter(Boolean).join(' · ')||'Cliente',a:`go('clientes');editClient('${c.id}')`}));
  add('Vehículos','◇',db.vehicles.filter(v=>!v.deleted&&has(v.plate,v.brand,v.model,v.vin)),v=>({t:v.plate+' · '+(v.brand||'')+' '+(v.model||''),s:'Ver línea temporal',a:`timelineVehicle='${v.id}';simKm=null;go('timeline')`}));
  add('Órdenes de servicio','▤',db.orders.filter(o=>!o.deleted&&has(o.code,o.externalId,vehicle(o.vehicle).plate)),o=>({t:'ODS '+o.code+' · '+(vehicle(o.vehicle).plate||''),s:(o.state||'')+' · '+(o.date||''),a:`go('ods');r72OpenOrder('${o.id}')`}));
  add('Citas','▣',db.appointments.filter(a=>!a.deleted&&has(a.code,vehicle(a.vehicle).plate,client(a.client).name)),a=>({t:'Cita '+(a.code||'')+' · '+(vehicle(a.vehicle).plate||''),s:(a.state||'')+' · '+(a.date||'')+' '+(a.time||''),a:`go('citas');r72OpenCita('${a.id}')`}));
  add('Catálogo','▦',(db.catalog||[]).filter(i=>!i.deleted&&has(i.name,i.code,i.sku)),i=>({t:i.name||i.code,s:'Catálogo',a:`go('catalogo')`}));
  add('Usuarios','☺',db.users.filter(u=>has(u.name,u.role)),u=>({t:u.name,s:u.role,a:`go('usuarios')`}));
  add('Automatizaciones','⚙',r77Db().rules.filter(r=>has(r.name,r.desc)),r=>({t:r.name,s:'Automatización',a:`R77.tab='gestionar';go('automatizaciones');r77Edit('${r.id}')`}));
  return G}
function r77Find(q){const box=$('r77res');if(!box)return;const G=r77Search(q);if(!G.length){box.hidden=String(q).trim().length<2;box.innerHTML=String(q).trim().length<2?'':'<div class="r77-none">Sin resultados</div>';return}
  R77.res=G.flatMap(g=>g.items);box.hidden=false;let i=0;box.innerHTML=G.map(g=>`<div class="r77-rg">${g.icon} ${esc(g.g)}</div>${g.items.map(it=>`<button type="button" class="r77-ri" onclick="r77Pick(${i++})"><b>${esc(it.t)}</b><small>${esc(it.s)}</small></button>`).join('')}`).join('')}
function r77Pick(i){const it=R77.res?.[i];if(!it)return;const box=$('r77res'),inp=$('r77q');if(box)box.hidden=true;if(inp)inp.blur();new Function(it.a)()}
function r77SearchKey(e){if(e.key==='Escape'){$('r77res').hidden=true;e.target.blur()}if(e.key==='Enter'){e.preventDefault();r77Pick(0)}}
document.addEventListener('click',e=>{if(!e.target.closest?.('.r77-search')){const b=$('r77res');if(b)b.hidden=true}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('r77q')?.focus()}});
/* ☰ en el espacio de trabajo: pliega también el menú lateral */
const r77NavBase=r72NavToggle;
r72NavToggle=function(){if(page==='tareas'){const on=!document.body.classList.contains('r76-tree');document.body.classList.toggle('r76-tree',on);document.body.classList.toggle('r74-focus',on);r72Store('tree',on);return}r77NavBase()};
/* inserta y sincroniza los controles de la barra */
function r77ShellSync(){const h=document.querySelector('main>header');if(!h)return;
  if(!h.querySelector('.r77-search')){const f=h.querySelector(':scope>div');f?.insertAdjacentHTML('afterend',`<div class="r77-search"><input id="r77q" type="search" autocomplete="off" placeholder="Buscar módulos, tareas, clientes, vehículos, ODS…  (Ctrl K)" aria-label="Buscar en todo el sistema" oninput="r77Find(this.value)" onfocus="r77Find(this.value)" onkeydown="r77SearchKey(event)"><div id="r77res" class="r77-res" hidden></div></div>`)}
  const row=h.querySelector(':scope>.row');if(row&&!row.querySelector('.r77-tools'))row.insertAdjacentHTML('afterbegin',`<span class="r77-tools"><label class="r77-simh" title="Hora simulada: vale para todo el sistema">🕒 <input type="datetime-local" id="r77simh" onchange="r74SimSet(this.value)"></label><button type="button" onclick="r74SimSet('')" title="Volver a la hora actual">Hora actual</button><button type="button" id="r77fs" onclick="r77Full()" title="Pantalla completa" aria-label="Pantalla completa">⛶</button></span>`);
  const si=$('r77simh'),sim=r74AutoCfg().sim;if(si&&document.activeElement!==si)si.value=sim?String(sim).slice(0,16):'';h.classList.toggle('r77-sim-on',!!sim);
  if(page==='tareas')document.body.classList.toggle('r74-focus',!!r72Store('tree'))}
const r77RenderBase=render;
render=function(){r77RenderBase();try{r77ShellSync()}catch(err){console.warn('r77 shell',err)}};
