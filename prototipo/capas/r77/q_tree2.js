
/* --------------------------------------------------------------------------
   R7.7 · Panel de áreas estilo ClickUp: carpetas y subcarpetas, listas, menú
   ⋯ y «+», iconos y colores, mover / duplicar / eliminar, ocultar el panel y
   nombres de los estados (Configuración › Estados de tarea).
   -------------------------------------------------------------------------- */
const R77_TL={'Pendiente':'Pendiente','En proceso':'En proceso','En espera':'En espera','Completada':'Completada'};
const R77_TG={'Pendiente':'Sin iniciar','En proceso':'Activa','En espera':'Activa','Completada':'Cerrada'};
const R77_ICONS=['📁','📂','🗂','📋','✅','🛠','🚗','📦','💰','📞','⭐','🔧','🧾','📅','👥','🏷'];
const R77_COLORS=['#8a93a5','#2f8cff','#1fb98a','#f5a524','#e5484d','#a855f7','#ec4899','#c8ee69'];
const r77StLbls=()=>({...R77_TL,...(r77Db().labels||{})});
const r77Fk=id=>db.folders.filter(f=>(f.parentId||null)===(id||null));
const r77Fdesc=id=>{const o=[],w=x=>r77Fk(x).forEach(f=>{o.push(f.id);w(f.id)});w(id);return o};
const r77TObj=(k,id)=>(k==='f'?db.folders:db.lists).find(x=>x.id===id);
/* ---------- menú emergente ---------- */
function r77TPopClose(){document.getElementById('r77tp')?.remove()}
function r77TPop(e,items,opts){e.stopPropagation();e.preventDefault();const btn=e.currentTarget||e.target.closest('button'),was=document.getElementById('r77tp')?.dataset.for===btn?.dataset.k;r77TPopClose();if(was)return;
  const m=document.createElement('div');m.id='r77tp';m.dataset.for=btn?.dataset.k||'';m.className='r77-menu r77tp';m.setAttribute('role','menu');
  const mk=(it,host)=>{if(it.sep){const s=document.createElement('hr');s.className='r77-hr';host.appendChild(s);return}
    const b=document.createElement('button');b.type='button';b.className='r77-mi'+(it.red?' red':'');b.setAttribute('role','menuitem');b.innerHTML=`<span class="r77-mic">${it.i||''}</span><span>${esc(it.t)}${it.d?`<small class="r77-md">${esc(it.d)}</small>`:''}</span>${it.sub?'<span class="r77-chev">▾</span>':''}`;host.appendChild(b);
    if(it.sub){const box=document.createElement('div');box.className='r77-sub';box.hidden=true;it.sub.forEach(x=>mk(x,box));host.appendChild(box);b.onclick=ev=>{ev.stopPropagation();box.hidden=!box.hidden}}
    else b.onclick=ev=>{ev.stopPropagation();r77TPopClose();it.f()}};
  if(opts?.head){const h=document.createElement('div');h.className='r77-mh';h.textContent=opts.head;m.appendChild(h)}items.forEach(it=>mk(it,m));document.body.appendChild(m);
  const r=btn.getBoundingClientRect(),w=m.offsetWidth,h=m.offsetHeight;m.style.left=Math.max(6,Math.min(r.right+4,innerWidth-w-6))+'px';m.style.top=Math.max(6,Math.min(r.top,innerHeight-h-6))+'px'}
