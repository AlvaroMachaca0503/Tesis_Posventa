
/* --------------------------------------------------------------------------
   Migración y arranque R7.6
   -------------------------------------------------------------------------- */
function r76Ensure(){
  db.tasks.forEach(t=>{if(['En espera','En seguimiento'].includes(t.state))t.state='En proceso'});
  r76Stamp();
  const rep=R75_NAV.find(n=>n.sec==='Reportes');if(rep&&!rep.items.includes('rep_post'))rep.items.unshift('rep_post');
  R75_MODS.rep_post=['☎','Posventa'];R75_TESIS.add('rep_post');r75Rebuild();
}
const r76RenderBase=render;
render=function(){r76Stamp();if(page==='tareas')document.body.classList.remove('r74-focus');r76RenderBase();try{document.body.classList.toggle('r76-tree',page==='tareas'&&!!r72Store('tree'));document.body.classList.toggle('r76-ws',page==='tareas');const nb=document.querySelector('.r72-navbtn');if(nb)nb.title=nb.ariaLabel=page==='tareas'?'Ocultar o mostrar áreas y listas':'Ocultar o mostrar el menú lateral'}catch(e){console.warn('r76 render',e)}};
r76Ensure();
