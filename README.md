<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./image/logo-branca.png">
  <img src="./image/logo-escura.png" alt="Botinas Couro Forte" width="220">
</picture>

# Botinas Couro Forte — Catálogo & Painel de Pedidos

**Site oficial da fábrica de botinas de couro legítimo de Uberaba‑MG, produzindo desde 1990.**
Catálogo online com mais de 100 modelos, carrinho de pedidos integrado ao WhatsApp e um painel administrativo completo para gerenciar pedidos, representantes, comissões e contas a receber.

<br>

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

![Status](https://img.shields.io/badge/status-em%20produção-2ea44f?style=flat-square)
![Responsivo](https://img.shields.io/badge/layout-100%25%20responsivo-c9a14a?style=flat-square)
![Sem dependências](https://img.shields.io/badge/build-sem%20dependências-6f4e37?style=flat-square)
![Tema](https://img.shields.io/badge/tema-claro%20%2F%20escuro-1c120c?style=flat-square)

[**🌐 Ver o site**](https://devsilvana521.github.io/site-couro-forte-com-fotos/) ·
[**📸 Capturas de tela**](#-capturas-de-tela) ·
[**⚙️ Como rodar**](#%EF%B8%8F-como-rodar) ·
[**📞 Contato**](#-contato)

</div>

---

## 📑 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Capturas de tela](#-capturas-de-tela)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Como rodar](#%EF%B8%8F-como-rodar)
- [Configuração](#-configuração)
- [Integração com Google Planilhas](#-integração-com-google-planilhas)
- [Gerenciando o catálogo](#-gerenciando-o-catálogo)
- [Publicação (deploy)](#-publicação-deploy)
- [Roadmap](#-roadmap)
- [Contato](#-contato)
- [Licença](#-licença)

---

## 🐎 Sobre o projeto

A **Couro Forte** é uma fábrica de calçados de Uberaba‑MG que produz botinas de couro legítimo para o trabalho, o campo e o dia a dia há mais de 35 anos.

Este repositório reúne **todo o site da marca**, pensado para resolver três problemas reais do negócio:

| Problema | Solução |
| --- | --- |
| Clientes não conseguiam ver todos os modelos em um só lugar | **Catálogo online** com 100+ modelos, busca e filtros por linha, bico e solado |
| Pedidos chegavam soltos e incompletos pelo WhatsApp | **Carrinho com grade de numeração** que gera um pedido numerado e envia tudo formatado pelo WhatsApp |
| Controle de vendas, representantes e recebimentos em papel | **Painel da fábrica** com pedidos, comissões, parcelas, contas a receber, backup e exportação para Excel |

Tudo foi construído com **HTML, CSS e JavaScript puros**: sem framework, sem build e sem servidor próprio. O site abre direto no navegador e pode ser hospedado gratuitamente no GitHub Pages.

---

## 📸 Capturas de tela

<div align="center">

### Página inicial

<img src="./docs/screenshots/home.jpg" alt="Página inicial no modo claro" width="900">

### Modo escuro

<img src="./docs/screenshots/home-escuro.jpg" alt="Página inicial no modo escuro" width="900">

### Catálogo com busca e filtros

<img src="./docs/screenshots/catalogo.jpg" alt="Catálogo com filtros por categoria, linha, bico e solado" width="900">

### Detalhe do produto com escolha de numeração

<img src="./docs/screenshots/produto.jpg" alt="Janela do produto com grade de numeração" width="900">

### Celular e painel da fábrica

<table>
  <tr>
    <td align="center"><img src="./docs/screenshots/mobile.jpg" alt="Versão para celular" width="280"><br><sub>Versão para celular</sub></td>
    <td align="center"><img src="./docs/screenshots/painel-login.jpg" alt="Acesso ao painel da fábrica" width="560"><br><sub>Acesso protegido ao painel da fábrica</sub></td>
  </tr>
</table>

</div>

---

## ✨ Funcionalidades

### 🛍️ Site (vitrine)

- **Catálogo com mais de 100 modelos** organizados em 15 linhas: Agroboot, Arame, Avestruz, Bordada, Com Costura, Coturno, Escamada, Látex, Sinuosa, Tatu, Tela, Tradicional, Vira Francesa, Feminina e Infantil.
- **Busca instantânea** por referência, cor ou tipo de couro (ex.: `7070`, `castor`, `nobuck`), sem diferenciar acentos.
- **Filtros combináveis** por público (Adulto, Feminina, Infantil), linha, tipo de bico e tipo de solado, com contador de resultados.
- **Paginação “Ver mais”** para carregar o catálogo aos poucos.
- **Janela de produto** com ficha técnica completa: couro, cor, solado, bico, zíper e numeração.
- **Destaques rotativos** no topo da página e na seção “Nossa história”.
- **Modo claro e modo escuro**, com a escolha salva no navegador e sem “piscar” ao carregar.
- **Totalmente responsivo**: celular, tablet e computador.
- **Atalhos de WhatsApp** em todo o site, com mensagens já preenchidas com o modelo escolhido.
- Formulário de contato que abre o WhatsApp com a mensagem pronta, mapa da fábrica e área para **revendedores**.
- **SEO e compartilhamento**: meta tags, Open Graph, favicon e ícone para iPhone.
- Fotos otimizadas em **duas resoluções** (miniatura para os cartões, foto grande no detalhe) e aviso de “Foto em breve” quando a imagem não existe.

### 🛒 Carrinho de pedidos

- Escolha de **vários números e vários pares** do mesmo modelo.
- Carrinho salvo no navegador: o cliente pode fechar a página e voltar depois.
- Finalização com nome, WhatsApp, cidade, estado e **representante que atendeu**.
- Cada pedido recebe um **número** e é enviado à fábrica pelo WhatsApp, já formatado.
- **Link exclusivo por representante**: os pedidos feitos por esse link ficam marcados automaticamente como venda dele.
- Soma automática do valor quando o produto tem preço cadastrado.

### 🔐 Painel da fábrica (`painel.html`)

- **Acesso com senha**, criada no primeiro acesso, com opção de trocar a senha e de sair.
- **Pedidos**: lista completa com filtros e situações (Novo, Confirmado, Em produção, Enviado, Entregue, Cancelado).
- **Detalhe do pedido**: preço por par (ou o mesmo preço para todos), desconto, frete e **total calculado automaticamente**.
- **Formas de pagamento**: Pix, dinheiro, débito, crédito à vista, crédito parcelado e boleto, com prazos (30, 30/60, 30/60/90…) e **calendário para cada vencimento**.
- **Contas a receber**: parcelas em aberto por data de vencimento, atrasadas em destaque e baixa com um clique.
- **Resumo financeiro**: total vendido, total recebido e saldo a receber.
- **Comissões**: percentual por representante, valor calculado sobre os produtos (sem o frete) e controle de comissão paga.
- **Ranking de vendas por representante**, em pares e em pedidos.
- **Cadastro de representantes**: nome, telefone, cidade, estado, loja, CPF/CNPJ (com máscara), região, tipo, situação, comissão e observações.
- **Resumo para o cliente pelo WhatsApp** com total, forma de pagamento e datas das parcelas.
- **Exportação para Excel (CSV)** de pedidos e representantes.
- **Backup e restauração** de todos os dados em um único arquivo.

---

## 🧰 Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Estrutura | HTML5 semântico, com atributos de acessibilidade (ARIA) |
| Estilo | CSS3 com variáveis (tema claro/escuro), Grid, Flexbox e animações ao rolar a página |
| Lógica | JavaScript puro (ES6+), sem frameworks |
| Tipografia | [Fraunces](https://fonts.google.com/specimen/Fraunces) e [Manrope](https://fonts.google.com/specimen/Manrope), do Google Fonts |
| Ícones | [Font Awesome](https://fontawesome.com/), servido localmente na pasta `vendor/` |
| Dados | `localStorage` do navegador **ou** Google Planilhas via Google Apps Script (API REST) |
| Pedidos | API de links do WhatsApp (`wa.me`) |
| Hospedagem | GitHub Pages ou qualquer hospedagem de arquivos estáticos |

---

## 📁 Estrutura de pastas

```text
site-couro-forte-com-fotos/
├── index.html              # Site: vitrine, catálogo, carrinho e contato
├── painel.html             # Painel da fábrica (área do administrador)
├── representantes.html     # Atalho que abre o painel na aba Representantes
├── style.css               # Visual completo, incluindo o tema claro/escuro
├── script.js               # Catálogo, filtros, janela do produto, tema e WhatsApp
├── carrinho.js             # Carrinho, finalização e link de representante
├── painel.js               # Pedidos, pagamentos, comissões, representantes e backup
├── dados.js                # Camada de dados (localStorage ou Google Planilhas)
├── config.js               # Endereço da planilha do Google (opcional)
├── produtos.js             # Catálogo de botinas: um modelo por linha
├── fotos/                  # Fotos grandes dos produtos
│   ├── p/                  # Miniaturas, usadas nos cartões do catálogo
│   └── recorte/            # Fotos sem fundo (.webp), usadas nos destaques
├── image/                  # Logotipos, favicon e imagem de compartilhamento
├── vendor/fontawesome/     # Ícones (servidos localmente)
├── planilha-google/
│   └── Codigo.gs           # Script para ligar o site ao Google Planilhas
├── docs/screenshots/       # Imagens deste README
├── LEIA-ME.txt             # Manual de uso para a fábrica
└── PLANILHA-GOOGLE.txt     # Passo a passo da integração com a planilha
```

---

## ⚙️ Como rodar

O projeto **não precisa de instalação nem de build**.

```bash
# 1. Clone o repositório
git clone https://github.com/devsilvana521/site-couro-forte-com-fotos.git
cd site-couro-forte-com-fotos

# 2. Suba um servidor local (qualquer uma das opções)
python -m http.server 5500
# ou
npx serve .
```

Depois abra **http://localhost:5500** no navegador.

> 💡 No **VS Code**, basta clicar com o botão direito em `index.html` e escolher **“Open with Live Server”** (o projeto já vem configurado para a porta `5501`).

---

## 🔧 Configuração

Os ajustes principais ficam no começo dos arquivos, todos comentados em português:

| O quê | Onde | Exemplo |
| --- | --- | --- |
| Número do WhatsApp da fábrica | `script.js` → `WHATSAPP` | `"553433150163"` (DDI + DDD + número) |
| Endereço do mapa | `script.js` → `ENDERECO_MAPA` | `"Rua ..., Uberaba - MG"` |
| Modelos por página | `script.js` → `POR_PAGINA` | `12` |
| Planilha do Google | `config.js` → `PLANILHA_URL` | `"https://script.google.com/macros/s/.../exec"` |

---

## 📊 Integração com Google Planilhas

O site funciona de dois jeitos:

| Modo | Como funciona |
| --- | --- |
| **Local** (padrão, `PLANILHA_URL = ""`) | Pedidos e representantes ficam salvos no navegador do computador da fábrica. Os pedidos feitos pelo celular dos clientes chegam pelo WhatsApp. |
| **Nuvem** (com planilha ligada) | **Todos os pedidos**, de qualquer celular ou computador, caem automaticamente em uma planilha do Google, e o painel pode ser aberto em qualquer lugar. |

Resumo da configuração (cerca de 10 minutos, gratuita):

1. Crie uma planilha em branco em [sheets.google.com](https://sheets.google.com).
2. Abra **Extensões → Apps Script** e cole o conteúdo de [`planilha-google/Codigo.gs`](./planilha-google/Codigo.gs).
3. Troque a constante `SENHA` por uma senha só sua.
4. Clique em **Implantar → Nova implantação → App da Web**.
5. Copie o link que termina em `/exec` e cole em `config.js`, na constante `PLANILHA_URL`.

O passo a passo completo está em [`PLANILHA-GOOGLE.txt`](./PLANILHA-GOOGLE.txt).

---

## 👢 Gerenciando o catálogo

Cada modelo é **uma linha** no arquivo [`produtos.js`](./produtos.js):

```js
{
  categoria: "adulto",          // "adulto", "feminina" ou "infantil"
  linha: "Agroboot",
  nome: "Botina",
  ref: "054",
  couro: "Nobuck",
  cor: "Bege",
  solado: "Agroboot",
  bico: "Redondo",
  numeracao: "35 ao 45",
  ziper: false,
  preco: "",                    // vazio = "Consulte o preço" | "199,90" = mostra o valor
  fotos: ["botina-ref-054-...-bege.jpg"]
}
```

**Para adicionar um modelo:**

1. Coloque a foto em `fotos/` e uma cópia menor em `fotos/p/`.
2. Copie uma linha em `produtos.js`, cole embaixo e troque os dados.
3. Pronto: o modelo aparece no catálogo, nos filtros e nos contadores automaticamente.

---

## 🚀 Publicação (deploy)

Como é um site estático, pode ser publicado de graça no **GitHub Pages**:

1. No repositório, acesse **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/ (root)` e clique em **Save**.
4. Em poucos minutos o site fica disponível em
   `https://devsilvana521.github.io/site-couro-forte-com-fotos/`.

Também funciona em Netlify, Vercel, Cloudflare Pages ou em qualquer hospedagem comum: basta enviar os arquivos.

---

## 🗺️ Roadmap

- [x] Catálogo com busca e filtros
- [x] Modo claro e modo escuro
- [x] Carrinho com grade de numeração
- [x] Painel com pedidos, pagamentos e comissões
- [x] Integração com Google Planilhas
- [x] Link de vendas por representante
- [ ] Tabela de preços de atacado para revendedores
- [ ] Galeria com várias fotos por modelo
- [ ] Domínio próprio

---

## 📞 Contato

<div align="center">

**Botinas Couro Forte** — Fábrica de calçados desde 1990

📍 R. Ranulfa Fonseca da Cunha, 332 · Manoel Mendes · Uberaba‑MG · CEP 38082‑151
📱 WhatsApp: [(34) 3315‑0163](https://wa.me/553433150163)
✉️ [vendas@courofortebotinas.com.br](mailto:vendas@courofortebotinas.com.br)
📷 Instagram: [@botinas.couroforte](https://www.instagram.com/botinas.couroforte/)
🕖 Segunda a sexta, das 7h30 às 17h30

<br>

Desenvolvido por **[@devsilvana521](https://github.com/devsilvana521)**

</div>

---

## 📄 Licença

© Botinas Couro Forte. Todos os direitos reservados.
O código‑fonte está disponível para consulta. Marca, logotipos e fotos dos produtos pertencem à Couro Forte e não podem ser reutilizados sem autorização.

<div align="center">
<br>
<sub>Feito com 🤎 em Uberaba‑MG</sub>
</div>
