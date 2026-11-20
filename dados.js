/* =====================================================================
   COURO FORTE — onde os dados ficam guardados
   ---------------------------------------------------------------------
   Modo LOCAL  (PLANILHA_URL vazio): salva no navegador deste computador.
   Modo ONLINE (PLANILHA_URL preenchido): salva na planilha do Google,
   e todos os computadores e celulares enxergam os mesmos dados.
   Não precisa mexer neste arquivo.
   ===================================================================== */
const Dados = (() => {
  const K_REPS = "cf-representantes";
  const K_PED = "cf-pedidos";
  const K_SENHA = "cf-senha";

  const url = () => (typeof PLANILHA_URL === "string" ? PLANILHA_URL.trim() : "");
  const online = () => /^https?:\/\//.test(url());

  const ler = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return []; } };
  const gravar = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { throw new Error("Este navegador não deixou salvar. Faça um backup."); }
  };
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  let senha = "";
  try { senha = localStorage.getItem(K_SENHA) || ""; } catch (e) {}

  async function pedirGet(params) {
    const u = new URL(url());
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    let r;
    try { r = await fetch(u.toString(), { cache: "no-store" }); }
    catch (e) { throw new Error("Sem conexão com a planilha. Verifique a internet."); }
    const j = await r.json().catch(() => ({ ok: false, erro: "Resposta inválida da planilha." }));
    if (!j.ok) throw new Error(j.erro || "Erro na planilha.");
    return j;
  }
  async function pedirPost(acao, dados) {
    let r;
    // sem "Content-Type" para o Google aceitar o envio direto do navegador
    try { r = await fetch(url(), { method: "POST", body: JSON.stringify({ acao, senha, dados }) }); }
    catch (e) { throw new Error("Sem conexão com a planilha. Verifique a internet."); }
    const j = await r.json().catch(() => ({ ok: false, erro: "Resposta inválida da planilha." }));
    if (!j.ok) throw new Error(j.erro || "Erro na planilha.");
    return j;
  }

  function upsertLocal(chave, obj) {
    const lista = ler(chave);
    const i = lista.findIndex((x) => x.id === obj.id);
    if (i >= 0) lista[i] = obj; else lista.push(obj);
    gravar(chave, lista);
    return obj;
  }

  return {
    online,
    novoId,
    temSenha: () => !!senha,
    definirSenha(s) { senha = s; try { localStorage.setItem(K_SENHA, s); } catch (e) {} },
    esquecerSenha() { senha = ""; try { localStorage.removeItem(K_SENHA); } catch (e) {} },

    /** confere a senha do painel (só no modo online) */
    async verificarSenha() {
      if (!online()) return true;
      await pedirPost("verificar", {});
      return true;
    },

    /** lista curta de representantes ativos, para o cliente escolher no carrinho */
    async repsPublicos() {
      if (online()) return (await pedirGet({ acao: "reps" })).reps || [];
      return ler(K_REPS).filter((r) => r.situacao !== "Inativo").map(({ id, nome, cidade, uf }) => ({ id, nome, cidade, uf }));
    },

    /** tudo para o painel */
    async carregarTudo() {
      if (online()) {
        const j = await pedirGet({ acao: "tudo", senha });
        return { reps: j.reps || [], pedidos: j.pedidos || [] };
      }
      return { reps: ler(K_REPS), pedidos: ler(K_PED) };
    },

    async salvarRep(rep) {
      if (online()) return (await pedirPost("salvarRep", rep)).rep;
      return upsertLocal(K_REPS, rep);
    },
    async excluirRep(id) {
      if (online()) return pedirPost("excluirRep", { id });
      gravar(K_REPS, ler(K_REPS).filter((r) => r.id !== id));
    },

    /** novo pedido vindo do carrinho: o número é dado aqui (ou pela planilha) */
    async criarPedido(p) {
      const pedido = { ...p, id: novoId(), data: new Date().toISOString(), status: "Novo" };
      if (online()) return (await pedirPost("pedido", pedido)).pedido;
      const lista = ler(K_PED);
      pedido.numero = lista.reduce((m, x) => Math.max(m, Number(x.numero) || 0), 1000) + 1;
      // nome do representante sempre conferido pelo cadastro
      if (pedido.representanteId) {
        const rep = ler(K_REPS).find((r) => r.id === pedido.representanteId);
        if (rep) {
          pedido.representante = rep.nome;
          pedido.comissaoPct = rep.comissao ? Number(String(rep.comissao).replace(",", ".")) || "" : "";
        }
      }
      lista.push(pedido);
      gravar(K_PED, lista);
      return pedido;
    },
    async atualizarPedido(p) {
      if (online()) return (await pedirPost("atualizarPedido", p)).pedido;
      return upsertLocal(K_PED, p);
    },
    async excluirPedido(id) {
      if (online()) return pedirPost("excluirPedido", { id });
      gravar(K_PED, ler(K_PED).filter((p) => p.id !== id));
    },

    /** restaurar backup */
    async importar({ reps = [], pedidos = [] }) {
      if (online()) return pedirPost("importar", { reps, pedidos });
      reps.forEach((r) => r && r.id && upsertLocal(K_REPS, r));
      pedidos.forEach((p) => p && p.id && upsertLocal(K_PED, p));
    },
  };
})();
