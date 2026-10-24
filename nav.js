// Navegação das páginas internas: botão "Voltar" no topo e as abas de baixo (as mesmas do painel).
// Cada página diz qual aba fica acesa em <body data-aba="...">; data-aba="nenhuma" mostra só o Voltar.
const ICONE = {
  inicio: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15"></path>',
  apiarios: '<path d="M12 2l8.66 5v10L12 22l-8.66-5V7z"></path>',
  alertas: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
  mais: '<path d="M4 6h16 M4 12h16 M4 18h16"></path>',
};
const ABAS = [
  ["inicio", "painel.html", "Início"],
  ["apiarios", "painel.html#apiarios/lista", "Apiários"],
  ["alertas", "painel.html#alertas", "Alertas"],
  ["mais", "painel.html#mais", "Mais"],
];
const svg = (d, t) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" aria-hidden="true">${d}</svg>`;

const aba = document.body.dataset.aba || "mais";
const header = document.querySelector("header");

// Voltar: para a página de onde veio (se veio do próprio site); senão, para o painel.
if (header) {
  const voltar = document.createElement("a");
  voltar.className = "voltar sem-impressao";
  voltar.href = aba === "nenhuma" ? "index.html" : "painel.html";
  voltar.innerHTML = `${svg('<path d="M15 5l-7 7 7 7"></path>', 22)}<span>Voltar</span>`;
  voltar.addEventListener("click", (ev) => {
    let doSite = false;
    try { doSite = new URL(document.referrer).origin === location.origin; } catch { /* sem origem */ }
    if (doSite && history.length > 1) { ev.preventDefault(); history.back(); }
  });
  header.prepend(voltar);
}

if (aba !== "nenhuma") {
  const nav = document.createElement("nav");
  nav.className = "tabbar sem-impressao";
  nav.id = "tabbar";
  nav.setAttribute("aria-label", "Navegação");
  nav.innerHTML = ABAS.map(([id, href, nome]) =>
    `<a href="${href}"${id === aba ? ' class="ativo" aria-current="page"' : ""}>${svg(ICONE[id], 26)}${nome}</a>`).join("");
  document.body.append(nav);
}
