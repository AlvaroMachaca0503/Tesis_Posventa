
/* --------------------------------------------------------------------------
   R7.7 · Áreas, carpetas y listas: panel que se estira o se achica, carpetas
   y listas que se editan y se eliminan, y la vista Agenda solo en las listas
   que la tienen activada.
   -------------------------------------------------------------------------- */
function r77ListsInit(){db.lists.forEach(l=>{if(l.agenda===undefined)l.agenda=(l.id==='operativa')})}
r77ListsInit();
const r77AgendaOk=()=>!!db.lists.find(x=>x.id===listFilter)?.agenda;
const r77TaskAg=views.tareas;
views.tareas=()=>{if(taskView==='Agenda (técnicos)'&&!r77AgendaOk())taskView='Lista';let h=r77TaskAg();if(!r77AgendaOk())h=h.replace(/<button class="[^"]*" onclick="taskView='Agenda \(técnicos\)';render\(\)">Agenda \(técnicos\)<\/button>/,'');return h};
/* editar la lista (nombre, favorita, agenda) o eliminarla */
r73ListMenu=function(id){const l=db.lists.find(x=>x.id===id);if(!l)return;const n=db.tasks.filter(t=>t.list===id&&!t.deleted).length;
  form('Lista · '+esc(l.name),field('name','Nombre de la lista',l.name,'text','required')+`<label class="r72-inl"><input type="checkbox" name="fav" ${r73Fav().includes(id)?'checked':''}> Favorita (aparece en Favoritos y como pestaña arriba)</label><label class="r72-inl"><input type="checkbox" name="agenda" ${l.agenda?'checked':''}> Tiene la vista Agenda (técnicos)</label><p class="sub wide">Cada lista tiene sus vistas Lista, Tablero y Calendario. La Agenda solo la tienen las listas donde la actives. Esta lista tiene ${n} tarea(s).</p><div class="wide">${id==='general'?'<span class="sub">La lista General no se elimina.</span>':button('🗑 Eliminar esta lista',`r77ListDel('${id}')`)}</div>`,d=>{const before=l.name;l.name=d.name.trim()||l.name;l.agenda=!!d.agenda;const f=r73Fav(),on=!!d.fav;db.favorites[actor]=on?[...new Set([...f,id])]:f.filter(x=>x!==id);if(!l.agenda&&listFilter===id&&taskView==='Agenda (técnicos)')taskView='Lista';R73.lastText='Lista: '+before+(before!==l.name?' → '+l.name:'')+(on?' · favorita':'')+(l.agenda?' · con agenda':'');save('Lista actualizada',l.name)})};
function r77ListRemove(id){const l=db.lists.find(x=>x.id===id);if(!l)return 0;const fb=db.lists.find(x=>x.id==='general')&&id!=='general'?'general':null;let n=0;db.tasks.forEach(t=>{if(t.list===id){if(fb){t.list=fb;n++}}});db.lists=db.lists.filter(x=>x.id!==id);Object.keys(db.favorites||{}).forEach(u=>{db.favorites[u]=(db.favorites[u]||[]).filter(x=>x!==id)});(db.savedTaskViews||[]).forEach(v=>{if(v.list===id)v.list=''});if(listFilter===id)listFilter='';return n}
function r77ListDel(id){const l=db.lists.find(x=>x.id===id);if(!l||id==='general')return;const n=db.tasks.filter(t=>t.list===id&&!t.deleted).length;if(!confirm('¿Eliminar la lista «'+l.name+'»?'+(n?' Sus '+n+' tarea(s) pasan a la lista General.':'')))return;const m=r77ListRemove(id);closeModal();R73.lastText='Lista «'+l.name+'» eliminada';save('Lista eliminada',l.name)}
/* carpetas */
function r77FolderMenu(id){const f=db.folders.find(x=>x.id===id);if(!f)return;const ls=db.lists.filter(l=>l.folderId===id);
  form('Carpeta · '+esc(f.name),field('name','Nombre de la carpeta',f.name,'text','required')+`<p class="sub wide">Tiene ${ls.length} lista(s). Al eliminar la carpeta se eliminan sus listas y sus tareas pasan a la lista General.</p><div class="wide">${button('🗑 Eliminar esta carpeta',`r77FolderDel('${id}')`)}</div>`,d=>{const before=f.name;f.name=d.name.trim()||f.name;db.lists.forEach(l=>{if(l.folderId===id)l.folder=f.name});R73.lastText='Carpeta: '+before+' → '+f.name;save('Carpeta renombrada',f.name)})}
function r77FolderDel(id){const f=db.folders.find(x=>x.id===id);if(!f)return;const ls=db.lists.filter(l=>l.folderId===id);if(ls.some(l=>l.id==='general'))return toast('Esta carpeta tiene la lista General, que no se elimina. Muévela o elimina solo las otras listas.');const n=ls.reduce((a,l)=>a+db.tasks.filter(t=>t.list===l.id&&!t.deleted).length,0);
  if(!confirm('¿Eliminar la carpeta «'+f.name+'» con sus '+ls.length+' lista(s)?'+(n?' Sus '+n+' tarea(s) pasan a la lista General.':'')))return;ls.forEach(l=>r77ListRemove(l.id));db.folders=db.folders.filter(x=>x.id!==id);R72.collapsed.delete(id);closeModal();R73.lastText='Carpeta «'+f.name+'» eliminada';save('Carpeta eliminada',f.name)}
/* botón ••• en cada carpeta */
const r77TreeBase=workspaceTree;
workspaceTree=function(){return r77TreeBase().replace(/(<button[^>]*onclick="newListR5\('([^']+)'\)"[^>]*>\+ Lista<\/button>)/g,(m,btn,id)=>btn+`<button class="r73-dots" title="Editar o eliminar la carpeta" aria-label="Opciones de la carpeta" onclick="r77FolderMenu('${id}')">•••</button>`)};
/* panel de áreas redimensionable */
const r77TreeW=()=>Math.min(520,Math.max(150,+r72Store('treeW')||240));
function r77TreeApply(){document.documentElement.style.setProperty('--r77-tw',r77TreeW()+'px');const L=document.querySelector('.workspace-layout');if(L&&!L.querySelector(':scope>.r77-split')){L.insertAdjacentHTML('beforeend','<div class="r77-split" role="separator" aria-orientation="vertical" aria-label="Ajustar el ancho del panel de áreas, carpetas y listas (doble clic restablece)" title="Arrastra para estirar o achicar el panel · doble clic restablece"><i></i></div>')}}
const r77TreeRender=render;render=function(){r77TreeRender();try{r77TreeApply()}catch{}};
let r77TD=null;
document.addEventListener('pointerdown',e=>{const h=e.target.closest?.('.r77-split');if(!h)return;e.preventDefault();r77TD={x:e.clientX,w:r77TreeW(),id:e.pointerId};try{h.setPointerCapture(e.pointerId)}catch{}document.body.classList.add('r77-resizing')},true);
document.addEventListener('pointermove',e=>{if(!r77TD||e.pointerId!==r77TD.id)return;const w=Math.min(520,Math.max(150,r77TD.w+(e.clientX-r77TD.x)/.8));document.documentElement.style.setProperty('--r77-tw',w+'px');r77TD.cur=w});
const r77TEnd=e=>{if(!r77TD||e.pointerId!==r77TD.id)return;if(r77TD.cur)r72Store('treeW',r77TD.cur);r77TD=null;document.body.classList.remove('r77-resizing')};
document.addEventListener('pointerup',r77TEnd);document.addEventListener('pointercancel',r77TEnd);
document.addEventListener('dblclick',e=>{if(e.target.closest?.('.r77-split')){r72Store('treeW',240);r77TreeApply()}});
