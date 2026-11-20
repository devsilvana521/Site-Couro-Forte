/* =====================================================================
   COURO FORTE — Painel da fábrica (pedidos + representantes)
   Os dados são lidos e salvos pelo arquivo dados.js
   (neste computador ou na planilha do Google, conforme o config.js).
   ===================================================================== */

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const SITUACOES_PED = ["Novo", "Confirmado", "Em produção", "Enviado", "Entregue", "Cancelado"];
const WHATS_FABRICA = "553433150163";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const semAcento = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const soNumeros = (t) => String(t ?? "").replace(/\D/g, "");
const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (d) => (d ? String(d).slice(0, 10).split("-").reverse().join("/") : "—");
const dataHora = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
const reais = (v) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? "A combinar" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
// ---------- dinheiro, pagamentos e comissão ----------
const FORMAS = ["A combinar", "Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito à vista", "Cartão de crédito parcelado", "Boleto"];
const A_VISTA = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito à vista"];
const PRAZOS = [["À vista", 1, 0], ["30 dias", 1, 30], ["30/60", 2, 30], ["30/60/90", 3, 30], ["30/60/90/120", 4, 30]];
/** transforma "1.234,56", "199,9" ou 199.9 em número */
const num = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const t = String(v).replace(/[^\d,.-]/g, "");
  const x = t.includes(",") ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : parseFloat(t);
  return isNaN(x) ? 0 : x;
};
const r2 = (v) => Math.round(v * 100) / 100;
const dinheiroCampo = (v) => (num(v) ? num(v).toFixed(2).replace(".", ",") : "");
const somaDias = (iso, dias) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); };
const precoItem = (i) => num(i.precoUnit !== undefined && i.precoUnit !== "" ? i.precoUnit : i.preco);
const temValor = (p) => (p.itens || []).some((i) => precoItem(i) > 0);
function calcular(p) {
  const produtos = r2((p.itens || []).reduce((s, i) => s + precoItem(i) * (Number(i.qtd) || 0), 0));
  const desconto = num(p.desconto), frete = num(p.frete);
  const base = Math.max(0, r2(produtos - desconto));            // comissão é sobre os produtos (sem o frete)
  const total = Math.max(0, r2(produtos - desconto + frete));
  const comissao = r2(base * num(p.comissaoPct) / 100);
  return { produtos, desconto, frete, base, total, comissao };
}
const totalPedido = (p) => (temValor(p) ? calcular(p).total : null);
function situacaoPagamento(p) {
  const pg = p.pagamento || {};
  const parc = Array.isArray(pg.parcelas) ? pg.parcelas : [];
  const hojeS = hoje();
  const pagas = parc.filter((x) => x.pago);
  const atrasadas = parc.filter((x) => !x.pago && x.vencimento && x.vencimento < hojeS);
  const recebido = r2(pagas.reduce((s, x) => s + num(x.valor), 0));
  const aberto = r2(parc.filter((x) => !x.pago).reduce((s, x) => s + num(x.valor), 0));
  let txt, cls;
  if (!parc.length) { txt = "A definir"; cls = "off"; }
  else if (pagas.length === parc.length) { txt = "Pago"; cls = "ok"; }
  else if (atrasadas.length) { txt = `${atrasadas.length} atrasada${atrasadas.length > 1 ? "s" : ""}`; cls = "atraso"; }
  else if (parc.length === 1) { txt = "A receber"; cls = "analise"; }
  else { txt = `${pagas.length}/${parc.length} pagas`; cls = "analise"; }
  return { forma: pg.forma || "A combinar", txt, cls, recebido, aberto, atrasadas: atrasadas.length, parc };
}
const fotoP = (f) => encodeURI(/^(\.?\/|https?:)/.test(f || "") ? f : "./fotos/p/" + f);
const zap = (tel, msg) => `https://wa.me/55${soNumeros(tel)}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
const paresTxt = (n) => `${n} ${Number(n) === 1 ? "par" : "pares"}`;
const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// ---------- Modo claro / escuro ----------
function aplicarTema(tema) {
  if (tema === "escuro") document.documentElement.setAttribute("data-tema", "escuro");
  else document.documentElement.removeAttribute("data-tema");
  $$(".tema button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tema === tema));
  try { localStorage.setItem("cf-tema", tema); } catch (e) {}
}
aplicarTema(document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro");
$$(".tema button").forEach((b) => b.addEventListener("click", () => aplicarTema(b.dataset.tema)));

// ---------- Avisos ----------
let tAviso;
function avisar(msg, erro = false) {
  const a = $("#rAviso");
  a.textContent = msg;
  a.classList.toggle("erro", erro);
  a.classList.add("show");
  clearTimeout(tAviso);
  tAviso = setTimeout(() => a.classList.remove("show"), 3800);
}

// ---------- Estado ----------
let reps = [];
let pedidos = [];

$("#modo").innerHTML = Dados.online()
  ? `<i class="fa-solid fa-cloud"></i> Ligado à planilha do Google: todos os computadores e celulares veem os mesmos dados.`
  : `<i class="fa-solid fa-computer"></i> Salvando neste computador. Pedidos feitos em outros celulares chegam pelo WhatsApp.`;
$("#textoBackup").innerHTML = Dados.online()
  ? "Os dados ficam na sua planilha do Google. Mesmo assim, baixe a planilha ou faça um backup de vez em quando."
  : "Os dados ficam salvos <strong>neste computador, neste navegador</strong>. Faça um backup de vez em quando. Com ele você também passa tudo para outro computador.";

async function carregar() {
  $("#carregando").hidden = false;
  try {
    const d = await Dados.carregarTudo();
    reps = d.reps || [];
    pedidos = (d.pedidos || []).map((p) => ({ ...p, itens: Array.isArray(p.itens) ? p.itens : [] }));
    $("#login").hidden = true;
    $("#conteudo").hidden = false;
    $("#topoBtns").hidden = false;
    $("#sair").hidden = false;
    tudo();
  } catch (e) {
    if (Dados.online()) {
      mostrarLogin("online");
      if (Dados.temSenha()) { $("#loginErro").textContent = e.message; $("#loginErro").hidden = false; }
    } else {
      avisar(e.message, true);
    }
  } finally {
    $("#carregando").hidden = true;
  }
}

// ---------- Login do administrador ----------
// Planilha ligada: a senha é a do script da planilha (protege os dados de verdade).
// Sem planilha: a senha é criada no primeiro acesso e fica guardada neste computador.
const K_HASH = "cf-admin-senha";
const K_SESSAO = "cf-admin-ok";
let modoLogin = "entrar";

async function resumo(t) {
  const txt = "couroforte|" + t;
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    let h = 5381;
    for (const c of txt) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return "s" + h.toString(16);
  }
}
const ler = (k, area = localStorage) => { try { return area.getItem(k); } catch (e) { return null; } };
const gravar = (k, v, area = localStorage) => { try { area.setItem(k, v); } catch (e) {} };
const apagar = (k, area = localStorage) => { try { area.removeItem(k); } catch (e) {} };

function mostrarLogin(modo) {
  modoLogin = modo;
  const textos = {
    online: ["Área do administrador", "Digite a senha que você colocou no script da planilha do Google.", "Entrar", ""],
    criar: ["Crie a senha do administrador", "É o primeiro acesso. Escolha uma senha (mínimo 4 letras ou números) para proteger o painel.", "Criar senha e entrar", "Anote a senha num lugar seguro."],
    trocar: ["Trocar a senha", "Digite a nova senha duas vezes.", "Salvar nova senha", ""],
    entrar: ["Área do administrador", "Digite a senha para entrar no painel.", "Entrar", ""],
  }[modo];
  $("#loginTitulo").textContent = textos[0];
  $("#loginTexto").textContent = textos[1];
  $("#loginBtn").innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> ${textos[2]}`;
  $("#loginDica").textContent = textos[3];
  $("#senha2Box").hidden = !(modo === "criar" || modo === "trocar");
  $("#senha").autocomplete = modo === "criar" || modo === "trocar" ? "new-password" : "current-password";
  $("#loginCancelar").hidden = modo !== "trocar";
  $("#senha").value = ""; $("#senha2").value = "";
  $("#loginErro").hidden = true;
  $("#conteudo").hidden = true;
  $("#topoBtns").hidden = true;
  $("#sair").hidden = modo !== "trocar";
  $("#carregando").hidden = true;
  $("#login").hidden = false;
  setTimeout(() => $("#senha").focus(), 50);
}
function erroLogin(msg) {
  $("#loginErro").textContent = msg;
  $("#loginErro").hidden = false;
  $("#senha").select();
}

