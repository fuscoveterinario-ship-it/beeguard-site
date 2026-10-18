// "Agilize seu boletim de ocorrência": dados opcionais (nome, CPF, valor da colmeia) usados só
// para o boletim de ocorrência sair preenchido em caso de roubo. Usado no painel, em
// meus-dados.html e no próprio boletim.
import { sb, esc, errorText } from "./app.js";

export const somenteNumeros = (s) => String(s || "").replace(/\D/g, "");

// Confere os dígitos verificadores do CPF.
export function cpfValido(cpf) {
  const c = somenteNumeros(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (const n of [9, 10]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[n])) return false;
  }
  return true;
}

export const fmtCpf = (c) => (c && c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : c || "");
export const fmtReais = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Desenha o formulário em `el`. opts: { perfil, titulo, texto, agoraNao, apagar, aoSalvar, aoFechar }
export function formDados(el, opts) {
  const p = opts.perfil || {};
  el.innerHTML = `
    <h2>${esc(opts.titulo || "Agilize seu boletim de ocorrência (opcional)")}</h2>
    <p>${opts.texto || `Se acontecer um roubo, o Bee Guard gera o relatório para a polícia <b>já preenchido</b>.
      Você só confere e envia.`}</p>
    <p class="msg">Esses dados são usados <b>somente para isso</b>. Ninguém mais vê, e você pode apagar quando quiser.</p>
    <form class="f-dados">
      <label>Nome completo<input name="nome" autocomplete="name" maxlength="120" value="${esc(p.nome || "")}"></label>
      <label>CPF<input name="cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" value="${esc(fmtCpf(p.cpf))}"></label>
      <label>Valor médio de uma colmeia (R$)<input name="valor" inputmode="decimal" placeholder="Ex.: 800"
        value="${p.valor_colmeia == null ? "" : esc(String(p.valor_colmeia).replace(".", ","))}"></label>
      <button>Salvar</button>
      ${opts.agoraNao ? `<button type="button" class="secundario" data-agora-nao>Agora não</button>` : ""}
      ${opts.apagar && p.preenchido ? `<button type="button" class="link" data-apagar>Apagar meus dados</button>` : ""}
      <p class="erro" data-erro></p>
    </form>`;
  const f = el.querySelector("form"), erro = el.querySelector("[data-erro]");
  f.onsubmit = async (ev) => {
    ev.preventDefault();
    erro.textContent = "";
    const cpf = somenteNumeros(f.cpf.value);
    if (cpf && !cpfValido(cpf)) return (erro.textContent = "CPF inválido. Confira os números.");
    const v = f.valor.value.trim() ? Number(f.valor.value.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".")) : null;
    if (v !== null && !(v >= 0)) return (erro.textContent = "Valor inválido. Use só números, ex.: 800.");
    const btn = f.querySelector("button");
    btn.disabled = true;
    const { error } = await sb.rpc("colmeia_save_profile", { p_name: f.nome.value, p_cpf: cpf || null, p_hive_value: v });
    btn.disabled = false;
    if (error) return (erro.textContent = errorText(error));
    opts.aoSalvar?.({ nome: f.nome.value.trim() || null, cpf: cpf || null, valor_colmeia: v, preenchido: true });
  };
  el.querySelector("[data-agora-nao]")?.addEventListener("click", async () => {
    await sb.rpc("colmeia_close_profile_prompt");
    opts.aoFechar?.();
  });
  el.querySelector("[data-apagar]")?.addEventListener("click", async () => {
    if (!confirm("Apagar seu nome, CPF e valor da colmeia? O boletim de ocorrência vai sair em branco.")) return;
    const { error } = await sb.rpc("colmeia_delete_profile");
    if (error) return alert(errorText(error));
    opts.aoSalvar?.({ preenchido: false });
  });
}

// Estado pelo DDD do telefone (+55 DD ...), para o link do B.O. online da Polícia Civil.
const UF_DDD = {
  "São Paulo": [11, 12, 13, 14, 15, 16, 17, 18, 19], "Rio de Janeiro": [21, 22, 24], "Espírito Santo": [27, 28],
  "Minas Gerais": [31, 32, 33, 34, 35, 37, 38], "Paraná": [41, 42, 43, 44, 45, 46], "Santa Catarina": [47, 48, 49],
  "Rio Grande do Sul": [51, 53, 54, 55], "Distrito Federal": [61], "Goiás": [62, 64], "Tocantins": [63],
  "Mato Grosso": [65, 66], "Mato Grosso do Sul": [67], "Acre": [68], "Rondônia": [69],
  "Bahia": [71, 73, 74, 75, 77], "Sergipe": [79], "Pernambuco": [81, 87], "Alagoas": [82], "Paraíba": [83],
  "Rio Grande do Norte": [84], "Ceará": [85, 88], "Piauí": [86, 89], "Pará": [91, 93, 94], "Amazonas": [92, 97],
  "Roraima": [95], "Amapá": [96], "Maranhão": [98, 99],
};
export function estadoDoTelefone(tel) {
  const m = /^\+55(\d\d)/.exec(tel || "");
  if (!m) return null;
  return Object.keys(UF_DDD).find((uf) => UF_DDD[uf].includes(Number(m[1]))) || null;
}
