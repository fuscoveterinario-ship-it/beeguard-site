// Botão "Baixar o app Bee Guard": instala o site como app (ícone na tela do celular).
// Android/Chrome: abre a janela de instalação. iPhone e outros: mostra o passo a passo.
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

let pedido = null;
const ouvintes = new Set();
addEventListener("beforeinstallprompt", (ev) => {
  ev.preventDefault();
  pedido = ev;
  ouvintes.forEach((f) => f());
});
addEventListener("appinstalled", () => { pedido = null; ouvintes.forEach((f) => f()); });

export const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
export const podeInstalar = () => !!pedido;
export const aoMudar = (f) => ouvintes.add(f);

export async function instalar() {
  if (!pedido) return false;
  pedido.prompt();
  const { outcome } = await pedido.userChoice;
  pedido = null;
  ouvintes.forEach((f) => f());
  return outcome === "accepted";
}

export function passoAPasso() {
  if (ehIphone()) {
    return `<ol class="ajuda"><li>Abra este site no <b>Safari</b>.</li>
      <li>Toque em <b>Compartilhar</b> (quadrado com a seta para cima).</li>
      <li>Toque em <b>Adicionar à Tela de Início</b> e depois em <b>Adicionar</b>.</li></ol>`;
  }
  if (/android/i.test(navigator.userAgent)) {
    return `<ol class="ajuda"><li>Abra este site no <b>Chrome</b>.</li>
      <li>Toque nos <b>3 pontinhos</b> (canto de cima, à direita).</li>
      <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li></ol>`;
  }
  return `<p class="ajuda">No computador, use o <b>Chrome</b> ou o <b>Edge</b>: clique no ícone de instalar
    na barra de endereço (ou no menu ⋮ → <b>Instalar Bee Guard</b>). No celular fica ainda melhor:
    abra <b>beeguard.com.br</b> e toque em <b>Baixar o app</b>.</p>`;
}

// Liga um botão + uma área de ajuda: instala direto quando dá, senão mostra o passo a passo.
export function ligarBotao(botao, ajuda) {
  const rotulo = botao.textContent.trim() || "Baixar o app Bee Guard";
  const desenhar = () => {
    if (instalado()) {
      botao.textContent = "Abrir meus rastreadores";
      botao.onclick = () => { location.href = "painel.html"; };
      ajuda.hidden = true;
      return;
    }
    botao.textContent = rotulo;
    botao.onclick = async () => {
      if (podeInstalar()) {
        if (await instalar()) {
          ajuda.innerHTML = `<p class="status ok">✓ App instalado! Procure o ícone do Bee Guard na tela do celular.</p>`;
          ajuda.hidden = false;
        }
        return;
      }
      ajuda.innerHTML = passoAPasso();
      ajuda.hidden = false;
    };
  };
  aoMudar(desenhar);
  desenhar();
}