$("#login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const s1 = $("#senha").value.trim();
  const s2 = $("#senha2").value.trim();
  if (!s1) return erroLogin("Digite a senha.");
  $("#loginErro").hidden = true;

  if (modoLogin === "online") {
    Dados.definirSenha(s1);
    try { await Dados.verificarSenha(); await carregar(); }
    catch (err) { Dados.esquecerSenha(); erroLogin(err.message); }
    return;
  }
  if (modoLogin === "criar" || modoLogin === "trocar") {
    if (s1.length < 4) return erroLogin("A senha precisa ter pelo menos 4 letras ou números.");
    if (s1 !== s2) return erroLogin("As duas senhas não são iguais.");
    gravar(K_HASH, await resumo(s1));
    gravar(K_SESSAO, "1", sessionStorage);
    if (modoLogin === "trocar") avisar("Senha trocada!");
    return carregar();
  }
  // entrar
  if ((await resumo(s1)) !== ler(K_HASH)) return erroLogin("Senha errada.");
  gravar(K_SESSAO, "1", sessionStorage);
  carregar();
});
$$("[data-ver-senha]").forEach((b) => b.addEventListener("click", () => {
  const campo = $("#" + b.dataset.verSenha);
  campo.type = campo.type === "password" ? "text" : "password";
  b.innerHTML = campo.type === "password" ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
}));
$("#loginCancelar").addEventListener("click", () => carregar());

$("#sair").addEventListener("click", () => {
  apagar(K_SESSAO, sessionStorage);
  if (Dados.online()) Dados.esquecerSenha();
  reps = []; pedidos = [];
  mostrarLogin(Dados.online() ? "online" : "entrar");
});
$("#trocarSenha").addEventListener("click", () => {
  if (Dados.online()) {
    avisar("Com a planilha ligada, a senha é trocada no script da planilha (veja o PLANILHA-GOOGLE.txt).", true);
    return;
  }
  mostrarLogin("trocar");
});

$("#atualizar").addEventListener("click", async () => {
  const b = $("#atualizar i");
  b.classList.add("fa-spin");
  await carregar();
  b.classList.remove("fa-spin");
  avisar("Lista atualizada.");
});

function tudo() {
  $("#abaNPed").textContent = pedidos.length;
  $("#abaNRep").textContent = reps.length;
  preencherFiltros();
  renderPedidos();
  renderVendas();
  renderReps();
}

// ---------- Abas ----------
function abrirAba(qual) {
  $$(".aba").forEach((a) => a.classList.toggle("active", a.dataset.aba === qual));
  $("#aba-pedidos").hidden = qual !== "pedidos";
  $("#aba-representantes").hidden = qual !== "representantes";
  try { history.replaceState(null, "", "#" + qual); } catch (e) {}
}
$$(".aba").forEach((a) => a.addEventListener("click", () => abrirAba(a.dataset.aba)));
if (location.hash === "#representantes") abrirAba("representantes");

// ---------- Vendas por representante ----------
function vendasDe(repId, nome) {
  const lista = pedidos.filter((p) => p.status !== "Cancelado" &&
    (repId ? p.representanteId === repId : (!p.representanteId && (nome === undefined ? !p.representante : p.representante === nome))));
  const comValor = lista.filter(temValor);
  const comissao = r2(lista.reduce((s, p) => s + calcular(p).comissao, 0));
  const comissaoPaga = r2(lista.filter((p) => p.comissaoPaga).reduce((s, p) => s + calcular(p).comissao, 0));
  return {
    pedidos: lista.length,
    pares: lista.reduce((s, p) => s + (Number(p.pares) || 0), 0),
    valor: comValor.length ? r2(comValor.reduce((s, p) => s + calcular(p).total, 0)) : null,
    comissao, comissaoAPagar: r2(comissao - comissaoPaga),
  };
}
function renderVendas() {
  const linhas = reps.map((r) => ({ nome: r.nome, cidade: r.cidade, uf: r.uf, id: r.id, ...vendasDe(r.id) }));
  // vendas de "outros" (nome digitado, sem cadastro)
  const soltos = [...new Set(pedidos.filter((p) => !p.representanteId && p.representante).map((p) => p.representante))];
  soltos.forEach((n) => linhas.push({ nome: n, cidade: "sem cadastro", uf: "", id: "", ...vendasDe("", n) }));
  linhas.push({ nome: "Direto com a fábrica", cidade: "", uf: "", id: "", direto: true, ...vendasDe("") });
  const comVenda = linhas.filter((l) => l.pedidos > 0).sort((a, b) => b.pares - a.pares);
  $("#vendasRep").innerHTML = comVenda.length
    ? comVenda.map((l, i) => `
      <button class="venda ${l.direto ? "direto" : ""}" data-ver-rep="${esc(l.direto ? "__direto" : l.id || l.nome)}">
        <span class="pos">${l.direto ? '<i class="fa-solid fa-industry"></i>' : i + 1 + "º"}</span>
        <div><strong>${esc(l.nome)}</strong><small>${esc(l.cidade)}${l.uf ? "/" + esc(l.uf) : ""}</small></div>
        <div class="venda-n"><b>${l.pares}</b><small>${l.pares === 1 ? "par" : "pares"} · ${l.pedidos} pedido${l.pedidos > 1 ? "s" : ""}</small>${l.valor !== null ? `<small class="v-valor">${reais(l.valor)}</small>` : ""}</div>
        ${l.comissao > 0 ? `<div class="venda-com"><span>Comissão</span><b>${reais(l.comissao)}</b>${l.comissaoAPagar > 0 ? `<em>a pagar ${reais(l.comissaoAPagar)}</em>` : `<em class="ok">paga</em>`}</div>` : ""}
      </button>`).join("")
    : `<p class="vendas-vazio">As vendas de cada representante aparecem aqui quando chegarem pedidos.</p>`;
}
$("#vendasRep").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ver-rep]");
  if (!b) return;
  $("#pFiltroRep").value = b.dataset.verRep;
  renderPedidos();
  $(".filtros-ped").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---------- Filtros ----------
function preencherFiltros() {
  const selR = $("#pFiltroRep"), atualR = selR.value;
  const soltos = [...new Set(pedidos.filter((p) => !p.representanteId && p.representante).map((p) => p.representante))];
  selR.innerHTML = `<option value="">Representante: todos</option><option value="__direto">Direto com a fábrica</option>` +
    [...reps].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((r) => `<option value="${esc(r.id)}">${esc(r.nome)}</option>`).join("") +
    soltos.map((n) => `<option value="${esc(n)}">${esc(n)} (sem cadastro)</option>`).join("");
  selR.value = [...selR.options].some((o) => o.value === atualR) ? atualR : "";

  const selS = $("#pFiltroSit"), atualS = selS.value;
  selS.innerHTML = `<option value="">Situação: todas</option>` + SITUACOES_PED.map((s) => `<option>${s}</option>`).join("");
  selS.value = atualS;

  const selU = $("#rFiltroUF"), atualU = selU.value;
  const usados = [...new Set(reps.map((r) => r.uf))].filter(Boolean).sort();
  selU.innerHTML = `<option value="">Estado: todos</option>` + usados.map((u) => `<option>${u}</option>`).join("");
  selU.value = usados.includes(atualU) ? atualU : "";
}

