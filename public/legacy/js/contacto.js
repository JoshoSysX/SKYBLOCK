const menuButton = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
const securityContainer=document.getElementById('turnstileContainer');
const turnstileToken=document.getElementById('turnstileToken');
let turnstileWidgetId=null;
const contactForm=document.getElementById('contactForm');
const emailField=document.getElementById('contactEmailField');
const phoneField=document.getElementById('contactPhoneField');
const emailInput=contactForm.elements.correo;
const phoneInput=contactForm.elements.telefono;

function updateContactChannel() {
  const channel=contactForm.elements.canalContacto.value;
  const usePhone=channel==='telefono';
  emailField.hidden=usePhone;
  phoneField.hidden=!usePhone;
  emailInput.required=!usePhone;
  phoneInput.required=usePhone;
  if(usePhone) emailInput.value=''; else phoneInput.value='';
}

contactForm.querySelectorAll('input[name="canalContacto"]').forEach(input=>input.addEventListener('change',updateContactChannel));
updateContactChannel();

function loadTurnstile(siteKey) {
  if(!siteKey){securityContainer.innerHTML='<span>La verificación estará disponible al publicar la página.</span>';return;}
  const render=()=>{securityContainer.innerHTML='';turnstileWidgetId=window.turnstile.render(securityContainer,{sitekey:siteKey,theme:'light',callback:token=>{turnstileToken.value=token},'expired-callback':()=>{turnstileToken.value=''},'error-callback':()=>{turnstileToken.value=''}})};
  if(window.turnstile){render();return;}
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=render;script.onerror=()=>{securityContainer.innerHTML='<span>No se pudo cargar la verificación de seguridad.</span>'};document.head.appendChild(script);
}

menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuButton.setAttribute('aria-expanded', String(open));
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if(!turnstileToken.value){document.getElementById('formStatus').textContent='Completa la verificación de seguridad.';return;}
  const button = form.querySelector('button');
  button.disabled = true;
  button.innerHTML = 'Enviando…';
  document.getElementById('formStatus').textContent = '';
  parent.postMessage({tipo:'SKYBLOCK_CONTACTO',datos:Object.fromEntries(new FormData(form))},location.origin);
});

addEventListener('message',(event)=>{
  if(event.origin!==location.origin)return;
  if(event.data?.tipo==='SKYBLOCK_CONFIGURACION_PUBLICA'){loadTurnstile(event.data.turnstileSiteKey);return;}
  if(event.data?.tipo!=='SKYBLOCK_CONTACTO_RESULTADO')return;
  const form=contactForm,button=form.querySelector('button');
  document.getElementById('formStatus').textContent=event.data.mensaje;
  button.disabled=false;
  button.innerHTML=event.data.ok?'Mensaje enviado <span>✓</span>':'Enviar mensaje <span>→</span>';
  if(event.data.ok){form.reset();updateContactChannel();}
  turnstileToken.value='';
  if(window.turnstile&&turnstileWidgetId!==null)window.turnstile.reset(turnstileWidgetId);
});

parent.postMessage({tipo:'SKYBLOCK_SOLICITAR_CONFIGURACION_PUBLICA'},location.origin);
