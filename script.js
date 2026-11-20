/* =====================================================================
   BOTINAS COURO FORTE — funcionamento do site
   Os modelos ficam no arquivo produtos.js
   ===================================================================== */

// ---------- CONFIGURAÇÃO (troque aqui se mudar o número) ----------
const WHATSAPP = "553433150163";              // DDI + DDD + número, só números
const ENDERECO_MAPA = "Rua Ranulfa Fonseca da Cunha, 332, Manoel Mendes, Uberaba - MG, 38082-151";
const POR_PAGINA = 12;                         // quantos modelos aparecem antes do "Ver mais"

// ---------- Funções de apoio ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const linkWhats = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
const PASTA = "./fotos/";                       // pasta das fotos grandes
const PASTA_P = "./fotos/p/";                   // pasta das fotos pequenas (cartões)
const completo = (f) => /^(\.?\/|https?:)/.test(f);   // caminho completo, ex: "./outra-pasta/foto.jpg"
const caminho = (f) => encodeURI(completo(f) ? f : PASTA + f);
const miniatura = (f) => encodeURI(completo(f) ? f : PASTA_P + f);
// Quando o nome é só "Botina", usa o nome da linha (ex: "Botina Agroboot")
PRODUTOS.forEach((p) => {
  if (/^botina$/i.test(p.nome.trim()) && !["Feminina", "Infantil"].includes(p.linha)) p.nome = `Botina ${p.linha}`;
});
const titulo = (p) => `${p.nome} · Ref ${p.ref}`;
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const msgProduto = (p) =>
  `Olá! Vi no site e quero saber sobre a *${p.nome} Ref ${p.ref}*\n` +
  `Couro ${p.couro} ${p.cor} · Solado ${p.solado} · Bico ${p.bico}${p.ziper ? " · Com zíper" : ""}\n` +
  `Qual o preço e tem na numeração ___?`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Quando a foto não existe, mostra "Foto em breve" no lugar de um ícone quebrado
// Se a foto pequena não existir, tenta a grande antes de desistir
function fotoComErro(img) {
  img.addEventListener("error", function erro() {
    if (img.dataset.grande && img.src.indexOf(img.dataset.grande) === -1) { img.src = img.dataset.grande; return; }
    img.removeEventListener("error", erro);
    img.parentElement.classList.add("sem-foto");
  });
}

// ---------- Links de WhatsApp genéricos ----------
$$(".js-whats").forEach((a) => {
  a.href = linkWhats(a.dataset.msg || "Olá! Vim pelo site e gostaria de informações sobre as botinas Couro Forte.");
  a.target = "_blank";
  a.rel = "noopener";
});