// ---------- Lista de pedidos ----------
const classeSitPed = (s) => ({ "Novo": "novo", "Confirmado": "analise", "Em produção": "analise", "Enviado": "ok", "Entregue": "ok", "Cancelado": "off" }[s] || "novo");
function nomeRep(p) {
  if (p.representanteId) { const r = reps.find((x) => x.id === p.representanteId); return r ? r.nome : (p.representante || "Representante excluído"); }
  return p.representante || "";
}

function renderPedidos() {
  const termo = semAcento($("#pBusca").value.trim());
  const fRep = $("#pFiltroRep").value;
  const fSit = $("#pFiltroSit").value;
  const mes = hoje().slice(0, 7);

  $("#pTotal").textContent = pedidos.length;
  $("#pPares").textContent = pedidos.filter((p) => p.status !== "Cancelado").reduce((s, p) => s + (Number(p.pares) || 0), 0);
  const novos = pedidos.filter((p) => p.status === "Novo").length;
  $("#pNovos").textContent = novos ? `${novos} novo${novos > 1 ? "s" : ""} para conferir` : "";
  const doMes = pedidos.filter((p) => String(p.data || "").slice(0, 7) === mes).length;
  $("#pMes").textContent = `${doMes} pedido${doMes === 1 ? "" : "s"} este mês`;
  const validos = pedidos.filter((p) => p.status !== "Cancelado");
  const vendido = r2(validos.filter(temValor).reduce((s, p) => s + calcular(p).total, 0));
  const sits = validos.map(situacaoPagamento);
  const recebido = r2(sits.reduce((s, x) => s + x.recebido, 0));
  const aReceber = r2(sits.reduce((s, x) => s + x.aberto, 0));
  const atrasadas = sits.reduce((s, x) => s + x.atrasadas, 0);
  $("#pVendido").textContent = reais(vendido);
  $("#pRecebido").textContent = `recebido ${reais(recebido)}`;
  $("#pReceber").textContent = reais(aReceber);
  $("#pAtraso").textContent = atrasadas ? `${atrasadas} parcela${atrasadas > 1 ? "s" : ""} atrasada${atrasadas > 1 ? "s" : ""}` : "nada atrasado";
  $("#pAtraso").classList.toggle("atraso", atrasadas > 0);
  renderReceber();

  const lista = pedidos
    .filter((p) => !fSit || p.status === fSit)
    .filter((p) => !fRep ||
      (fRep === "__direto" ? !p.representanteId && !p.representante :
        p.representanteId ? p.representanteId === fRep : p.representante === fRep))
    .filter((p) => !termo || semAcento(`${p.numero} ${p.cliente} ${p.cidade} ${p.uf} ${nomeRep(p)} ${p.telefone}`).includes(termo))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  $("#pCorpo").innerHTML = lista.map((p) => {
    const rep = nomeRep(p);
    return `
    <tr>
      <td data-rotulo="Pedido"><strong class="ped-num">nº ${esc(p.numero)}</strong><small>${dataHora(p.data)}</small></td>
      <td data-rotulo="Cliente"><strong>${esc(p.cliente)}</strong><small>${esc(p.cidade)}/${esc(p.uf)}</small></td>
      <td data-rotulo="Representante">${rep ? `<span class="rep-tag"><i class="fa-solid fa-user-tie"></i> ${esc(rep)}</span>` : `<span class="rep-tag direto">Direto com a fábrica</span>`}</td>
      <td data-rotulo="Pares"><strong>${esc(p.pares)}</strong></td>
      <td data-rotulo="Valor"><strong>${reais(totalPedido(p))}</strong>${num(p.comissaoPct) && temValor(p) ? `<small>comissão ${reais(calcular(p).comissao)}</small>` : ""}</td>
      <td data-rotulo="Pagamento">${(() => { const sp = situacaoPagamento(p); return `<span class="pg-forma">${esc(sp.forma)}</span><span class="pg ${sp.cls}">${esc(sp.txt)}</span>`; })()}</td>
      <td data-rotulo="Situação">
        <select class="sit-sel ${classeSitPed(p.status)}" data-sit="${esc(p.id)}" aria-label="Situação do pedido ${esc(p.numero)}">
          ${SITUACOES_PED.map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td class="t-acoes">
        <button class="ic" data-ver="${esc(p.id)}" title="Ver pedido" aria-label="Ver pedido ${esc(p.numero)}"><i class="fa-solid fa-eye"></i></button>
        <a class="ic ic-zap" href="${zap(p.telefone, `Olá ${String(p.cliente).split(" ")[0]}! Aqui é da Couro Forte, sobre o seu pedido nº ${p.numero}.`)}" target="_blank" rel="noopener" title="Falar com o cliente"><i class="fa-brands fa-whatsapp"></i></a>
        <button class="ic perigo" data-excluir-ped="${esc(p.id)}" title="Excluir" aria-label="Excluir pedido ${esc(p.numero)}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>`;
  }).join("");

  const vazio = lista.length === 0;
  $("#pVazio").hidden = !vazio;
  $(".tabela-ped").classList.toggle("sem-linhas", vazio);
  if (vazio) {
    $("#pVazioTitulo").textContent = pedidos.length ? "Nenhum pedido encontrado" : "Nenhum pedido ainda";
    $("#pVazioTexto").textContent = pedidos.length ? "Tente outra busca ou limpe os filtros." : "Quando alguém finalizar um pedido no carrinho do site, ele aparece aqui.";
  }
}
["#pBusca", "#pFiltroRep", "#pFiltroSit"].forEach((s) => $(s).addEventListener("input", renderPedidos));

async function salvarPedido(p, msg) {
  try {
    const salvo = await Dados.atualizarPedido(p);
    const i = pedidos.findIndex((x) => x.id === p.id);
    if (i >= 0) pedidos[i] = { ...p, ...(salvo || {}) };
    renderPedidos();
    renderVendas();
    renderReps();
    if (msg) avisar(msg);
    return true;
  } catch (e) {
    avisar(e.message, true);
    return false;
  }
}

$("#pCorpo").addEventListener("change", (e) => {
  const sel = e.target.closest("[data-sit]");
  if (!sel) return;
  const p = pedidos.find((x) => x.id === sel.dataset.sit);
  salvarPedido({ ...p, status: sel.value }, `Pedido nº ${p.numero}: ${sel.value}`);
});
$("#pCorpo").addEventListener("click", (e) => {
  const ver = e.target.closest("[data-ver]");
  const ex = e.target.closest("[data-excluir-ped]");
  if (ver) abrirPedido(pedidos.find((p) => p.id === ver.dataset.ver));
  if (ex) {
    const p = pedidos.find((x) => x.id === ex.dataset.excluirPed);
    confirmar(`Excluir o pedido nº ${p.numero}?`, `O pedido de ${p.cliente} vai ser apagado. Isso não pode ser desfeito. Se ele só não vai sair, você pode mudar a situação para "Cancelado".`, async () => {
      try {
        await Dados.excluirPedido(p.id);
        pedidos = pedidos.filter((x) => x !== p);
        tudo();
        avisar(`Pedido nº ${p.numero} excluído.`);
      } catch (err) { avisar(err.message, true); }
    });
  }
});

