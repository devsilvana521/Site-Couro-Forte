/* =====================================================================
   COURO FORTE — Script da planilha do Google
   ---------------------------------------------------------------------
   Este código guarda os PEDIDOS e os REPRESENTANTES do site numa
   planilha do Google. Siga o passo a passo do arquivo PLANILHA-GOOGLE.txt.

   >>> TROQUE A SENHA ABAIXO antes de publicar. <<<
   Ela é pedida no Painel da fábrica (painel.html).
   ===================================================================== */
const SENHA = "TROQUE-ESTA-SENHA";

const ABA_REPS = "Representantes";
const ABA_PED = "Pedidos";
const COL_REPS = ["id", "nome", "whatsapp", "cidade", "uf", "empresa", "documento", "email", "regiao",
                  "tipo", "situacao", "comissao", "inicio", "obs", "criadoEm", "atualizadoEm"];
const COL_PED = ["numero", "data", "status", "cliente", "telefone", "cidade", "uf", "representante",
                 "pares", "total", "itensTexto", "obs", "id", "representanteId", "json",
                 "pagamentoTexto", "comissaoTexto"];
const TITULOS_PED = ["Nº", "Data", "Situação", "Cliente", "WhatsApp", "Cidade", "UF", "Representante",
                     "Pares", "Valor", "Itens", "Observações", "id", "representanteId", "dados (não mexer)",
                     "Pagamento", "Comissão"];
const TITULOS_REPS = ["id", "Nome", "Telefone", "Cidade", "UF", "Empresa/Loja", "CPF/CNPJ", "E-mail", "Região",
                      "Tipo", "Situação", "Comissão %", "Início", "Observações", "Criado em", "Atualizado em"];

/* ---------- leitura (GET) ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.acao === "reps") {
      // lista curta para o cliente escolher o representante no carrinho
      const reps = lerReps().filter(function (r) { return r.situacao !== "Inativo"; })
        .map(function (r) { return { id: r.id, nome: r.nome, cidade: r.cidade, uf: r.uf }; });
      return saida({ ok: true, reps: reps });
    }
    if (p.acao === "tudo") {
      checarSenha(p.senha);
      return saida({ ok: true, reps: lerReps(), pedidos: lerPedidos() });
    }
    return saida({ ok: true, msg: "Planilha Couro Forte funcionando." });
  } catch (err) {
    return saida({ ok: false, erro: String(err.message || err) });
  }
}

/* ---------- gravação (POST) ---------- */
function doPost(e) {
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
    const c = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const d = c.dados || {};
    switch (c.acao) {
      case "pedido":
        return saida({ ok: true, pedido: criarPedido(d) });
      case "verificar":
        checarSenha(c.senha);
        return saida({ ok: true });
      case "salvarRep":
        checarSenha(c.senha);
        return saida({ ok: true, rep: salvarRep(d) });
      case "excluirRep":
        checarSenha(c.senha);
        excluirLinha(ABA_REPS, COL_REPS, d.id);
        return saida({ ok: true });
      case "atualizarPedido":
        checarSenha(c.senha);
        return saida({ ok: true, pedido: salvarPedido(d) });
      case "excluirPedido":
        checarSenha(c.senha);
        excluirLinha(ABA_PED, COL_PED, d.id);
        return saida({ ok: true });
      case "importar":
        checarSenha(c.senha);
        (d.reps || []).forEach(function (r) { if (r && r.id) salvarRep(r); });
        (d.pedidos || []).forEach(function (p) { if (p && p.id) salvarPedido(p); });
        return saida({ ok: true });
    }
    throw new Error("Ação desconhecida.");
  } catch (err) {
    return saida({ ok: false, erro: String(err.message || err) });
  } finally {
    trava.releaseLock();
  }
}

/* ---------- regras ---------- */
function checarSenha(s) {
  if (SENHA === "TROQUE-ESTA-SENHA") throw new Error("Troque a senha no script da planilha antes de usar o painel.");
  if (String(s || "") !== SENHA) throw new Error("Senha errada.");
}

function criarPedido(d) {
  if (!d.cliente || String(d.cliente).trim().length < 2) throw new Error("Pedido sem nome do cliente.");
  if (!Array.isArray(d.itens) || d.itens.length === 0) throw new Error("Pedido sem itens.");
  if (d.itens.length > 300) throw new Error("Pedido grande demais.");

  const pedidos = lerPedidos();
  const maior = pedidos.reduce(function (m, p) { return Math.max(m, Number(p.numero) || 0); }, 1000);
  const p = {
    id: d.id || Utilities.getUuid(),
    numero: maior + 1,
    data: new Date().toISOString(),
    status: "Novo",
    cliente: limpar(d.cliente, 120),
    telefone: limpar(d.telefone, 30),
    cidade: limpar(d.cidade, 80),
    uf: limpar(d.uf, 2),
    representanteId: limpar(d.representanteId, 40),
    representante: limpar(d.representante, 120),
    obs: limpar(d.obs, 1000),
    origem: "site",
    pagamento: { forma: limpar((d.pagamento && d.pagamento.forma) || "A combinar", 40), parcelas: [] },
    comissaoPct: "",
    itens: d.itens.map(function (i) {
      return {
        foto: limpar(i.foto, 200), nome: limpar(i.nome, 120), ref: limpar(i.ref, 20), linha: limpar(i.linha, 40),
        couro: limpar(i.couro, 40), cor: limpar(i.cor, 60), solado: limpar(i.solado, 40), bico: limpar(i.bico, 20),
        tamanho: Number(i.tamanho) || 0, qtd: Math.max(1, Math.min(999, Number(i.qtd) || 1)), preco: limpar(i.preco, 20)
      };
    })
  };
  p.pares = p.itens.reduce(function (s, i) { return s + i.qtd; }, 0);
  p.total = (d.total === null || d.total === undefined || d.total === "") ? null : Number(d.total) || null;
  // o nome do representante vem sempre do cadastro (não do que o navegador mandou)
  if (p.representanteId) {
    const rep = lerReps().filter(function (r) { return r.id === p.representanteId; })[0];
    if (rep) {
      p.representante = rep.nome;
      p.comissaoPct = Number(String(rep.comissao || "").replace(",", ".")) || "";
    }
  }
  gravarPedido(p, true);
  return p;
}

