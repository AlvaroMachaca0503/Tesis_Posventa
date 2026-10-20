
/* --------------------------------------------------------------------------
   R7.7 · Menú lateral tipo acordeón: al abrir una sección se cierran las
   demás y todas se despliegan y pliegan deslizando
   -------------------------------------------------------------------------- */
r75Nav=function(){const nav=$('nav');if(!nav)return;nav.innerHTML=R75_NAV.map(n=>{if(!n.sec)return r75Item(n.id,false);const open=R75.open.has(n.sec),has=n.items.includes(page);
  return `<div class="r75-sec r77-sec ${open?'open':''}" data-sec="${esc(n.sec)}"><button type="button" class="r75-sh ${has?'has':''}" aria-expanded="${open}" onclick="r75Tog('${n.sec}')"><b>${n.icon}</b>${n.sec}<i aria-hidden="true">▾</i></button><div class="r77-body"><div class="r77-it ${open?'r75-items':''}">${n.items.map(id=>r75Item(id,true)).join('')}</div></div></div>`}).join('')};
r75Tog=function(s){const nav=$('nav'),was=R75.open.has(s);R75.open.clear();if(!was)R75.open.add(s);
  nav.querySelectorAll('.r77-sec').forEach(el=>{const me=el.dataset.sec===s,on=me&&!was,it=el.querySelector('.r77-it');el.classList.toggle('open',on);el.querySelector('.r75-sh').setAttribute('aria-expanded',on);if(on)it.classList.add('r75-items');else it.classList.remove('r75-items')})};
r75Nav();
