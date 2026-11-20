/* =====================================================================
   COURO FORTE — Carrinho de pedidos
   ---------------------------------------------------------------------
   - O cliente escolhe a numeração e a quantidade de cada botina.
   - Ao finalizar, informa os dados e QUEM ATENDEU (o representante).
   - O pedido vai para a LISTA DE PEDIDOS do painel e também é enviado
     pelo WhatsApp da fábrica.
   - Link do representante: seusite.com.br/?rep=CODIGO
     (o link certo de cada um aparece no painel). Quem abrir o site por
     esse link já fica com o pedido marcado para aquele representante.
   ===================================================================== */
window.Carrinho = (() => {
  const K_CARR = "cf-carrinho";
  const K_REP = "cf-rep-link";
  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const num = (t) => String(t ?? "").replace(/\D/g, "");
  const preco = (p) => { const v = parseFloat(String(p || "").replace(/\./g, "").replace(",", ".")); return isNaN(v) ? null : v; };
  const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  let itens = [];
  try { itens = JSON.parse(localStorage.getItem(K_CARR) || "[]"); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(K_CARR, JSON.stringify(itens)); } catch (e) {} };

  // ---------- representante vindo do link (?rep=codigo&r=nome) ----------
  let repLink = null;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("rep")) {
      repLink = { id: q.get("rep"), nome: q.get("r") || "" };
      localStorage.setItem(K_REP, JSON.stringify(repLink));
    } else {
      repLink = JSON.parse(localStorage.getItem(K_REP) || "null");
    }
  } catch (e) {}

  // ---------- contador no topo ----------
  function totalPares() { return itens.reduce((s, i) => s + i.qtd, 0); }
  function totalValor() {
    if (!itens.length || itens.some((i) => preco(i.preco) === null)) return null;
    return itens.reduce((s, i) => s + preco(i.preco) * i.qtd, 0);
  }
  function atualizarContador() {
    const n = totalPares();
    const b = $("#carrinhoQtd");
    b.textContent = n > 99 ? "99+" : n;
    b.hidden = n === 0;
  }

  // ---------- grade de numeração na janela do produto ----------
  let produtoAtual = null;
  let escolha = {};
  function tamanhos(p) {
    const m = String(p.numeracao || "").match(/(\d+)\D+(\d+)/);
    if (!m) return [];
    const a = +m[1], b = +m[2];
    return b >= a && b - a < 40 ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [];
  }
  function desenharGrade() {
    const t = tamanhos(produtoAtual);
    $("#mNums").innerHTML = t.map((n) => {
      const q = escolha[n] || 0;
      return `<div class="num ${q ? "on" : ""}">
        <button type="button" class="num-add" data-n="${n}" aria-label="Adicionar 1 par número ${n}">${n}${q ? `<b>${q}</b>` : ""}</button>
        ${q ? `<button type="button" class="num-tirar" data-tirar="${n}" aria-label="Tirar 1 par número ${n}">−</button>` : ""}
      </div>`;
    }).join("");
    const pares = Object.values(escolha).reduce((s, q) => s + q, 0);
    $("#mGradeTotal").textContent = pares ? `${pares} par${pares > 1 ? "es" : ""} escolhido${pares > 1 ? "s" : ""}` : "";
    const btn = $("#mAddCarrinho");
    btn.disabled = pares === 0;
    btn.innerHTML = pares
      ? `<i class="fa-solid fa-cart-plus"></i> Adicionar ${pares} par${pares > 1 ? "es" : ""} ao carrinho`
      : `<i class="fa-solid fa-cart-plus"></i> Escolha a numeração`;
  }
  function prepararProduto(p) {
    produtoAtual = p;
    escolha = {};
    $("#mGrade").hidden = tamanhos(p).length === 0;
    desenharGrade();
  }
  $("#mNums").addEventListener("click", (e) => {
    const add = e.target.closest("[data-n]");
    const tirar = e.target.closest("[data-tirar]");
    if (add) escolha[add.dataset.n] = (escolha[add.dataset.n] || 0) + 1;
    if (tirar) { const n = tirar.dataset.tirar; escolha[n] = Math.max(0, (escolha[n] || 0) - 1); if (!escolha[n]) delete escolha[n]; }
    desenharGrade();
  });
  $("#mAddCarrinho").addEventListener("click", () => {
    const p = produtoAtual;
    if (!p) return;
    Object.entries(escolha).forEach(([tam, qtd]) => {
      const chave = `${p.fotos[0]}|${tam}`;
      const ja = itens.find((i) => i.chave === chave);
      if (ja) ja.qtd += qtd;
      else itens.push({ chave, foto: p.fotos[0], nome: p.nome, ref: p.ref, linha: p.linha, couro: p.couro, cor: p.cor, solado: p.solado, bico: p.bico, tamanho: Number(tam), qtd, preco: p.preco || "" });
    });
    guardar();
    atualizarContador();
    const pares = Object.values(escolha).reduce((s, q) => s + q, 0);
    escolha = {};
    desenharGrade();
    fecharProduto();
    avisoRapido(`${pares} par${pares > 1 ? "es" : ""} adicionado${pares > 1 ? "s" : ""} ao carrinho`);
    const b = $("#abrirCarrinho");
    b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo");
  });

  function avisoRapido(msg) {
    let a = $("#avisoCarrinho");
    if (!a) {
      a = document.createElement("button");
      a.id = "avisoCarrinho";
      a.className = "aviso-carrinho";
      a.addEventListener("click", () => { a.classList.remove("show"); abrir(); });
      document.body.appendChild(a);
    }
    a.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${esc(msg)} <u>Ver carrinho</u>`;
    a.classList.add("show");
    clearTimeout(a._t);
    a._t = setTimeout(() => a.classList.remove("show"), 4000);
  }

  // ---------- gaveta ----------
  const gaveta = $("#gaveta");
  function passo(qual) {
    ["passoItens", "passoDados", "passoOk"].forEach((id) => { $("#" + id).hidden = id !== qual; });
    $("#gavetaTituloTxt").textContent = qual === "passoDados" ? "Seus dados" : qual === "passoOk" ? "Pedido feito" : "Seu carrinho";
    gaveta.querySelector(".gaveta-box").scrollTop = 0;
  }
  function abrir() {
    desenharItens();
    passo("passoItens");
    gaveta.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function fechar() {
    gaveta.hidden = true;
    document.body.style.overflow = "";
  }
  $("#abrirCarrinho").addEventListener("click", abrir);
  gaveta.addEventListener("click", (e) => { if (e.target.closest("[data-fechar-carrinho]")) fechar(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !gaveta.hidden) fechar(); });

  function desenharItens() {
    const vazio = itens.length === 0;
    $("#carrinhoVazio").hidden = !vazio;
    $("#carrinhoRodape").hidden = vazio;
    $("#carrinhoItens").innerHTML = itens.map((i, k) => `
      <article class="item">
        <img src="${miniatura(i.foto)}" alt="" loading="lazy">
        <div class="item-info">
          <strong>${esc(i.nome)}</strong>
          <small>Ref ${esc(i.ref)} · ${esc(i.couro)} ${esc(i.cor)}</small>
          <span class="item-num">Nº ${i.tamanho}</span>
          ${preco(i.preco) !== null ? `<small class="item-preco">${reais(preco(i.preco))} o par</small>` : ""}
        </div>
        <div class="item-qtd">
          <button type="button" data-menos="${k}" aria-label="Diminuir">−</button>
          <span>${i.qtd}</span>
          <button type="button" data-mais="${k}" aria-label="Aumentar">+</button>
        </div>
        <button type="button" class="item-x" data-tirar-item="${k}" aria-label="Remover"><i class="fa-regular fa-trash-can"></i></button>
      </article>`).join("");
    const v = totalValor();
    $("#carrinhoPares").textContent = totalPares();
    $("#carrinhoValor").textContent = v === null ? "A combinar" : reais(v);
    atualizarContador();
  }
  $("#carrinhoItens").addEventListener("click", (e) => {
    const mais = e.target.closest("[data-mais]");
    const menos = e.target.closest("[data-menos]");
    const tirar = e.target.closest("[data-tirar-item]");
    if (mais) itens[+mais.dataset.mais].qtd++;
    if (menos) { const i = itens[+menos.dataset.menos]; i.qtd--; if (i.qtd < 1) itens.splice(+menos.dataset.menos, 1); }
    if (tirar) itens.splice(+tirar.dataset.tirarItem, 1);
    guardar();
    desenharItens();
  });
  let confirmaLimpar = false;
  $("#limparCarrinho").addEventListener("click", (e) => {
    if (!confirmaLimpar) {
      confirmaLimpar = true;
      e.currentTarget.innerHTML = `<i class="fa-regular fa-trash-can"></i> Toque de novo para esvaziar`;
      setTimeout(() => { confirmaLimpar = false; $("#limparCarrinho").innerHTML = `<i class="fa-regular fa-trash-can"></i> Esvaziar carrinho`; }, 3000);
      return;
    }
    itens = []; guardar(); desenharItens();
  });

  // ---------- passo 2: dados ----------
  const form = $("#formPedido");
  $("#pedUF").insertAdjacentHTML("beforeend", UFS.map((u) => `<option>${u}</option>`).join(""));
  form.telefone.addEventListener("input", (e) => {
    const n = num(e.target.value).slice(0, 11);
    e.target.value = n.length <= 2 ? (n ? `(${n}` : "") : n.length <= 6 ? `(${n.slice(0, 2)}) ${n.slice(2)}` :
      n.length <= 10 ? `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}` : `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  });
  // lembra os dados do cliente para a próxima compra
  try {
    const c = JSON.parse(localStorage.getItem("cf-cliente") || "null");
    if (c) ["cliente", "telefone", "cidade", "uf"].forEach((k) => { if (c[k]) form[k].value = c[k]; });
  } catch (e) {}

  let repsCarregados = false;
  async function carregarReps() {
    mostrarRepFixo();
    if (repsCarregados) return;
    try {
      const reps = await Dados.repsPublicos();
      repsCarregados = true;
      const sel = $("#pedRep");
      sel.innerHTML = `<option value="">Comprei direto com a fábrica</option>` +
        reps.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
          .map((r) => `<option value="${esc(r.id)}">${esc(r.nome)}${r.cidade ? ` — ${esc(r.cidade)}/${esc(r.uf)}` : ""}</option>`).join("") +
        `<option value="__outro">Outro (digitar o nome)</option>`;
      if (repLink && reps.some((r) => r.id === repLink.id)) {
        sel.value = repLink.id;
        if (!repLink.nome) repLink.nome = reps.find((r) => r.id === repLink.id).nome;
      }
      mostrarRepFixo();
    } catch (e) {
      $("#pedRep").innerHTML = `<option value="">Comprei direto com a fábrica</option><option value="__outro">Fui atendido por um representante</option>`;
    }
  }
  function mostrarRepFixo() {
    const fixo = !!(repLink && repLink.id);
    $("#repFixo").hidden = !fixo;
    $("#repEscolha").hidden = fixo;
    if (fixo) $("#repFixoNome").textContent = repLink.nome || "Representante do link";
  }
  $("#repTrocar").addEventListener("click", () => {
    repLink = null;
    try { localStorage.removeItem(K_REP); } catch (e) {}
    mostrarRepFixo();
  });
  $("#pedRep").addEventListener("change", (e) => { $("#repOutroBox").hidden = e.target.value !== "__outro"; });

  $("#irDados").addEventListener("click", () => {
    $("#dadosPares").textContent = totalPares() === 1 ? "1 par" : `${totalPares()} pares`;
    const v = totalValor();
    $("#dadosValor").textContent = v === null ? "Valor a combinar" : reais(v);
    $("#pedErro").hidden = true;
    passo("passoDados");
    carregarReps();
    setTimeout(() => (form.cliente.value ? form.querySelector("textarea") : form.cliente).focus(), 60);
  });
  // tira o vermelho do campo assim que a pessoa corrige
  form.addEventListener("input", (e) => { e.target.classList.remove("invalido"); $("#pedErro").hidden = true; });
  $("#voltarItens").addEventListener("click", () => { desenharItens(); passo("passoItens"); });

  function mensagemWhats(p) {
    const linhas = p.itens.map((i) => `• ${i.nome} Ref ${i.ref} — ${i.couro} ${i.cor} — Nº ${i.tamanho} × ${i.qtd}`);
    return [
      `*PEDIDO Nº ${p.numero} — Couro Forte*`,
      ``,
      `*Cliente:* ${p.cliente}`,
      `*WhatsApp:* ${p.telefone}`,
      `*Cidade:* ${p.cidade}/${p.uf}`,
      `*Representante:* ${p.representante || "Direto com a fábrica"}`,
      ``,
      `*Itens:*`,
      ...linhas,
      ``,
      p.pagamento && p.pagamento.forma !== "A combinar" ? `*Pagamento:* ${p.pagamento.forma}` : "",
      `*Total:* ${p.pares} ${p.pares === 1 ? "par" : "pares"}${p.total ? ` · ${reais(p.total)}` : " · valor a combinar"}`,
      p.obs ? `*Obs:* ${p.obs}` : "",
    ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    Object.keys(d).forEach((k) => { d[k] = String(d[k]).trim(); });
    const falta = [];
    $$(".invalido", form).forEach((el) => el.classList.remove("invalido"));
    const marcar = (c, m) => { form[c].classList.add("invalido"); falta.push(m); };
    if (d.cliente.length < 3) marcar("cliente", "seu nome");
    if (num(d.telefone).length < 10) marcar("telefone", "WhatsApp com DDD");
    if (!d.cidade) marcar("cidade", "cidade");
    if (!d.uf) marcar("uf", "estado");
    if (!itens.length) falta.push("itens no carrinho");
    if (falta.length) {
      $("#pedErro").textContent = "Falta preencher: " + falta.join(", ") + ".";
      $("#pedErro").hidden = false;
      return;
    }

    let representanteId = "", representante = "";
    if (repLink && repLink.id) { representanteId = repLink.id; representante = repLink.nome || ""; }
    else if (d.representanteId === "__outro") { representante = d.representanteOutro || ""; }
    else if (d.representanteId) {
      representanteId = d.representanteId;
      representante = $("#pedRep").selectedOptions[0].textContent.split(" — ")[0];
    }

    const pedido = {
      cliente: d.cliente, telefone: d.telefone, cidade: d.cidade, uf: d.uf,
      representanteId, representante, obs: d.obs || "", origem: "site",
      pagamento: { forma: d.pagamento || "A combinar", parcelas: [] },
      itens: itens.map(({ chave, ...i }) => i),
      pares: totalPares(),
      total: totalValor(),
    };

    const btn = $("#enviarPedido");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Registrando pedido...`;
    try {
      const salvo = await Dados.criarPedido(pedido);
      try { localStorage.setItem("cf-cliente", JSON.stringify({ cliente: d.cliente, telefone: d.telefone, cidade: d.cidade, uf: d.uf })); } catch (er) {}
      $("#okNumero").textContent = "nº " + salvo.numero;
      $("#okWhats").href = linkWhats(mensagemWhats(salvo));
      itens = []; guardar(); atualizarContador();
      form.obs.value = "";
      passo("passoOk");
    } catch (err) {
      $("#pedErro").innerHTML = `${esc(err.message)} <br>Você pode tentar de novo ou <a href="${linkWhats(mensagemWhats({ ...pedido, numero: "(sem número)" }))}" target="_blank" rel="noopener">enviar o pedido direto pelo WhatsApp</a>.`;
      $("#pedErro").hidden = false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> Confirmar pedido`;
    }
  });

  // faixa avisando que o cliente veio pelo link de um representante
  if (repLink && repLink.nome) {
    const f = document.createElement("div");
    f.className = "faixa-rep";
    f.innerHTML = `<i class="fa-solid fa-user-tie"></i> Você está sendo atendido por <strong>${esc(repLink.nome)}</strong>`;
    document.querySelector(".header").after(f);
  }

  atualizarContador();
  return { prepararProduto, abrir };
})();