function salvarPedido(p) {
  const atual = lerPedidos().filter(function (x) { return x.id === p.id; })[0];
  const novo = atual ? Object.assign({}, atual, p) : p;
  gravarPedido(novo, !atual);
  return novo;
}

function salvarRep(r) {
  const linha = COL_REPS.map(function (k) { return limpar(r[k], 500); });
  gravarLinha(ABA_REPS, COL_REPS, TITULOS_REPS, r.id, linha);
  const o = {};
  COL_REPS.forEach(function (k, i) { o[k] = linha[i]; });
  return o;
}

/* ---------- planilha ---------- */
function aba(nome, titulos) {
  const pl = SpreadsheetApp.getActiveSpreadsheet();
  let sh = pl.getSheetByName(nome);
  if (!sh) {
    sh = pl.insertSheet(nome);
    sh.getRange(1, 1, 1, titulos.length).setValues([titulos]).setFontWeight("bold").setBackground("#2a1a11").setFontColor("#e3c47a");
    sh.setFrozenRows(1);
    sh.getRange("A:Z").setNumberFormat("@"); // tudo como texto (não estraga telefone, CPF e datas)
  }
  return sh;
}

function lerLinhas(nome, colunas, titulos) {
  const sh = aba(nome, titulos);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, colunas.length).getDisplayValues().map(function (l) {
    const o = {};
    colunas.forEach(function (k, i) { o[k] = l[i]; });
    return o;
  });
}

function lerReps() {
  return lerLinhas(ABA_REPS, COL_REPS, TITULOS_REPS).filter(function (r) { return r.id; });
}

function lerPedidos() {
  return lerLinhas(ABA_PED, COL_PED, TITULOS_PED).filter(function (l) { return l.id; }).map(function (l) {
    let p = {};
    try { p = JSON.parse(l.json || "{}"); } catch (e) {}
    // o que foi mudado direto na planilha (ex: situação) vale mais
    p.id = l.id;
    p.numero = Number(l.numero) || p.numero;
    p.status = l.status || p.status;
    p.representante = l.representante === "Direto com a fábrica" ? "" : l.representante;
    p.representanteId = l.representanteId;
    return p;
  });
}

function gravarPedido(p, novo) {
  const texto = (p.itens || []).map(function (i) { return i.nome + " Ref " + i.ref + " " + i.cor + " Nº" + i.tamanho + " x" + i.qtd; }).join(" | ");
  const linha = [p.numero, Utilities.formatDate(new Date(p.data), "America/Sao_Paulo", "dd/MM/yyyy HH:mm"), p.status,
    p.cliente, p.telefone, p.cidade, p.uf, p.representante || "Direto com a fábrica", p.pares,
    p.total === null || p.total === undefined ? "A combinar" : p.total, texto, p.obs || "", p.id, p.representanteId || "",
    JSON.stringify(p), textoPagamento(p), textoComissao(p)].map(function (v) { return String(v === null || v === undefined ? "" : v); });
  gravarLinha(ABA_PED, COL_PED, TITULOS_PED, p.id, linha);
}

function textoPagamento(p) {
  const pg = p.pagamento || {};
  const parc = pg.parcelas || [];
  if (!parc.length) return pg.forma || "A combinar";
  const pagas = parc.filter(function (x) { return x.pago; }).length;
  return pg.forma + " · " + parc.map(function (x, k) {
    return (k + 1) + "ª " + String(x.vencimento || "").split("-").reverse().join("/") + " R$ " + Number(x.valor || 0).toFixed(2).replace(".", ",") + (x.pago ? " (paga)" : "");
  }).join(" | ") + " · " + pagas + "/" + parc.length + " pagas";
}

function textoComissao(p) {
  if (!p.comissaoPct) return "";
  return p.comissaoPct + "%" + (p.comissaoValor ? " = R$ " + Number(p.comissaoValor).toFixed(2).replace(".", ",") : "") + (p.comissaoPaga ? " (paga)" : "");
}

function gravarLinha(nome, colunas, titulos, id, linha) {
  const sh = aba(nome, titulos);
  const colId = colunas.indexOf("id") + 1;
  const n = sh.getLastRow() - 1;
  if (n > 0) {
    const ids = sh.getRange(2, colId, n, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sh.getRange(i + 2, 1, 1, linha.length).setValues([linha]);
        return;
      }
    }
  }
  sh.appendRow(linha);
}

function excluirLinha(nome, colunas, id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!sh || sh.getLastRow() < 2) return;
  const colId = colunas.indexOf("id") + 1;
  const ids = sh.getRange(2, colId, sh.getLastRow() - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(id)) sh.deleteRow(i + 2);
  }
}

function limpar(v, max) {
  if (v === null || v === undefined) return "";
  let s = String(v).trim().slice(0, max || 200);
  // evita que a planilha trate o texto como fórmula
  if (/^[=+@]/.test(s)) s = "'" + s;
  return s;
}

function saida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
