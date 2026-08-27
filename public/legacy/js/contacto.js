const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');

menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

document.getElementById('contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  button.innerHTML = 'Enviando…';
  document.getElementById('formStatus').textContent = '';
  parent.postMessage({tipo:'SKYBLOCK_CONTACTO',datos:Object.fromEntries(new FormData(form))},location.origin);
});

addEventListener('message',(event)=>{
  if(event.origin!==location.origin||event.data?.tipo!=='SKYBLOCK_CONTACTO_RESULTADO')return;
  const form=document.getElementById('contactForm'),button=form.querySelector('button');
  document.getElementById('formStatus').textContent=event.data.mensaje;
  button.disabled=false;
  button.innerHTML=event.data.ok?'Mensaje enviado <span>✓</span>':'Enviar mensaje <span>→</span>';
  if(event.data.ok)form.reset();
});
