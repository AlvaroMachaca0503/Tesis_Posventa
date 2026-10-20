
/* --------------------------------------------------------------------------
   R7.7 · Inicio de sesión de demostración
   No hay autenticación real: los botones «provisionales» entran simulando cada
   rol. La sesión dura lo que dura la pestaña. Con #sinlogin en la dirección se
   omite (lo usan las pruebas automáticas).
   -------------------------------------------------------------------------- */
const R77_SK='rm77-session';
const R77_LOGIN_ROLES=[['u-admin','Superusuario','Ve y configura todo'],['u-jefe','Jefe de taller','Órdenes, citas, agenda y aprobaciones'],['u-caja','Cajera','Atención, cotización, cobro y CRM'],['u-juan','Técnico','Sus servicios y tareas'],['u-logistica','Logístico','Productos, compras e inventario'],['u-externo','Técnico externo','Solo lo que se le asigna'],['u-finanzas','Asistente administrativo de finanzas','Bancos, pagos, cobros y reportes']];
function r77LoginShow(){if($('r77login'))return;const d=document.createElement('div');d.id='r77login';d.className='r77-login';d.setAttribute('role','dialog');d.setAttribute('aria-label','Iniciar sesión');
  d.innerHTML=`<div class="r77-lcard"><div class="r77-llogo">R <b>Motriz</b></div><p class="sub">Posventa · Workspace</p><h1>Iniciar sesión</h1>
  <label>Usuario<input disabled placeholder="usuario@empresa.com"></label><label>Contraseña<input type="password" disabled placeholder="••••••••"></label><button type="button" class="primary" disabled>Ingresar</button><p class="sub">La autenticación real todavía no existe en el prototipo.</p>
  <div class="r77-lsim"><b>Provisional · ingresar simulando un rol</b><div class="r77-lgrid">${R77_LOGIN_ROLES.filter(r=>db.users.some(u=>u.id===r[0]&&u.active)).map(r=>`<button type="button" onclick="r77Enter('${r[0]}')"><b>${esc(r[1])}</b><small>${esc(r[2])}</small></button>`).join('')}</div></div></div>`;
  document.body.appendChild(d);d.querySelector('.r77-lgrid button')?.focus()}
function r77Enter(uid){if(!db.users.some(u=>u.id===uid))return;try{sessionStorage.setItem(R77_SK,uid)}catch{}actor=uid;$('r77login')?.remove();try{closeModal()}catch{}page=['inicio','ods','tareas'].find(x=>r77Lv(x)!=='-')||'tareas';listFilter='';render()}
function r77Logout(){try{sessionStorage.removeItem(R77_SK)}catch{}r77LoginShow()}
openLogin=function(){r77LoginShow()};
(function(){let s=null;try{s=sessionStorage.getItem(R77_SK)}catch{}if(s&&db.users.some(u=>u.id===s&&u.active)){actor=s;return}if(/sinlogin|encuesta=/.test(location.hash))return;setTimeout(r77LoginShow,0)})();
