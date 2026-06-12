// ─────────────────────────────────────────────
//  LÓGICA DE BÚSQUEDA SkB — con SHA-256
// ─────────────────────────────────────────────

async function hashSHA256(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buscarCodigo() {
  const input = document.getElementById("codigoInput").value.trim().toUpperCase();
  if (!input) return;

  // Muestra estado de carga
  const btn = document.querySelector(".search-button");
  btn.textContent = "...";
  btn.disabled = true;

  const hash = await hashSHA256(input);
  const serie = codigosValidos[hash];

  btn.textContent = "BUSCAR";
  btn.disabled = false;

  if (serie) {
    sessionStorage.setItem("skb_serie", serie);
    window.location.href = "autenticado.html";
  } else {
    window.location.href = "no-autenticado.html";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("codigoInput");

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") buscarCodigo();
  });

  input.addEventListener("input", function () {
    const pos = this.selectionStart;
    this.value = this.value.toUpperCase();
    this.setSelectionRange(pos, pos);
  });
});
