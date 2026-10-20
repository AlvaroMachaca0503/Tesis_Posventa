
/* --------------------------------------------------------------------------
   Tablas angostas: el ancho de cada columna se calcula según su contenido
   (máximo 150 px; Acciones y Nro. no se tocan) y el usuario lo cambia
   arrastrando el borde de la cabecera. Se guarda por usuario y por tabla;
   doble clic en el borde restablece la columna.
   -------------------------------------------------------------------------- */
const R75_MIN=48,R75_MAX=150,R75_FLOOR=52;
function r75CW(){db.r75cw??={};return db.r75cw[actor]??={}}
function r75Fit(root=document){root.querySelectorAll('table.r74-t').forEach(t=>{if(t.dataset.r75==='1'||!t.tHead)return;const hr=t.tHead.rows[0],n=hr.cells.length,stored=r75CW()[t.dataset.sig];
  let w=stored&&stored.length===n?stored.slice():null;
  if(!w){t.classList.add('r75-measure');const rows=[...t.tBodies[0].rows].filter(r=>!r.querySelector('.empty')).slice(0,40);w=[...hr.cells].map((th,j)=>{let m=th.classList.contains('r74-nro')?0:th.scrollWidth;rows.forEach(r=>{const c=r.cells[j];if(c)m=Math.max(m,c.scrollWidth)});const act=th.classList.contains('r74-act'),nro=th.classList.contains('r74-nro');return nro?46:act?Math.ceil(m+4):Math.max(R75_MIN,Math.min(R75_MAX,Math.ceil(m+4)))});t.classList.remove('r75-measure');
    const box=t.closest('.panel,.r74-tw')||t.parentElement,room=(box?.clientWidth||0)-26;
    if(room>300){const flex=[...hr.cells].map((th,j)=>!(th.classList.contains('r74-nro')||th.classList.contains('r74-act')));let tot=w.reduce((a,b)=>a+b,0),guard=0;while(tot>room&&guard++<40){const big=w.reduce((bi,x,j)=>flex[j]&&x>R75_FLOOR&&(bi<0||x>w[bi])?j:bi,-1);if(big<0)break;const cut=Math.min(w[big]-R75_FLOOR,Math.max(4,Math.ceil((tot-room)/3)));w[big]-=cut;tot-=cut}}}
  t.querySelector('colgroup')?.remove();t.insertAdjacentHTML('afterbegin','<colgroup>'+w.map(x=>`<col style="width:${x}px">`).join('')+'</colgroup>');t.style.width=w.reduce((a,b)=>a+b,0)+'px';t.classList.add('r75-fixed');t.dataset.r75='1';
  [...hr.cells].forEach((th,j)=>{if(th.classList.contains('r74-nro')||th.classList.contains('r74-act'))return;th.insertAdjacentHTML('beforeend',`<span class="r75-rz" title="Arrastra para cambiar el ancho · doble clic para restablecer" data-j="${j}"></span>`)})})}
let r75Drag=null;
document.addEventListener('mousedown',e=>{const h=e.target.closest?.('.r75-rz');if(!h)return;e.preventDefault();e.stopPropagation();const t=h.closest('table'),j=+h.dataset.j,col=t.querySelectorAll('col')[j];r75Drag={t,j,col,x:e.clientX,w:parseInt(col.style.width)||h.parentElement.offsetWidth};document.body.classList.add('r75-resizing')},true);
document.addEventListener('mousemove',e=>{if(!r75Drag)return;const {t,col,x,w}=r75Drag;col.style.width=Math.max(40,w+e.clientX-x)+'px';t.style.width=[...t.querySelectorAll('col')].reduce((a,c)=>a+(parseInt(c.style.width)||0),0)+'px'});
document.addEventListener('mouseup',()=>{if(!r75Drag)return;const {t}=r75Drag;r75Drag=null;document.body.classList.remove('r75-resizing');r75CW()[t.dataset.sig]=[...t.querySelectorAll('col')].map(c=>parseInt(c.style.width));try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}});
document.addEventListener('click',e=>{if(e.target.closest?.('.r75-rz'))e.stopPropagation()},true);
document.addEventListener('dblclick',e=>{const h=e.target.closest?.('.r75-rz');if(!h)return;const t=h.closest('table');delete r75CW()[t.dataset.sig];try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}t.dataset.r75='';t.querySelector('colgroup')?.remove();t.querySelectorAll('.r75-rz').forEach(x=>x.remove());t.style.width='';t.classList.remove('r75-fixed');r75Fit(t.parentElement)});
const r75ShowBase=r72Show;r72Show=function(html,ref){r75ShowBase(html,ref);r75Fit($('modalbody'))};