// ---------- Modo claro / modo escuro ----------
function aplicarTema(tema) {
  if (tema === "escuro") document.documentElement.setAttribute("data-tema", "escuro");
  else document.documentElement.removeAttribute("data-tema");
  $$(".tema button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tema === tema));
  try { localStorage.setItem("cf-tema", tema); } catch (e) {}   // lembra a escolha da pessoa
}
aplicarTema(document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro");
$$(".tema button").forEach((b) => b.addEventListener("click", () => aplicarTema(b.dataset.tema)));

// ---------- Cabeçalho, menu e botão de topo ----------
const header = $(".header");
const menu = $("#menu");
const menuBtn = $("#menuBtn");
const toTop = $("#toTop");

menuBtn.addEventListener("click", () => {
  const aberto = menu.classList.toggle("open");
  menuBtn.classList.toggle("open", aberto);
  menuBtn.setAttribute("aria-expanded", aberto);
});
$$("#menu a").forEach((a) => a.addEventListener("click", () => {
  menu.classList.remove("open");
  menuBtn.classList.remove("open");
}));

addEventListener("scroll", () => {
  header.classList.toggle("scrolled", scrollY > 20);
  toTop.classList.toggle("show", scrollY > 600);
}, { passive: true });
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

// ---------- Catálogo ----------
const estado = { cat: "todos", linha: "", bico: "", solado: "", busca: "", mostrar: POR_PAGINA };
const grid = $("#grid");

$("#totalModelos").textContent = PRODUTOS.length;

// Contadores nas abas
$$(".tab").forEach((t) => {
  const c = t.dataset.cat;
  t.querySelector("b").textContent = c === "todos" ? PRODUTOS.length : PRODUTOS.filter((p) => p.categoria === c).length;
});

// Opções de solado
[...new Set(PRODUTOS.map((p) => p.solado))].sort().forEach((s) => {
  $("#filtroSolado").insertAdjacentHTML("beforeend", `<option value="${esc(s)}">Solado ${esc(s)}</option>`);
});

function montarChips() {
  const base = estado.cat === "todos" ? PRODUTOS : PRODUTOS.filter((p) => p.categoria === estado.cat);
  const linhas = [...new Set(base.map((p) => p.linha))];
  if (linhas.length < 2) { $("#chips").innerHTML = ""; return; }
  $("#chips").innerHTML =
    `<button class="chip ${estado.linha ? "" : "active"}" data-linha="">Todas as linhas</button>` +
    linhas.map((l) => `<button class="chip ${estado.linha === l ? "active" : ""}" data-linha="${esc(l)}">${esc(l)}</button>`).join("");
}

function filtrar() {
  const termo = semAcento(estado.busca.trim());
  return PRODUTOS.filter((p) =>
    (estado.cat === "todos" || p.categoria === estado.cat) &&
    (!estado.linha || p.linha === estado.linha) &&
    (!estado.bico || p.bico === estado.bico) &&
    (!estado.solado || p.solado === estado.solado) &&
    (!termo || semAcento(`${p.nome} ${p.linha} ${p.ref} ${p.couro} ${p.cor} ${p.solado} ${p.bico} ${p.ziper ? "ziper" : ""}`).includes(termo))
  );
}

function cartao(p, i) {
  const idx = PRODUTOS.indexOf(p);
  const preco = p.preco ? `<span class="price">R$ ${esc(p.preco)}</span>` : `<span class="price consulte">Sob consulta</span>`;
  return `
  <article class="card" style="animation-delay:${(i % POR_PAGINA) * 40}ms">
    <button class="card-img" data-abrir="${idx}" aria-label="Ver detalhes de ${esc(titulo(p))}">
      <div class="badges">
        <span class="badge">${esc(p.bico === "Quadrado" ? "Bico quadrado" : "Bico redondo")}</span>
        ${p.ziper ? `<span class="badge gold">Zíper</span>` : ""}
      </div>
      <img src="${miniatura(p.fotos[0])}" data-grande="${caminho(p.fotos[0])}" alt="${esc(titulo(p))} - couro ${esc(p.couro)} ${esc(p.cor)}" loading="lazy">
      ${p.fotos.length > 1 ? `<span class="badge fotos-n"><i class="fa-regular fa-images"></i> ${p.fotos.length}</span>` : ""}
      <span class="zoom"><i class="fa-solid fa-expand"></i></span>
    </button>
    <div class="card-body">
      <span class="card-linha">${esc(p.linha)}</span>
      <h3>${esc(p.nome)} <small>Ref ${esc(p.ref)}</small></h3>
      <div class="specs">
        <span>${esc(p.couro)} ${esc(p.cor)}</span>
        <span>Solado ${esc(p.solado)}</span>
        ${p.numeracao ? `<span>Nº ${esc(p.numeracao)}</span>` : ""}
      </div>
      <div class="card-foot">
        ${preco}
        <button class="btn btn-gold" data-abrir="${idx}"><i class="fa-solid fa-cart-plus"></i> Comprar</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const lista = filtrar();
  const visiveis = lista.slice(0, estado.mostrar);
  grid.innerHTML = visiveis.map(cartao).join("");
  $$(".card-img img", grid).forEach(fotoComErro);

  $("#resultInfo").textContent = lista.length
    ? `Mostrando ${visiveis.length} de ${lista.length} modelo${lista.length > 1 ? "s" : ""}`
    : "";
  $("#empty").hidden = lista.length > 0;
  const btn = $("#btnMais");
  btn.parentElement.hidden = lista.length <= estado.mostrar;
  btn.textContent = `Ver mais modelos (${lista.length - visiveis.length})`;
}

function trocarCategoria(cat) {
  estado.cat = cat;
  estado.linha = "";
  estado.mostrar = POR_PAGINA;
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === cat));
  montarChips();
  render();
}

$("#tabs").addEventListener("click", (e) => {
  const t = e.target.closest(".tab");
  if (t) trocarCategoria(t.dataset.cat);
});
$("#chips").addEventListener("click", (e) => {
  const c = e.target.closest(".chip");
  if (!c) return;
  estado.linha = c.dataset.linha;
  estado.mostrar = POR_PAGINA;
  montarChips();
  render();
});
let espera;
$("#busca").addEventListener("input", (e) => {
  clearTimeout(espera);
  espera = setTimeout(() => { estado.busca = e.target.value; estado.mostrar = POR_PAGINA; render(); }, 180);
});
$("#filtroBico").addEventListener("change", (e) => { estado.bico = e.target.value; estado.mostrar = POR_PAGINA; render(); });
$("#filtroSolado").addEventListener("change", (e) => { estado.solado = e.target.value; estado.mostrar = POR_PAGINA; render(); });
$("#btnMais").addEventListener("click", () => { estado.mostrar += POR_PAGINA; render(); });
$("#limpar").addEventListener("click", () => {
  Object.assign(estado, { linha: "", bico: "", solado: "", busca: "" });
  $("#busca").value = ""; $("#filtroBico").value = ""; $("#filtroSolado").value = "";
  trocarCategoria("todos");
});

// Links do rodapé que abrem uma categoria
$$("[data-go]").forEach((a) => a.addEventListener("click", () => trocarCategoria(a.dataset.go)));

// ---------- Linhas ----------
(function montarLinhas() {
  const grupos = {};
  PRODUTOS.forEach((p) => { (grupos[p.linha] ||= []).push(p); });
  const ordem = Object.keys(grupos).sort((a, b) => grupos[b].length - grupos[a].length);
  $("#linesGrid").innerHTML = ordem.map((l) => {
    const p = grupos[l][0];
    const n = grupos[l].length;
    const d = (typeof DESTAQUES !== "undefined") && DESTAQUES.find((x) => x.linha === l);
    return `
      <button class="line-card reveal" data-linha="${esc(l)}" data-cat="${p.categoria}">
        <img src="${d ? caminho(d.foto) : miniatura(p.fotos[0])}" data-grande="${caminho(p.fotos[0])}" class="${d ? "recorte" : ""}" alt="Linha ${esc(l)}" loading="lazy">
        <div class="lc-info">
          <div><strong>${esc(l)}</strong><span>${n} modelo${n > 1 ? "s" : ""}</span></div>
          <i class="fa-solid fa-arrow-right"></i>
        </div>
      </button>`;
  }).join("");
  $$(".line-card img").forEach(fotoComErro);
  $("#linesGrid").addEventListener("click", (e) => {
    const c = e.target.closest(".line-card");
    if (!c) return;
    const linha = c.dataset.linha;
    const cats = new Set(PRODUTOS.filter((p) => p.linha === linha).map((p) => p.categoria));
    trocarCategoria(cats.size === 1 ? [...cats][0] : "todos");
    estado.linha = linha;
    montarChips();
    render();
    $("#catalogo").scrollIntoView({ behavior: "smooth" });
  });
})();

// ---------- Janela do produto ----------
const modal = $("#modal");
fotoComErro($("#mImg"));
function abrirProduto(p) {
  const img = $("#mImg");
  const trocar = (f) => {
    img.parentElement.classList.remove("sem-foto");
    img.dataset.grande = caminho(f);
    img.src = caminho(f);
  };
  trocar(p.fotos[0]);
  img.alt = titulo(p);
  $("#mThumbs").innerHTML = p.fotos.length > 1
    ? p.fotos.map((f, i) => `<button class="${i ? "" : "active"}" data-f="${esc(f)}"><img src="${miniatura(f)}" alt="Foto ${i + 1}"></button>`).join("")
    : "";
  $$("#mThumbs button").forEach((b) => b.addEventListener("click", () => {
    $$("#mThumbs button").forEach((x) => x.classList.toggle("active", x === b));
    trocar(b.dataset.f);
  }));
  const nomeCat = p.categoria === "adulto" ? "Adulto" : p.categoria === "feminina" ? "Feminina" : "Infantil";
  $("#mLinha").textContent = p.linha === nomeCat ? `Linha ${nomeCat}` : `Linha ${p.linha} · ${nomeCat}`;
  $("#mTitulo").textContent = p.nome;
  $("#mRef").textContent = `Referência ${p.ref}`;
  const dados = [
    ["Couro", `${p.couro} ${p.cor}`],
    ["Solado", p.solado],
    ["Bico", p.bico],
    ["Zíper", p.ziper ? "Sim" : "Não"],
  ];
  if (p.numeracao) dados.push(["Numeração", p.numeracao]);
  $("#mDados").innerHTML = dados.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  const preco = $("#mPreco");
  preco.textContent = p.preco ? `R$ ${p.preco}` : "Consulte o preço pelo WhatsApp";
  preco.classList.toggle("consulte", !p.preco);
  $("#mWhats").href = linkWhats(msgProduto(p));
  if (window.Carrinho) Carrinho.prepararProduto(p);   // grade de numeração (carrinho.js)
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $(".modal-x").focus();
}
function fecharProduto() {
  modal.hidden = true;
  document.body.style.overflow = "";
}
grid.addEventListener("click", (e) => {
  const b = e.target.closest("[data-abrir]");
  if (b) abrirProduto(PRODUTOS[+b.dataset.abrir]);
});
modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) fecharProduto(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) fecharProduto(); });

// ---------- Hero: troca a botina em destaque ----------
(function heroRotativo() {
  const img = $("#heroImg");
  const tag = $("#heroTag");
  const lista = (typeof DESTAQUES !== "undefined" && DESTAQUES.length)
    ? DESTAQUES.map((d) => ({ src: caminho(d.foto), titulo: d.titulo }))
    : PRODUTOS.map((p) => ({ src: caminho(p.fotos[0]), titulo: titulo(p) }));
  let i = 0, falhas = 0;
  function proxima() {
    const d = lista[++i % lista.length];
    img.style.opacity = 0;
    setTimeout(() => { img.src = d.src; tag.textContent = d.titulo; img.style.opacity = 1; }, 400);
  }
  img.addEventListener("error", () => {
    if (++falhas > 6) { img.style.visibility = "hidden"; tag.hidden = true; return; }
    proxima();
  });
  img.addEventListener("load", () => { falhas = 0; });
  img.src = lista[0].src;
  tag.textContent = lista[0].titulo;
  setInterval(proxima, 4500);
})();

// ---------- "Nossa história": troca a botina sozinha ----------
(function fabricaRotativa() {
  const img = $("#fabricaImg");
  const tag = $("#fabricaTag");
  const dots = $("#fabricaDots");
  if (!img || typeof DESTAQUES === "undefined" || DESTAQUES.length < 2) return;
  // começa no meio da lista para não mostrar a mesma botina do topo
  let i = Math.floor(DESTAQUES.length / 2);
  dots.innerHTML = DESTAQUES.map(() => "<i></i>").join("");
  function mostrar(n) {
    const d = DESTAQUES[n % DESTAQUES.length];
    img.classList.add("trocando");
    setTimeout(() => {
      img.src = caminho(d.foto);
      img.alt = d.titulo;
      tag.textContent = d.titulo;
      img.classList.remove("trocando");
    }, 450);
    $$("i", dots).forEach((el, k) => el.classList.toggle("on", k === n % DESTAQUES.length));
  }
  img.addEventListener("error", () => { mostrar(++i); });
  mostrar(i);
  setInterval(() => mostrar(++i), 3800);
})();

// ---------- Formulário → WhatsApp ----------
$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = $("#fNome").value.trim();
  const cidade = $("#fCidade").value.trim();
  const assunto = $("#fAssunto").value;
  const msg = $("#fMsg").value.trim();
  const texto = `Olá! Meu nome é ${nome}${cidade ? `, de ${cidade}` : ""}.\n*Assunto:* ${assunto}\n\n${msg}`;
  const link = document.createElement("a");   // abre o WhatsApp numa nova aba
  link.href = linkWhats(texto);
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// ---------- Mapa ----------
$("#mapa").src = `https://maps.google.com/maps?q=${encodeURIComponent(ENDERECO_MAPA)}&z=16&output=embed`;
$("[data-maps]").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO_MAPA)}`;
$("[data-maps]").target = "_blank";

// ---------- Animação ao rolar ----------
const obs = new IntersectionObserver((entradas) => {
  entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); } });
}, { threshold: 0.12 });
$$(".reveal").forEach((el) => obs.observe(el));

// ---------- Ano no rodapé ----------
$("#ano").textContent = new Date().getFullYear();

// Início
montarChips();
render();
