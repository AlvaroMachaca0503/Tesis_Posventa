
/* --------------------------------------------------------------------------
   R7.7 · Lenguaje: las órdenes no se «archivan», se CIERRAN. Todo texto visible
   que diga archivada / archivado / archivar pasa a cerrada / cerrado / cerrar.
   (El dato interno no cambia; solo lo que se lee en pantalla.)
   -------------------------------------------------------------------------- */
const R77_RE=/\b([Aa])rchiv(ad|ar|ó|an)([ao]s?)?\b/g;
function r77Say(s){return String(s).replace(/\b([Ll])a sede\b/g,(m,a)=>a==='L'?'El local':'el local').replace(/\b([Ll])as sedes\b/g,(m,a)=>a==='L'?'Los locales':'los locales').replace(/\b(una|esta|otra|misma) sede\b/g,(m,a)=>({una:'un',esta:'este',otra:'otro',misma:'mismo'}[a])+' local').replace(/\b([Ss])edes\b/g,(m,a)=>a==='S'?'Locales':'locales').replace(/\b([Ss])ede\b/g,(m,a)=>a==='S'?'Local':'local').replace(R77_RE,(m,a,t,suf)=>{const c=a==='A'?'C':'c';if(t==='ad')return c+'errad'+(suf||'');if(t==='ar')return c+'errar';if(t==='ó')return c+'erró';if(t==='an')return c+'erran';return m})}
function r77Texts(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return /rchiv|sede/i.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});const L=[];while(w.nextNode())L.push(w.currentNode);L.forEach(n=>{n.nodeValue=r77Say(n.nodeValue)});root.querySelectorAll?.('[title],[placeholder],[aria-label]').forEach(e=>['title','placeholder','aria-label'].forEach(a=>{const v=e.getAttribute(a);if(v&&/rchiv|sede/i.test(v))e.setAttribute(a,r77Say(v))}))}
const r77TxRender=render;render=function(){r77TxRender();try{r77Texts(document.body)}catch(err){console.warn('r77 textos',err)}};
const r77TxShow=r72Show;r72Show=function(html,ref){r77TxShow(html,ref);try{r77Texts($('modalbody'))}catch{}};
const r77TxModal=modal;modal=function(html){r77TxModal(html);try{r77Texts($('modalbody'))}catch{}};
const r77TxToast=toast;toast=function(s){r77TxToast(r77Say(s))};