// ---------- Contas a receber ----------
let receberTodas = false;
function renderReceber() {
  const hojeS = hoje();
  const lista = [];
  pedidos.filter((p) => p.status !== "Cancelado").forEach((p) => {
    const parc = (p.pagamento && p.pagamento.parcelas) || [];
    parc.forEach((x, k) => { if (!x.pago) lista.push({ p, x, k, total: parc.length }); });
  });
  lista.sort((a, b) => String(a.x.vencimento || "9999").localeCompare(String(b.x.vencimento || "9999")));
  $("#receberBox").hidden = lista.length === 0;
  const mostrar = receberTodas ? lista : lista.slice(0, 6);
  $("#receberTodos").hidden = lista.length <= 6;
  $("#receberTodos").textContent = receberTodas ? "Mostrar menos" : `Ver todas (${lista.length})`;
  $("#receberLista").innerHTML = mostrar.map(({ p, x, k, total }) => {
    const atrasada = x.vencimento && x.vencimento < hojeS;
    const ehHoje = x.vencimento === hojeS;
    return `
    <div class="rc ${atrasada ? "atraso" : ehHoje ? "hoje" : ""}">
      <div class="rc-data"><b>${x.vencimento ? dataBR(x.vencimento).slice(0, 5) : "—"}</b><small>${atrasada ? "atrasada" : ehHoje ? "vence hoje" : x.vencimento ? dataBR(x.vencimento).slice(6) : "sem data"}</small></div>
      <div class="rc-info"><strong>${esc(p.cliente)}</strong><small>Pedido nº ${esc(p.numero)} · ${esc((p.pagamento || {}).forma || "")}${total > 1 ? ` · parcela ${k + 1}/${total}` : ""}</small></div>
      <b class="rc-valor">${reais(num(x.valor))}</b>
      <div class="rc-acoes">
        <button class="btn-mini ok" data-receber="${esc(p.id)}" data-parc="${k}"><i class="fa-solid fa-check"></i> Recebido</button>
        <button class="ic" data-ver="${esc(p.id)}" title="Ver pedido"><i class="fa-solid fa-eye"></i></button>
      </div>
    </div>`;
  }).join("");
}
$("#receberTodos").addEventListener("click", () => { receberTodas = !receberTodas; renderReceber(); });
$("#receberLista").addEventListener("click", (e) => {
  const rec = e.target.closest("[data-receber]");
  const ver = e.target.closest("[data-ver]");
  if (ver) abrirPedido(pedidos.find((p) => p.id === ver.dataset.ver));
  if (rec) {
    const p = pedidos.find((x) => x.id === rec.dataset.receber);
    const novo = JSON.parse(JSON.stringify(p));
    const parc = novo.pagamento.parcelas[+rec.dataset.parc];
    parc.pago = true;
    parc.pagoEm = hoje();
    salvarPedido(novo, `Recebido ${reais(num(parc.valor))} do pedido nº ${p.numero}.`);
  }
});

// ---------- Detalhe do pedido (valores, comissão e pagamento) ----------
const pModal = $("#pModal");
let w = null;          // cópia do pedido sendo editada
let parcelasMexidas = false;

function gerarParcelas(qtd, intervalo, primeiro) {
  const { total } = calcular(w);
  qtd = Math.max(1, Math.min(24, Number(qtd) || 1));
  const cada = Math.floor((total / qtd) * 100) / 100;
  const resto = r2(total - cada * qtd);
  const antigas = (w.pagamento.parcelas || []);
  w.pagamento.parcelas = Array.from({ length: qtd }, (_, k) => ({
    vencimento: somaDias(primeiro, k * (Number(intervalo) || 0)),
    valor: r2(k === 0 ? cada + resto : cada),
    pago: antigas[k] ? !!antigas[k].pago : false,
    pagoEm: antigas[k] ? antigas[k].pagoEm || "" : "",
  }));
  w.pagamento.qtd = qtd;
  w.pagamento.intervalo = Number(intervalo) || 0;
  w.pagamento.primeiro = primeiro;
  parcelasMexidas = false;
}

function prazoPadrao(forma) {
  const dataPed = String(w.data || hoje()).slice(0, 10);
  if (forma === "Boleto") return [3, 30, somaDias(dataPed, 30)];
  if (forma === "Cartão de crédito parcelado") return [3, 30, somaDias(dataPed, 30)];
  return [1, 0, dataPed];
}

function abrirPedido(p) {
  w = JSON.parse(JSON.stringify(p));
  w.itens = (w.itens || []).map((i) => ({ ...i, precoUnit: precoItem(i) || "" }));
  w.pagamento = w.pagamento || { forma: "A combinar", parcelas: [] };
  if (!Array.isArray(w.pagamento.parcelas)) w.pagamento.parcelas = [];
  if (w.comissaoPct === undefined || w.comissaoPct === "") {
    const r = reps.find((x) => x.id === w.representanteId);
    w.comissaoPct = r && r.comissao ? num(r.comissao) : "";
  }
  parcelasMexidas = false;
  // o cliente escolheu a forma no site, mas as parcelas ainda não existem: monta o padrão
  if (w.pagamento.forma && w.pagamento.forma !== "A combinar" && !w.pagamento.parcelas.length) {
    const [q, int, pri] = prazoPadrao(w.pagamento.forma);
    gerarParcelas(q, int, pri);
  }
  desenharPedido();
  abrirModal(pModal);
}

