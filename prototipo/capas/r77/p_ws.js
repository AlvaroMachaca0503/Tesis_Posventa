
/* --------------------------------------------------------------------------
   R7.7 · Espacio de trabajo con el encabezado compacto (3 filas):
     1) título   2) vistas (Lista, Tablero, Calendario, Agenda) + vistas guardadas
     3) agrupar, subtareas (menú), filtros y «+ Tarea»
   Subtareas: Contraído (por defecto) · Expandido · Por separado
   -------------------------------------------------------------------------- */
R77.subMode=(()=>{try{return r72Store('subMode')||'contraido'}catch{return 'contraido'}})();
const R77_SUBS=[['contraido','Contraído','(por defecto)'],['expandido','Expandido',''],['separado','Por separado','Úsalo para filtrar subtareas']];
function r77SubSet(m){R77.subMode=m;try{r72Store('subMode',m)}catch{}render()}
function r77SubMenu(btn){r77MenuShow(btn,R77_SUBS.map(([k,l,h])=>({icon:R77.subMode===k?'✓':'',label:l+(h?'  · '+h:''),fn:()=>r77SubSet(k)})))}
const r77TareasBase=views.tareas;
views.tareas=()=>{R73.showSub=R77.subMode!=='contraido';const saved=[];if(R77.subMode==='separado')db.tasks.forEach(t=>{if(t.parent){saved.push([t,t.parent]);t.parent=null}});try{return r77TareasBase()}finally{saved.forEach(([t,p])=>t.parent=p)}};
function r77WsCompact(){if(page!=='tareas')return;const m=document.querySelector('.workspace-main');if(!m||m.querySelector(':scope>.r77-ws1'))return;
  const vb=m.querySelector(':scope>.r6-viewbar'),tb=m.querySelector(':scope>.r6-toolbar'),sb=m.querySelector(':scope>.r73-subbar'),tabs=m.querySelector(':scope>.tabs');if(!tb||!tabs)return;
  const r1=document.createElement('div');r1.className='r77-ws1';tabs.classList.add('r77-wstabs');r1.appendChild(tabs);
  if(vb){[...vb.children].forEach(c=>{if(c.tagName==='BUTTON'&&/Guardar vista/.test(c.textContent)){c.textContent='＋ Vista';c.classList.add('r77-addview')}r1.appendChild(c)});vb.remove()}
  const r2=document.createElement('div');r2.className='r77-ws2';
  [...tb.children].forEach(c=>{if(c.matches?.('button[onclick*="r74Cols"]')){c.remove();return}r2.appendChild(c)});tb.remove();
  const sp=r2.querySelector('.spacer'),cur=R77_SUBS.find(x=>x[0]===R77.subMode)[1],b=document.createElement('button');b.type='button';b.className='r77-subbtn';b.title='Mostrar subtareas';b.innerHTML='⌥ Subtareas'+(R77.subMode!=='contraido'?': '+esc(cur):'')+' ▾';b.onclick=()=>r77SubMenu(b);if(sp)r2.insertBefore(b,sp);else r2.appendChild(b);
  sb?.remove();m.insertBefore(r2,m.firstChild);m.insertBefore(r1,m.firstChild)}
const r77WsRender=render;render=function(){r77WsRender();try{r77WsCompact()}catch(err){console.warn('r77 ws',err)}};
