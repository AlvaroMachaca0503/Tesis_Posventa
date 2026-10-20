
/* --------------------------------------------------------------------------
   R7.7 · Todas las ventanas (modales) tienen una X pequeña arriba a la
   derecha, siempre visible aunque se baje por el contenido. Cierra igual que
   el botón de abajo (Cerrar / Cancelar / Salir). Lo que se edita en la propia
   ventana ya se guarda solo; al cerrar con la X se confirma lo pendiente.
   -------------------------------------------------------------------------- */
const R77M={dirty:false};
function r77ModalX(){const m=$('modal');if(!m?.open)return;const a=document.activeElement;if(a&&m.contains(a)&&!a.classList?.contains('r77-x')){try{a.blur()}catch{}}
  setTimeout(()=>{if(!m.open)return;const ed=m.querySelector('form#editor');
    if(ed&&R77M.dirty&&!confirm('Hay datos escritos que aún no se guardaron. ¿Cerrar sin guardarlos?'))return;
    const btn=[...m.querySelectorAll('footer button, .r77-foot button')].find(b=>/^(salir|cerrar|cancelar|volver)$/i.test(b.textContent.trim()));
    if(btn&&!btn.disabled)btn.click();else closeModal()},0)}
(function(){const m=$('modal');if(!m||m.querySelector('.r77-xw'))return;m.insertAdjacentHTML('afterbegin','<div class="r77-xw"><button type="button" class="r77-x" aria-label="Cerrar" title="Cerrar" onclick="r77ModalX()">✕</button></div>');
  m.addEventListener('input',e=>{if(e.target.closest?.('form#editor'))R77M.dirty=true});m.addEventListener('close',()=>{R77M.dirty=false})})();
