function consultarCodigo(hash) {
  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => { window.removeEventListener('message', recibir);resolve(null); },10000);
    const recibir = (event) => {
      if (event.origin !== location.origin || event.data?.tipo !== 'SKYBLOCK_VERIFICAR_RESULTADO' || event.data.id !== id) return;
      clearTimeout(timeout);window.removeEventListener('message',recibir);resolve(event.data.registro || null);
    };
    window.addEventListener('message',recibir);
    parent.postMessage({tipo:'SKYBLOCK_VERIFICAR_CODIGO',id,hash},location.origin);
  });
}

const form = document.getElementById('verifyForm');
const input = document.getElementById('codigoInput');
const button = document.getElementById('verifyButton');
const message = document.getElementById('verifyMessage');
const modal = document.getElementById('verifyModal');
const result = modal.querySelector('.verify-result');

async function hashSHA256(text) {
  const bytes = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function showResult(record) {
  const authentic = Boolean(record && record.status !== 'blocked');
  result.classList.toggle('rejected', !authentic);
  resultEyebrow.textContent = authentic ? 'Registro privado / Coincidencia exacta' : 'Registro privado / Sin coincidencias';
  resultTitle.textContent = authentic ? 'AUTENTICIDAD CONFIRMADA' : 'IDENTIDAD NO ENCONTRADA';
  resultText.textContent = authentic
    ? 'El sello ha sido reconocido. Esta pieza pertenece a una edición legítima registrada en los archivos de SKYBLOCK STUDIO.'
    : 'El código no aparece en nuestro registro. Revisa cada carácter o contacta con nosotros antes de asumir que la pieza es original.';
  resultMark.textContent = authentic ? '✦' : '×';
  resultSerie.hidden = !authentic;
  propietarioNombre.textContent = authentic ? (record.owner || 'Sin registrar') : '—';
  serieNumero.textContent = authentic ? record.series : '—';
  coleccionNombre.textContent = authentic ? (record.collection || 'Sin colección') : '—';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
  setTimeout(() => resultClose.focus(), 100);
}

function closeResult() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lock');
  input.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const code = input.value.trim().toUpperCase();
  if (!code) {
    message.textContent = 'Escribe el código de tu etiqueta para continuar.';
    input.focus();
    return;
  }

  message.textContent = '';
  button.disabled = true;
  button.querySelector('span').textContent = 'Comprobando';
  systemState.textContent = 'Leyendo archivo…';
  try {
    const hash = await hashSHA256(code);
    const record = await consultarCodigo(hash);
    showResult(record);
  } catch {
    message.textContent = 'No se pudo completar la verificación en este navegador.';
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'Verificar pieza';
    systemState.textContent = 'Sistema listo';
  }
});

input.addEventListener('input', () => {
  const position = input.selectionStart;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(position, position);
  message.textContent = '';
});

resultClose.addEventListener('click', closeResult);
resultAgain.addEventListener('click', () => { input.value = ''; closeResult(); });
modal.addEventListener('click', (event) => { if (event.target === modal) closeResult(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closeResult(); });

menuBtn.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  document.body.classList.toggle('lock', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