document.addEventListener('pointerdown',e=>{if(!e.target.closest?.('#r77tp,.r77t-act,.r77t-hb'))r77TPopClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')r77TPopClose()});
window.addEventListener('resize',r77TPopClose);
/* ---------- operaciones ---------- */
function r77Rename(k,id){const o=r77TObj(k,id);if(!o)return;form('Cambiar nombre',field('name','Nombre',o.name,'text','required'),d=>{const n=d.name.trim();if(!n)return;o.name=n;if(k==='f')db.lists.forEach(l=>{if(l.folderId===id)l.folder=n});R73.lastText='Renombrado: '+n;save(k==='f'?'Carpeta renombrada':'Lista renombrada',n)})}
function r77NewFolder(parent){form(parent?'Nueva subcarpeta':'Nueva carpeta',field('name','Nombre','','text','required'),d=>{const f={id:uid(),name:d.name.trim(),parentId:parent||null};db.folders.push(f);if(parent)R72.collapsed.delete(parent);R73.lastText='Carpeta creada: '+f.name;save('Carpeta creada',f.name)})}
function r77NewList(folderId){form('Nueva lista',field('name','Nombre','','text','required'),d=>{const f=db.folders.find(x=>x.id===folderId);db.lists.push({id:uid(),name:d.name.trim(),folderId,folder:f?.name});R72.collapsed.delete(folderId);R73.lastText='Lista creada: '+d.name;save('Lista creada',d.name)})}
function r77IconForm(k,id){const o=r77TObj(k,id);if(!o)return;
  form('Color e icono · '+esc(o.name),`<div class="wide"><b>Icono</b><div class="r77-icg">${R77_ICONS.map(i=>`<label><input type="radio" name="icon" value="${i}" ${o.icon===i?'checked':''}><span>${i}</span></label>`).join('')}</div></div>`+field('icon2','O escribe el tuyo (un emoji o una letra)','','text','maxlength="2"')+`<div class="wide"><b>Color</b><div class="r77-icg">${R77_COLORS.map(c=>`<label><input type="radio" name="color" value="${c}" ${o.color===c?'checked':''}><span class="r77-cs" style="background:${c}"></span></label>`).join('')}</div></div><label class="r72-inl wide"><input type="checkbox" name="reset"> Restablecer (sin icono ni color)</label>`,d=>{
    if(d.reset){delete o.icon;delete o.color}else{const ic=(d.icon2||'').trim()||d.icon;if(ic)o.icon=ic;if(d.color)o.color=d.color}
    R73.lastText='Icono y color de «'+o.name+'» actualizados';save('Icono actualizado',o.name)})}
function r77MoveForm(k,id){const o=r77TObj(k,id);if(!o)return;
  const bad=k==='f'?new Set([id,...r77Fdesc(id)]):new Set(),opts=db.folders.filter(f=>!bad.has(f.id)).map(f=>[f.id,r77Path(f.id)]);
  form('Mover · '+esc(o.name),select('to',k==='f'?'Mover dentro de':'Carpeta destino',k==='f'?[['','(Nivel principal)'],...opts]:opts,k==='f'?(o.parentId||''):o.folderId),d=>{if(k==='f')o.parentId=d.to||null;else{o.folderId=d.to;o.folder=db.folders.find(f=>f.id===d.to)?.name}if(d.to)R72.collapsed.delete(d.to);R73.lastText='«'+o.name+'» movido';save('Elemento movido',o.name)})}
function r77Path(id){const p=[];let f=db.folders.find(x=>x.id===id),n=0;while(f&&n++<20){p.unshift(f.name);f=db.folders.find(x=>x.id===f.parentId)}return p.join(' › ')}
function r77DupList(id,folderId,suffix){const l=db.lists.find(x=>x.id===id);if(!l)return;const c={...l,id:uid(),name:l.name+(suffix===false?'':' (copia)')};if(folderId!==undefined){c.folderId=folderId;c.folder=db.folders.find(f=>f.id===folderId)?.name}db.lists.push(c);return c}
function r77DupFolder(id,parent,top){const f=db.folders.find(x=>x.id===id);if(!f)return;const c={...f,id:uid(),name:f.name+(top?' (copia)':''),parentId:parent===undefined?(f.parentId||null):parent};db.folders.push(c);db.lists.filter(l=>l.folderId===id).forEach(l=>r77DupList(l.id,c.id,false));r77Fk(id).forEach(k=>r77DupFolder(k.id,c.id,false));return c}
function r77TDup(k,id){const o=r77TObj(k,id);if(!o)return;const c=k==='f'?r77DupFolder(id,undefined,true):r77DupList(id);R73.lastText='«'+o.name+'» duplicado (las tareas no se copian)';save('Elemento duplicado',c?.name||o.name)}
function r77SortAZ(parent){const c=(a,b)=>a.name.localeCompare(b.name,'es');const fs=r77Fk(parent).sort(c);db.folders=[...db.folders.filter(f=>(f.parentId||null)!==(parent||null)),...fs];if(parent){const ls=db.lists.filter(l=>l.folderId===parent).sort(c);db.lists=[...db.lists.filter(l=>l.folderId!==parent),...ls]}R73.lastText='Ordenado de la A a la Z';save('Ordenado A–Z','')}
function r77FolderDel(id){const f=db.folders.find(x=>x.id===id);if(!f)return;const ids=[id,...r77Fdesc(id)],ls=db.lists.filter(l=>ids.includes(l.folderId));if(ls.some(l=>l.id==='general'))return toast('Esta carpeta tiene la lista General, que no se elimina. Muévela o elimina solo las otras listas.');const n=ls.reduce((a,l)=>a+db.tasks.filter(t=>t.list===l.id&&!t.deleted).length,0);
  if(!confirm('¿Eliminar la carpeta «'+f.name+'» con '+(ids.length-1)+' subcarpeta(s) y '+ls.length+' lista(s)?'+(n?' Sus '+n+' tarea(s) pasan a la lista General.':'')))return;ls.forEach(l=>r77ListRemove(l.id));db.folders=db.folders.filter(x=>!ids.includes(x.id));ids.forEach(i=>R72.collapsed.delete(i));closeModal();R73.lastText='Carpeta «'+f.name+'» eliminada';save('Carpeta eliminada',f.name)}
function r77FavToggle(id){const f=r73Fav(),on=!f.includes(id);db.favorites[actor]=on?[...f,id]:f.filter(x=>x!==id);save(on?'Lista favorita':'Lista quitada de favoritos',id)}
function r77AgendaToggle(id){const l=db.lists.find(x=>x.id===id);if(!l)return;l.agenda=!l.agenda;if(!l.agenda&&listFilter===id&&taskView==='Agenda (técnicos)')taskView='Lista';save('Vista Agenda',l.name)}
function r77Fold(all,close){db.folders.forEach(f=>close?R72.collapsed.add(f.id):R72.collapsed.delete(f.id));r72Store('folds',[...R72.collapsed]);render()}
/* «« solo oculta este panel; el botón ☰ de arriba es el que oculta todo (menú, título y panel) */
function r77THide(){r72Store('treeOff',true);render()}
function r77TShow(){r72Store('treeOff',false);render()}
/* ---------- menús ---------- */
function r77CreateMenu(e,fid){r77TPop(e,[{t:'Lista',i:'☰',f:()=>r77NewList(fid)},{t:fid?'Subcarpeta':'Carpeta',i:'📁',f:()=>r77NewFolder(fid)}])}
function r77FolderMenu(e,id){const f=db.folders.find(x=>x.id===id);if(!f)return;
  r77TPop(e,[{t:'Cambiar nombre',i:'✎',f:()=>r77Rename('f',id)},{t:'Color e icono',i:'🎨',f:()=>r77IconForm('f',id)},{t:'Crear',i:'+',sub:[{t:'Lista',i:'☰',f:()=>r77NewList(id)},{t:'Subcarpeta',i:'📁',f:()=>r77NewFolder(id)}]},{t:'Ordenar de la A a la Z',i:'↕',f:()=>r77SortAZ(id)},{sep:1},{t:'Mover',i:'➜',f:()=>r77MoveForm('f',id)},{t:'Duplicar',i:'⧉',f:()=>r77TDup('f',id)},{t:'Eliminar',i:'🗑',red:1,f:()=>r77FolderDel(id)}])}
function r73ListMenu(id){const l=db.lists.find(x=>x.id===id);if(!l)return;const e=window.event;
  r77TPop(e,[{t:r73Fav().includes(id)?'Quitar de favoritos':'Favorito',i:'★',f:()=>r77FavToggle(id)},{t:'Cambiar nombre',i:'✎',f:()=>r77Rename('l',id)},{t:'Color e icono',i:'🎨',f:()=>r77IconForm('l',id)},{t:l.agenda?'Quitar la vista Agenda (técnicos)':'Activar la vista Agenda (técnicos)',i:'▦',f:()=>r77AgendaToggle(id)},{sep:1},{t:'Mover',i:'➜',f:()=>r77MoveForm('l',id)},{t:'Duplicar',i:'⧉',f:()=>r77TDup('l',id)},{t:'Eliminar',i:'🗑',red:1,f:()=>id==='general'?toast('La lista General no se elimina.'):r77ListDel(id)}])}
function r77HeadMenu(e){r77TPop(e,[{t:'Expandir todo',i:'▾',f:()=>r77Fold(1,false)},{t:'Contraer todo',i:'▸',f:()=>r77Fold(1,true)},{t:'Ordenar de la A a la Z',i:'↕',f:()=>r77SortAZ(null)},{sep:1},{t:'Nombres de los estados',i:'◎',f:()=>go('estados')}])}
/* ---------- árbol ---------- */
workspaceTree=function(){const favs=r73Fav().map(id=>db.lists.find(l=>l.id===id)).filter(Boolean),fv=r73FavViews();
  const cnt=id=>db.tasks.filter(t=>t.list===id&&!t.deleted&&!['Completada','Cancelada'].includes(t.state)&&!t.parent).length;
  const lrow=(l,d)=>`<div class="r77t-row l ${listFilter===l.id?'selected':''}" style="--d:${d}"><button class="r77t-main" onclick="listFilter='${l.id}';render()"><span class="r77t-ic" ${l.color?`style="color:${l.color}"`:''}>${l.icon||'☰'}</span><span class="nm">${esc(l.name)}</span>${r73Fav().includes(l.id)?'<span class="r77t-star">★</span>':''}<small class="r77t-cnt">${cnt(l.id)||''}</small></button><span class="r77t-act"><button type="button" data-k="l${l.id}" title="Más" aria-label="Más opciones de la lista" onclick="r73ListMenu('${l.id}')">⋯</button><button type="button" data-k="p${l.id}" title="Crear" aria-label="Crear tarea en esta lista" onclick="r77ListCreate(event,'${l.id}')">+</button></span></div>`;
  const frow=(f,d)=>{const closed=R72.collapsed.has(f.id),ls=db.lists.filter(l=>l.folderId===f.id),ks=r77Fk(f.id),n=[f.id,...r77Fdesc(f.id)].reduce((a,i)=>a+db.lists.filter(l=>l.folderId===i).reduce((b,l)=>b+cnt(l.id),0),0);
    return `<div class="r77t-row f" style="--d:${d}"><button class="r77t-main" aria-expanded="${!closed}" onclick="r72Fold('${f.id}')"><span class="r77t-chev">${closed?'▸':'▾'}</span><span class="r77t-ic" ${f.color?`style="color:${f.color}"`:''}>${f.icon||(closed?'📁':'📂')}</span><span class="nm">${esc(f.name)}</span><small class="r77t-cnt">${n||''}</small></button><span class="r77t-act"><button type="button" data-k="m${f.id}" title="Más" aria-label="Más opciones de la carpeta" onclick="r77FolderMenu(event,'${f.id}')">⋯</button><button type="button" data-k="c${f.id}" title="Crear lista o subcarpeta" aria-label="Crear" onclick="r77CreateMenu(event,'${f.id}')">+</button></span></div>${closed?'':ks.map(k=>frow(k,d+1)).join('')+ls.map(l=>lrow(l,d+1)).join('')}`};
  return `<div class="tree panel r77t"><div class="r77t-head"><b>Áreas</b><span class="r77t-hb"><button type="button" data-k="h" title="Más" aria-label="Más opciones" onclick="r77HeadMenu(event)">⋯</button><button type="button" title="Ocultar el panel" aria-label="Ocultar el panel" onclick="r77THide()">«</button><button type="button" data-k="hc" title="Crear carpeta" aria-label="Crear carpeta" onclick="r77NewFolder(null)">+</button></span></div>${favs.length||fv.length?`<section class="r73-favsec"><b>★ Favoritos</b>${favs.map(l=>lrow(l,0)).join('')}${fv.map(v=>`<button class="treeitem" onclick="r6ApplyView('${v.id}')">▦ ${esc(v.name)}</button>`).join('')}</section>`:''}<div class="r77t-row ${!listFilter?'selected':''}"><button class="r77t-main" onclick="listFilter='';render()"><span class="r77t-ic">◎</span><span class="nm">Todas las listas</span></button></div>${r77Fk(null).map(f=>frow(f,0)).join('')}</div>`};
/* botón para volver a mostrar el panel cuando está oculto */
const r77TreeRender2=render;render=function(){r77TreeRender2();try{const L=document.querySelector('.workspace-layout'),M=L?.querySelector('.workspace-main');document.body.classList.toggle('r77-treeoff',page==='tareas'&&!!r72Store('treeOff'));if(M&&document.body.classList.contains('r77-treeoff')&&!M.querySelector('.r77-show'))M.insertAdjacentHTML('afterbegin','<button type="button" class="r77-show" title="Mostrar áreas, carpetas y listas" onclick="r77TShow()">» Áreas y listas</button>');r77Relabel()}catch(err){console.warn('r77 árbol',err)}};
/* ---------- nombres de estados según la plantilla de la lista ---------- */
function r77Relabel(){if(page!=='tareas')return;const L=r77StLbls();if(!Object.keys(R77_TL).some(k=>(L[k]||k)!==k))return;
  const go1=root=>{if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);
    ns.forEach(n=>{const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(p.tagName))return;const raw=n.nodeValue,t=raw.trim();if(!t)return;
      const key=Object.keys(R77_TL).find(k=>t===k||t.toUpperCase()===k.toUpperCase()&&t===t.toUpperCase());
      if(key&&L[key]&&L[key]!==key){const up=t!==t.toLowerCase()&&t===t.toUpperCase();if(p.tagName==='OPTION'&&!p.hasAttribute('value'))p.setAttribute('value',key);n.nodeValue=raw.replace(t,up?L[key].toUpperCase():L[key]);return}
      if(p.closest('.column')&&p.tagName==='H3'){let s=t;Object.keys(R77_TL).forEach(k=>{if(L[k]&&L[k]!==k)s=s.replace(new RegExp('(^|\\s)'+k+'$'),'$1'+L[k])});if(s!==t)n.nodeValue=raw.replace(t,s)}})};
  go1(document.querySelector('.workspace-main'));go1(document.querySelector('.r6-taskpanel'))}