function desenharPedido() {
  const p = w;
  const opcoesRep = `<option value="">Direto com a fábrica</option>` +
    [...reps].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((r) => `<option value="${esc(r.id)}" ${r.id === p.representanteId ? "selected" : ""}>${esc(r.nome)}</option>`).join("") +
    (!p.representanteId && p.representante ? `<option value="__solto" selected>${esc(p.representante)} (sem cadastro)</option>` : "");
  const pg = p.pagamento;
  const parcelado = pg.forma === "Boleto" || pg.forma === "Cartão de crédito parcelado";
  const mostrarParcelas = pg.forma !== "A combinar";

  $("#pDetalhe").innerHTML = `
    <div class="pd-topo">
      <div>
        <p class="eyebrow dark"><span class="line"></span> ${dataHora(p.data)}</p>
        <h2 id="pdTitulo">Pedido nº ${esc(p.numero)}</h2>
      </div>
      <label class="pd-sit">Situação do pedido
        <select id="pdSit" class="sit-sel ${classeSitPed(p.status)}">${SITUACOES_PED.map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      </label>
    </div>

    <div class="pd-blocos">
      <div class="pd-bloco">
        <h4><i class="fa-solid fa-user"></i> Cliente</h4>
        <strong>${esc(p.cliente)}</strong>
        <span>${esc(p.cidade)}/${esc(p.uf)}</span>
        <a href="${zap(p.telefone)}" target="_blank" rel="noopener" class="rep-zap"><i class="fa-brands fa-whatsapp"></i> ${esc(p.telefone)}</a>
      </div>
      <div class="pd-bloco">
        <h4><i class="fa-solid fa-user-tie"></i> Venda de</h4>
        <select id="pdRep">${opcoesRep}</select>
        <small>Se o cliente marcou errado, troque aqui.</small>
      </div>
    </div>

    <section class="pd-sec">
      <div class="pd-sec-topo">
        <h3><i class="fa-solid fa-tags"></i> Valores dos produtos</h3>
        <div class="preco-todos">
          <span>Mesmo preço para todos:</span>
          <div class="campo-rs"><span>R$</span><input id="pdPrecoTodos" inputmode="decimal" placeholder="0,00"></div>
          <button type="button" class="btn-mini" id="pdAplicar">Aplicar</button>
        </div>
      </div>
      <table class="pd-itens">
        <thead><tr><th>Modelo</th><th>Nº</th><th>Qtd</th><th class="th-preco">Preço do par</th><th class="th-sub">Subtotal</th></tr></thead>
        <tbody>
          ${p.itens.map((i, k) => `
            <tr>
              <td data-rotulo=""><div class="pd-mod"><img src="${fotoP(i.foto)}" alt="" onerror="this.style.visibility='hidden'"><div><strong>${esc(i.nome)} · Ref ${esc(i.ref)}</strong><small>${esc(i.couro)} ${esc(i.cor)} · Solado ${esc(i.solado)}</small></div></div></td>
              <td data-rotulo="Nº"><b>${esc(i.tamanho)}</b></td>
              <td data-rotulo="Qtd"><b>${esc(i.qtd)}</b></td>
              <td data-rotulo="Preço do par"><div class="campo-rs"><span>R$</span><input data-preco="${k}" inputmode="decimal" placeholder="0,00" value="${dinheiroCampo(i.precoUnit)}"></div></td>
              <td data-rotulo="Subtotal" class="td-sub" data-sub="${k}">${reais(precoItem(i) * (Number(i.qtd) || 0))}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <div class="pd-conta">
        <div><span>Produtos (${esc(paresTxt(p.pares))})</span><b id="pdProdutos"></b></div>
        <div><span>Desconto</span><div class="campo-rs"><span>− R$</span><input id="pdDesconto" inputmode="decimal" placeholder="0,00" value="${dinheiroCampo(p.desconto)}"></div></div>
        <div><span>Frete</span><div class="campo-rs"><span>+ R$</span><input id="pdFrete" inputmode="decimal" placeholder="0,00" value="${dinheiroCampo(p.frete)}"></div></div>
        <div class="pd-total-linha"><span>Total do pedido</span><strong id="pdTotal"></strong></div>
      </div>
    </section>

    <section class="pd-sec pd-comissao">
      <h3><i class="fa-solid fa-percent"></i> Comissão do representante</h3>
      <div class="com-grade">
        <label>Porcentagem
          <div class="campo-rs"><input id="pdComPct" inputmode="decimal" placeholder="0" value="${p.comissaoPct === "" ? "" : esc(String(p.comissaoPct).replace(".", ","))}"><span>%</span></div>
        </label>
        <div class="com-valor"><span>Ele ganha</span><strong id="pdComValor"></strong><small>sobre os produtos, sem o frete</small></div>
        <label class="check"><input type="checkbox" id="pdComPaga" ${p.comissaoPaga ? "checked" : ""}> Comissão já paga</label>
        <label id="pdComDataBox" ${p.comissaoPaga ? "" : "hidden"}>Paga em<input type="date" id="pdComData" value="${esc(p.comissaoPagaEm || "")}"></label>
      </div>
      <p class="com-sem" id="pdComSem" hidden>Esta venda foi direto com a fábrica: não tem comissão.</p>
    </section>

    <section class="pd-sec pd-pag">
      <h3><i class="fa-solid fa-credit-card"></i> Pagamento</h3>
      <div class="formas" role="radiogroup" aria-label="Forma de pagamento">
        ${FORMAS.map((f) => `<button type="button" class="forma ${f === pg.forma ? "on" : ""}" data-forma="${esc(f)}">${{
          "A combinar": '<i class="fa-regular fa-handshake"></i>', "Pix": '<i class="fa-brands fa-pix"></i>', "Dinheiro": '<i class="fa-solid fa-money-bill-wave"></i>',
          "Cartão de débito": '<i class="fa-regular fa-credit-card"></i>', "Cartão de crédito à vista": '<i class="fa-solid fa-credit-card"></i>',
          "Cartão de crédito parcelado": '<i class="fa-solid fa-credit-card"></i>', "Boleto": '<i class="fa-solid fa-barcode"></i>' }[f]} ${esc(f)}</button>`).join("")}
      </div>

      ${parcelado ? `
      <div class="prazos">
        <span>Prazo:</span>
        ${PRAZOS.filter((x) => x[1] > 1 || pg.forma === "Boleto").map(([nome, q, int]) => `<button type="button" class="chip ${pg.qtd === q && (pg.intervalo === int || q === 1) ? "active" : ""}" data-prazo="${q},${int}">${nome}</button>`).join("")}
      </div>
      <div class="parc-config">
        <label>Nº de parcelas<input type="number" id="pdQtd" min="1" max="24" value="${pg.qtd || pg.parcelas.length || 1}"></label>
        <label>Dias entre parcelas<input type="number" id="pdIntervalo" min="0" max="365" value="${pg.intervalo ?? 30}"></label>
        <label>1º vencimento<input type="date" id="pdPrimeiro" value="${esc(pg.primeiro || (pg.parcelas[0] && pg.parcelas[0].vencimento) || "")}"></label>
      </div>` : ""}

      ${mostrarParcelas ? `
      <table class="parcelas">
        <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Recebido?</th></tr></thead>
        <tbody>
          ${pg.parcelas.map((x, k) => `
            <tr class="${x.pago ? "paga" : x.vencimento && x.vencimento < hoje() ? "atrasada" : ""}">
              <td data-rotulo=""><b>${pg.parcelas.length > 1 ? `${k + 1}ª` : "Única"}</b>${!x.pago && x.vencimento && x.vencimento < hoje() ? `<small class="tag-atraso">atrasada</small>` : ""}</td>
              <td data-rotulo="Vencimento"><input type="date" data-venc="${k}" value="${esc(x.vencimento || "")}"></td>
              <td data-rotulo="Valor"><div class="campo-rs"><span>R$</span><input data-pvalor="${k}" inputmode="decimal" value="${dinheiroCampo(x.valor)}"></div></td>
              <td data-rotulo="Recebido?"><div class="recebido">
                <label class="check"><input type="checkbox" data-pago="${k}" ${x.pago ? "checked" : ""}> ${x.pago ? "Sim, em" : "Não"}</label>
                ${x.pago ? `<input type="date" data-pagoem="${k}" value="${esc(x.pagoEm || "")}" title="Data do recebimento">` : ""}
              </div></td>
            </tr>`).join("")}
        </tbody>
      </table>
      <p class="parc-aviso" id="pdParcAviso" hidden></p>` : `<p class="com-sem">Escolha a forma de pagamento quando combinar com o cliente.</p>`}
    </section>

    ${p.obs ? `<div class="pd-obs"><h4>Observações do cliente</h4><p>${esc(p.obs)}</p></div>` : ""}
    <div class="rep-form-btns pd-btns">
      <a class="btn btn-whats" id="pdAvisar" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Mandar resumo ao cliente</a>
      <button class="btn btn-gold" id="pdSalvar"><i class="fa-solid fa-check"></i> Salvar pedido</button>
    </div>`;

  ligarPedido();
  atualizarContas();
}

function atualizarContas() {
  const c = calcular(w);
  $("#pdProdutos").textContent = reais(c.produtos);
  $("#pdTotal").textContent = temValor(w) ? reais(c.total) : "Preencha os preços";
  w.itens.forEach((i, k) => { const td = $(`[data-sub="${k}"]`); if (td) td.textContent = precoItem(i) ? reais(precoItem(i) * (Number(i.qtd) || 0)) : "—"; });
  const temRep = !!(w.representanteId || w.representante);
  $(".com-grade").hidden = !temRep;
  $("#pdComSem").hidden = temRep;
  $("#pdComValor").textContent = reais(c.comissao);
  // parcelas conferem com o total?
  const aviso = $("#pdParcAviso");
  if (aviso) {
    const soma = r2(w.pagamento.parcelas.reduce((s, x) => s + num(x.valor), 0));
    const dif = r2(c.total - soma);
    aviso.hidden = !temValor(w) || Math.abs(dif) < 0.01;
    aviso.innerHTML = `As parcelas somam <b>${reais(soma)}</b>, mas o total é <b>${reais(c.total)}</b>. <button type="button" class="btn-mini" id="pdAjustar">Recalcular parcelas</button>`;
    const aj = $("#pdAjustar");
    if (aj) aj.addEventListener("click", () => { recalcularValores(); desenharPedido(); });
  }
  // mensagem para o cliente
  const pg = w.pagamento;
  const linhasParc = pg.parcelas.length > 1
    ? pg.parcelas.map((x, k) => `${k + 1}ª: ${dataBR(x.vencimento)} — ${reais(num(x.valor))}${x.pago ? " (paga)" : ""}`).join("\n")
    : "";
  const msg = [
    `Olá ${String(w.cliente).split(" ")[0]}! Aqui é da *Couro Forte*.`,
    `Seu pedido nº ${w.numero} (${paresTxt(w.pares)}) está: *${$("#pdSit") ? $("#pdSit").value : w.status}*.`,
    temValor(w) ? `Total: *${reais(c.total)}*${c.frete ? ` (frete ${reais(c.frete)})` : ""}` : "",
    pg.forma !== "A combinar" ? `Pagamento: ${pg.forma}${pg.parcelas.length > 1 ? ` em ${pg.parcelas.length}x` : ""}` : "",
    linhasParc,
  ].filter(Boolean).join("\n");
  $("#pdAvisar").href = zap(w.telefone, msg);
}

function recalcularValores() {
  // mantém as datas e redistribui o total entre as parcelas
  const parc = w.pagamento.parcelas;
  if (!parc.length) return;
  const { total } = calcular(w);
  const pagas = r2(parc.filter((x) => x.pago).reduce((s, x) => s + num(x.valor), 0));
  const abertas = parc.filter((x) => !x.pago);
  if (!abertas.length) return;
  const resto = Math.max(0, r2(total - pagas));
  const cada = Math.floor((resto / abertas.length) * 100) / 100;
  abertas.forEach((x, k) => { x.valor = r2(k === 0 ? cada + r2(resto - cada * abertas.length) : cada); });
}

function ligarPedido() {
  const det = $("#pDetalhe");
  // preços
  $$("[data-preco]", det).forEach((inp) => inp.addEventListener("input", () => {
    w.itens[+inp.dataset.preco].precoUnit = num(inp.value) || "";
    if (!parcelasMexidas) recalcularValores();
    atualizarContas();
    $$("[data-pvalor]", det).forEach((pv) => { pv.value = dinheiroCampo(w.pagamento.parcelas[+pv.dataset.pvalor].valor); });
  }));
  $("#pdAplicar").addEventListener("click", () => {
    const v = num($("#pdPrecoTodos").value);
    if (!v) return avisar("Digite o preço primeiro.", true);
    w.itens.forEach((i) => { i.precoUnit = v; });
    recalcularValores();
    desenharPedido();
  });
  $("#pdPrecoTodos").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#pdAplicar").click(); } });
  [["#pdDesconto", "desconto"], ["#pdFrete", "frete"]].forEach(([sel, campo]) => $(sel).addEventListener("input", (e) => {
    w[campo] = num(e.target.value) || "";
    if (!parcelasMexidas) recalcularValores();
    atualizarContas();
    $$("[data-pvalor]", det).forEach((pv) => { pv.value = dinheiroCampo(w.pagamento.parcelas[+pv.dataset.pvalor].valor); });
  }));
  // representante e comissão
  $("#pdRep").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "__solto") return;
    w.representanteId = v;
    const r = reps.find((x) => x.id === v);
    w.representante = r ? r.nome : "";
    w.comissaoPct = r && r.comissao ? num(r.comissao) : "";
    $("#pdComPct").value = w.comissaoPct === "" ? "" : String(w.comissaoPct).replace(".", ",");
    atualizarContas();
  });
  $("#pdComPct").addEventListener("input", (e) => { w.comissaoPct = e.target.value.trim() === "" ? "" : num(e.target.value); atualizarContas(); });
  $("#pdComPaga").addEventListener("change", (e) => {
    w.comissaoPaga = e.target.checked;
    if (e.target.checked && !w.comissaoPagaEm) { w.comissaoPagaEm = hoje(); $("#pdComData").value = hoje(); }
    $("#pdComDataBox").hidden = !e.target.checked;
  });
  $("#pdComData").addEventListener("change", (e) => { w.comissaoPagaEm = e.target.value; });
  $("#pdSit").addEventListener("change", (e) => { e.target.className = "sit-sel " + classeSitPed(e.target.value); atualizarContas(); });

  // forma de pagamento
  $$("[data-forma]", det).forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.forma;
    w.pagamento.forma = f;
    if (f === "A combinar") { w.pagamento.parcelas = []; }
    else { const [q, int, pri] = prazoPadrao(f); w.pagamento.parcelas = w.pagamento.parcelas.filter((x) => x.pago).length ? w.pagamento.parcelas : []; gerarParcelas(q, int, pri); }
    desenharPedido();
  }));
  $$("[data-prazo]", det).forEach((b) => b.addEventListener("click", () => {
    const [q, int] = b.dataset.prazo.split(",").map(Number);
    const dataPed = String(w.data || hoje()).slice(0, 10);
    gerarParcelas(q, int, somaDias(dataPed, int || 0));
    desenharPedido();
  }));
  const regerar = () => {
    gerarParcelas($("#pdQtd").value, $("#pdIntervalo").value, $("#pdPrimeiro").value || hoje());
    desenharPedido();
  };
  if ($("#pdQtd")) ["#pdQtd", "#pdIntervalo", "#pdPrimeiro"].forEach((s) => $(s).addEventListener("change", regerar));

  // parcelas
  $$("[data-venc]", det).forEach((inp) => inp.addEventListener("change", () => { w.pagamento.parcelas[+inp.dataset.venc].vencimento = inp.value; parcelasMexidas = true; }));
  $$("[data-pvalor]", det).forEach((inp) => inp.addEventListener("input", () => { w.pagamento.parcelas[+inp.dataset.pvalor].valor = num(inp.value); parcelasMexidas = true; atualizarContas(); }));
  $$("[data-pago]", det).forEach((inp) => inp.addEventListener("change", () => {
    const x = w.pagamento.parcelas[+inp.dataset.pago];
    x.pago = inp.checked;
    x.pagoEm = inp.checked ? (x.pagoEm || hoje()) : "";
    desenharPedido();
  }));
  $$("[data-pagoem]", det).forEach((inp) => inp.addEventListener("change", () => { w.pagamento.parcelas[+inp.dataset.pagoem].pagoEm = inp.value; }));

  $("#pdSalvar").addEventListener("click", async () => {
    const novo = JSON.parse(JSON.stringify(w));
    novo.status = $("#pdSit").value;
    const c = calcular(novo);
    novo.total = temValor(novo) ? c.total : null;
    novo.comissaoValor = (novo.representanteId || novo.representante) ? c.comissao : 0;
    if (!(novo.representanteId || novo.representante)) novo.comissaoPct = "";
    if (await salvarPedido(novo, `Pedido nº ${novo.numero} salvo.`)) fecharModal(pModal);
  });
}
pModal.addEventListener("click", (e) => { if (e.target.closest("[data-fechar-ped]")) fecharModal(pModal); });

// ---------- Janelas ----------
function abrirModal(m) { m.hidden = false; document.body.style.overflow = "hidden"; }
function fecharModal(m) { m.hidden = true; if ($$(".modal:not([hidden])").length === 0) document.body.style.overflow = ""; }
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const aberta = $$(".modal:not([hidden])").pop();
  if (aberta) fecharModal(aberta);
});

const confirma = $("#rConfirma");
let acaoConfirma = null;
function confirmar(titulo, texto, acao) {
  $("#rConfTitulo").textContent = titulo;
  $("#rConfTexto").textContent = texto;
  acaoConfirma = acao;
  abrirModal(confirma);
  $("#rConfSim").focus();
}
confirma.addEventListener("click", (e) => { if (e.target.closest("[data-nao]")) fecharModal(confirma); });
$("#rConfSim").addEventListener("click", async () => {
  fecharModal(confirma);
  if (acaoConfirma) await acaoConfirma();
});

// ---------- Representantes ----------
function mascaraTelefone(v) {
  const n = soNumeros(v).slice(0, 11);
  if (n.length <= 2) return n ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}
function mascaraDocumento(v) {
  const n = soNumeros(v).slice(0, 14);
  if (n.length <= 11) return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return n.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

function renderReps() {
  const mes = hoje().slice(0, 7);
  $("#nTotal").textContent = reps.length;
  $("#nAtivos").textContent = reps.filter((r) => r.situacao === "Ativo").length;
  $("#nEstados").textContent = new Set(reps.map((r) => r.uf).filter(Boolean)).size;
  $("#nMes").textContent = reps.filter((r) => String(r.criadoEm || "").slice(0, 7) === mes).length;

  const termo = semAcento($("#rBusca").value.trim());
  const termoNum = soNumeros($("#rBusca").value);
  const uf = $("#rFiltroUF").value;
  const sit = $("#rFiltroSit").value;
  const lista = reps
    .filter((r) => (!uf || r.uf === uf) && (!sit || r.situacao === sit))
    .filter((r) => !termo ||
      semAcento(`${r.nome} ${r.empresa} ${r.cidade} ${r.uf} ${r.regiao} ${r.email} ${r.tipo}`).includes(termo) ||
      (termoNum.length >= 3 && (soNumeros(r.whatsapp).includes(termoNum) || soNumeros(r.documento).includes(termoNum))))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  $("#rCorpo").innerHTML = lista.map((r) => {
    const v = vendasDe(r.id);
    const classeSit = r.situacao === "Ativo" ? "ok" : r.situacao === "Inativo" ? "off" : "analise";
    return `
    <tr>
      <td data-rotulo="Representante">
        <div class="rep-nome"><span class="avatar">${esc(iniciais(r.nome))}</span>
          <div><strong>${esc(r.nome)}</strong>${r.empresa ? `<small>${esc(r.empresa)}</small>` : `<small>${esc(r.tipo || "")}</small>`}</div></div>
      </td>
      <td data-rotulo="Contato">
        <a href="${zap(r.whatsapp, `Olá ${r.nome.split(" ")[0]}! Aqui é da Couro Forte.`)}" target="_blank" rel="noopener" class="rep-zap"><i class="fa-brands fa-whatsapp"></i> ${esc(r.whatsapp)}</a>
        ${r.email ? `<small class="rep-email">${esc(r.email)}</small>` : ""}
      </td>
      <td data-rotulo="Cidade / UF">${esc(r.cidade)} / ${esc(r.uf)}${r.regiao ? `<small>${esc(r.regiao)}</small>` : ""}</td>
      <td data-rotulo="Vendas"><strong>${v.pares} ${v.pares === 1 ? "par" : "pares"}</strong><small>${v.pedidos} pedido${v.pedidos === 1 ? "" : "s"}${v.valor !== null ? ` · ${reais(v.valor)}` : ""}</small>${r.comissao ? `<small>Comissão ${esc(r.comissao)}%${v.comissao ? `: ${reais(v.comissao)}${v.comissaoAPagar > 0 ? ` (a pagar ${reais(v.comissaoAPagar)})` : " (paga)"}` : ""}</small>` : ""}</td>
      <td data-rotulo="Situação"><span class="sit ${classeSit}">${esc(r.situacao)}</span></td>
      <td data-rotulo="Desde">${dataBR(r.inicio)}</td>
      <td class="t-acoes">
        <button class="ic" data-link="${esc(r.id)}" title="Link de vendas" aria-label="Link de vendas de ${esc(r.nome)}"><i class="fa-solid fa-link"></i></button>
        <button class="ic" data-editar="${esc(r.id)}" title="Editar" aria-label="Editar ${esc(r.nome)}"><i class="fa-solid fa-pen"></i></button>
        <button class="ic perigo" data-excluir="${esc(r.id)}" title="Excluir" aria-label="Excluir ${esc(r.nome)}"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>`;
  }).join("");

  const vazio = lista.length === 0;
  $("#rVazio").hidden = !vazio;
  $("#rTabela").classList.toggle("sem-linhas", vazio);
  if (vazio) {
    $("#rVazioTitulo").textContent = reps.length ? "Nenhum representante encontrado" : "Nenhum representante cadastrado ainda";
    $("#rVazioTexto").innerHTML = reps.length ? "Tente outra busca ou limpe os filtros." : "Clique em <strong>Novo representante</strong> para fazer o primeiro cadastro.";
  }
}
["#rBusca", "#rFiltroUF", "#rFiltroSit"].forEach((s) => $(s).addEventListener("input", renderReps));

// formulário
const rModal = $("#rModal");
const form = $("#rForm");
let editando = null;
$("#rUF").insertAdjacentHTML("beforeend", UFS.map((u) => `<option>${u}</option>`).join(""));
form.whatsapp.addEventListener("input", (e) => { e.target.value = mascaraTelefone(e.target.value); });
form.documento.addEventListener("input", (e) => { e.target.value = mascaraDocumento(e.target.value); });
form.addEventListener("input", (e) => e.target.classList.remove("invalido"));

function abrirForm(rep = null) {
  editando = rep ? rep.id : null;
  form.reset();
  $("#rErro").hidden = true;
  $$(".invalido", form).forEach((el) => el.classList.remove("invalido"));
  $("#rFormTitulo").textContent = rep ? "Editar representante" : "Novo representante";
  $("#rSalvarTxt").textContent = rep ? "Salvar alterações" : "Salvar cadastro";
  if (rep) ["nome", "documento", "empresa", "whatsapp", "email", "cidade", "uf", "regiao", "tipo", "situacao", "comissao", "inicio", "obs"].forEach((k) => { form[k].value = rep[k] || ""; });
  else { form.inicio.value = hoje(); form.uf.value = "MG"; }
  abrirModal(rModal);
  setTimeout(() => form.nome.focus(), 50);
}
$("#btnNovo").addEventListener("click", () => { abrirAba("representantes"); abrirForm(); });
rModal.addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) fecharModal(rModal); });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form).entries());
  Object.keys(d).forEach((k) => { d[k] = String(d[k]).trim(); });
  const erros = [];
  $$(".invalido", form).forEach((el) => el.classList.remove("invalido"));
  const marcar = (c, m) => { form[c].classList.add("invalido"); erros.push(m); };
  if (d.nome.length < 3) marcar("nome", "o nome completo");
  if (soNumeros(d.whatsapp).length < 10) marcar("whatsapp", "o telefone com DDD");
  if (!d.cidade) marcar("cidade", "a cidade");
  if (!d.uf) marcar("uf", "o estado");
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) marcar("email", "um e-mail válido");
  const doc = soNumeros(d.documento);
  if (doc && doc.length !== 11 && doc.length !== 14) marcar("documento", "um CPF (11 números) ou CNPJ (14 números)");
  const repetido = soNumeros(d.whatsapp).length >= 10 && reps.find((r) => r.id !== editando && soNumeros(r.whatsapp) === soNumeros(d.whatsapp));
  if (repetido) form.whatsapp.classList.add("invalido");
  if (erros.length || repetido) {
    const partes = [];
    if (erros.length) partes.push("Falta preencher: " + erros.join(", ") + ".");
    if (repetido) partes.push(`Este telefone já está cadastrado para ${repetido.nome}.`);
    $("#rErro").textContent = partes.join(" ");
    $("#rErro").hidden = false;
    form.querySelector(".invalido").focus();
    return;
  }

  const btn = $("#rSalvar");
  btn.disabled = true;
  try {
    const antigo = editando ? reps.find((r) => r.id === editando) : null;
    const rep = antigo
      ? { ...antigo, ...d, atualizadoEm: new Date().toISOString() }
      : { id: Dados.novoId(), ...d, criadoEm: new Date().toISOString() };
    const salvo = (await Dados.salvarRep(rep)) || rep;
    if (antigo) reps[reps.indexOf(antigo)] = salvo; else reps.push(salvo);
    tudo();
    fecharModal(rModal);
    avisar(antigo ? `Cadastro de ${d.nome} atualizado.` : `${d.nome} cadastrado com sucesso!`);
    if (!antigo) setTimeout(() => abrirLink(salvo), 400);
  } catch (err) {
    $("#rErro").textContent = err.message;
    $("#rErro").hidden = false;
  } finally {
    btn.disabled = false;
  }
});

// link de vendas
const lModal = $("#lModal");
function linkDoRep(r) {
  const u = new URL("index.html", location.href);
  u.search = "";
  u.hash = "";
  u.searchParams.set("rep", r.id);
  u.searchParams.set("r", r.nome);
  return u.toString();
}
function abrirLink(r) {
  const link = linkDoRep(r);
  $("#lNome").textContent = r.nome;
  $("#lUrl").value = link;
  $("#lWhats").href = zap(r.whatsapp, `Olá ${r.nome.split(" ")[0]}! Este é o seu link de vendas da Couro Forte. Mande para os seus clientes: todo pedido feito por ele fica marcado como venda sua.\n\n${link}`);
  abrirModal(lModal);
}
lModal.addEventListener("click", (e) => { if (e.target.closest("[data-fechar-link]")) fecharModal(lModal); });
$("#lCopiar").addEventListener("click", async () => {
  const campo = $("#lUrl");
  try { await navigator.clipboard.writeText(campo.value); avisar("Link copiado!"); }
  catch (e) { campo.focus(); campo.select(); avisar("Selecionei o link: agora é só copiar (Ctrl+C)."); }
});
$("#lUrl").addEventListener("focus", (e) => e.target.select());

$("#rCorpo").addEventListener("click", (e) => {
  const ed = e.target.closest("[data-editar]");
  const ex = e.target.closest("[data-excluir]");
  const ln = e.target.closest("[data-link]");
  if (ed) abrirForm(reps.find((r) => r.id === ed.dataset.editar));
  if (ln) abrirLink(reps.find((r) => r.id === ln.dataset.link));
  if (ex) {
    const r = reps.find((x) => x.id === ex.dataset.excluir);
    const v = vendasDe(r.id);
    confirmar("Excluir representante?", `O cadastro de ${r.nome} vai ser apagado.${v.pedidos ? ` Os ${v.pedidos} pedidos dele continuam na lista com o nome dele.` : ""} Se ele só parou de vender, você pode mudar a situação para "Inativo".`, async () => {
      try {
        await Dados.excluirRep(r.id);
        // os pedidos dele guardam o nome, para não perder o histórico
        pedidos.filter((p) => p.representanteId === r.id).forEach((p) => { p.representante = r.nome; });
        reps = reps.filter((x) => x !== r);
        tudo();
        avisar(`${r.nome} foi excluído.`);
      } catch (err) { avisar(err.message, true); }
    });
  }
});

// ---------- Planilhas e backup ----------
function baixar(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const cel = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function csv(colunas, linhas) {
  // "﻿" = acentos certos no Excel; ";" separa colunas no Excel em português
  return "﻿" + [colunas.map(cel).join(";")].concat(linhas.map((l) => l.map(cel).join(";"))).join("\r\n");
}
$("#btnPlanPed").addEventListener("click", () => {
  if (!pedidos.length) return avisar("Ainda não há pedidos.", true);
  const linhas = [];
  [...pedidos].sort((a, b) => Number(a.numero) - Number(b.numero)).forEach((p) => {
    const c = calcular(p);
    const sp = situacaoPagamento(p);
    const parc = sp.parc.map((x, k) => `${k + 1}ª ${dataBR(x.vencimento)} ${reais(num(x.valor))}${x.pago ? " paga" : ""}`).join(" | ");
    p.itens.forEach((i, k) => linhas.push([
      p.numero, dataHora(p.data), p.status, p.cliente, p.telefone, p.cidade, p.uf, nomeRep(p) || "Direto com a fábrica",
      `${i.nome} Ref ${i.ref}`, `${i.couro} ${i.cor}`, i.tamanho, i.qtd,
      precoItem(i) ? precoItem(i).toFixed(2).replace(".", ",") : "", precoItem(i) ? (precoItem(i) * i.qtd).toFixed(2).replace(".", ",") : "",
      k === 0 && c.frete ? c.frete.toFixed(2).replace(".", ",") : "", k === 0 && c.desconto ? c.desconto.toFixed(2).replace(".", ",") : "",
      k === 0 && temValor(p) ? c.total.toFixed(2).replace(".", ",") : "",
      k === 0 ? sp.forma : "", k === 0 ? parc : "", k === 0 ? sp.txt : "",
      k === 0 && num(p.comissaoPct) ? String(p.comissaoPct).replace(".", ",") : "", k === 0 && c.comissao ? c.comissao.toFixed(2).replace(".", ",") : "",
      k === 0 ? (p.comissaoPaga ? "Sim" : c.comissao ? "Não" : "") : "", k === 0 ? p.obs : "",
    ]));
  });
  baixar(`pedidos-couro-forte-${hoje()}.csv`, csv(["Pedido", "Data", "Situação", "Cliente", "WhatsApp", "Cidade", "UF", "Representante",
    "Modelo", "Couro/Cor", "Nº", "Qtd", "Preço do par", "Subtotal", "Frete", "Desconto", "Total do pedido",
    "Forma de pagamento", "Parcelas", "Pagamento", "Comissão %", "Comissão R$", "Comissão paga", "Obs"], linhas), "text/csv;charset=utf-8");
  avisar("Planilha de pedidos baixada.");
});
$("#btnPlanRep").addEventListener("click", () => {
  if (!reps.length) return avisar("Ainda não há representantes.", true);
  const linhas = reps.map((r) => { const v = vendasDe(r.id); return [r.nome, r.empresa, r.documento, r.whatsapp, r.email, r.cidade, r.uf, r.regiao, r.tipo, r.situacao, r.comissao, dataBR(r.inicio), v.pedidos, v.pares, r.obs]; });
  baixar(`representantes-couro-forte-${hoje()}.csv`, csv(["Nome", "Empresa/Loja", "CPF/CNPJ", "Telefone", "E-mail", "Cidade", "UF", "Região", "Tipo", "Situação", "Comissão %", "Início", "Pedidos", "Pares vendidos", "Observações"], linhas), "text/csv;charset=utf-8");
  avisar("Planilha de representantes baixada.");
});
$("#btnBackup").addEventListener("click", () => {
  if (!reps.length && !pedidos.length) return avisar("Ainda não há dados para guardar.", true);
  baixar(`backup-couro-forte-${hoje()}.json`, JSON.stringify({ sistema: "couro-forte", versao: 2, data: new Date().toISOString(), representantes: reps, pedidos }, null, 2), "application/json");
  avisar("Backup baixado. Guarde esse arquivo num lugar seguro.");
});
$("#arqBackup").addEventListener("change", async (e) => {
  const arq = e.target.files[0];
  e.target.value = "";
  if (!arq) return;
  try {
    const d = JSON.parse(await arq.text());
    const rs = Array.isArray(d) ? d : d.representantes || [];
    const ps = Array.isArray(d) ? [] : d.pedidos || [];
    if (!Array.isArray(rs) || !Array.isArray(ps) || (!rs.length && !ps.length)) throw new Error();
    await Dados.importar({ reps: rs, pedidos: ps });
    await carregar();
    avisar(`Backup restaurado: ${rs.length} representantes e ${ps.length} pedidos.`);
  } catch (err) {
    avisar(err.message && err.message.length > 3 ? err.message : "Esse arquivo não é um backup válido.", true);
  }
});

// ---------- Início ----------
if (Dados.online()) {
  if (Dados.temSenha()) carregar(); else mostrarLogin("online");
} else if (!ler(K_HASH)) {
  mostrarLogin("criar");
} else if (ler(K_SESSAO, sessionStorage) === "1") {
  carregar();
} else {
  mostrarLogin("entrar");
}