/* ---------- Configuración › Estados de tarea: solo se cambian los nombres ---------- */
(function(){const cfg=R75_NAV.find(n=>n.sec==='Configuración');R75_MODS.estados=['◎','Estados de tarea'];if(cfg&&!cfg.items.includes('estados'))cfg.items.push('estados');r75Rebuild()})();
function r77StLblSet(k,v){const d=r77Db();d.labels??={};const t=String(v||'').trim();if(!t||t===R77_TL[k])delete d.labels[k];else d.labels[k]=t;save('Nombre de estado actualizado',k)}
function r77StLblReset(){delete r77Db().labels;save('Nombres de estados restablecidos','')}
views.estados=()=>{const L=r77StLbls();return heading('Estados de tarea','Cambia cómo se llaman los estados en todo el espacio de trabajo: listas, tableros, calendario y paneles.',button('Restablecer nombres','r77StLblReset()'))+`<p class="sub">Solo se cambia el nombre que se ve. Son cuatro estados fijos (los usan la ODS y las automatizaciones); sus grupos no cambian.</p><section class="panel"><div class="r77-tst">${Object.keys(R77_TL).map(k=>`<label><small>${R77_TG[k]} · ${k}</small><input value="${esc(L[k])}" onchange="r77StLblSet('${k}',this.value)" aria-label="Nombre del estado ${k}"></label>`).join('')}</div></section>`};
/* limpieza de las antiguas plantillas de listas */
(function(){delete (r77Db().tpl);[...db.folders,...db.lists].forEach(o=>{delete o.tpl})})();

/* «+» de una lista: Crear › Tarea (en esa lista); en la lista CRM, Contacto */
function r77ListCreate(e,id){const l=db.lists.find(x=>x.id===id);if(!l)return;
  r77TPop(e,[{t:l.crm?'Contacto del CRM':'Tarea',d:l.crm?'Registra un contacto nuevo en el CRM.':'Crea tareas individuales para gestionar tu trabajo.',i:'◎',f:()=>{if(l.crm){listFilter=id;taskView='Lista';page='tareas';render();return r77CrmNew()}listFilter=id;page='tareas';r6NewTask(null,'Tarea')}}],{head:'Crear'})}
