/* ============================================================
   BIBLIOTECA – app.js
   Dados em localStorage (troque pelas chamadas ao banco de dados)
   ============================================================ */

"use strict";

// ============================================================
// BANCO DE DADOS LOCAL (substitua pelas chamadas reais ao BD)
// ============================================================
const DB = {
  get usuarios()  { return JSON.parse(localStorage.getItem("bib_usuarios")  || "[]"); },
  set usuarios(v) { localStorage.setItem("bib_usuarios",  JSON.stringify(v)); },

  get livros()    { return JSON.parse(localStorage.getItem("bib_livros")    || "[]"); },
  set livros(v)   { localStorage.setItem("bib_livros",    JSON.stringify(v)); },

  get alugueis()  { return JSON.parse(localStorage.getItem("bib_alugueis") || "[]"); },
  set alugueis(v) { localStorage.setItem("bib_alugueis", JSON.stringify(v)); },

  get editoras()  { return JSON.parse(localStorage.getItem("bib_editoras") || "[]"); },
  set editoras(v) { localStorage.setItem("bib_editoras", JSON.stringify(v)); },
};

// ============================================================
// ESTADO GLOBAL
// ============================================================
let usuarioLogado   = null;   // objeto do usuário atual
let usuarioAtual    = null;   // usuário sendo visualizado
let livroAtual      = null;   // livro sendo visualizado
let editoraAtual    = null;   // editora sendo visualizada
let pilhaTelas      = [];     // histórico de navegação
let aluguelSelecionado = null;// aluguel para marcar devolvido

// ============================================================
// NAVEGAÇÃO
// ============================================================
function irPara(id) {
  const atual = document.querySelector(".tela.ativa");
  if (atual) {
    pilhaTelas.push(atual.id);
    atual.classList.remove("ativa");
  }
  const proxima = document.getElementById(id);
  proxima.classList.add("ativa");
  onEntrarTela(id);
}

function voltarTela() {
  const atual = document.querySelector(".tela.ativa");
  if (atual) atual.classList.remove("ativa");

  const anterior = pilhaTelas.pop() || "tela-login";
  const tela = document.getElementById(anterior);
  tela.classList.add("ativa");
  onEntrarTela(anterior);
}

function onEntrarTela(id) {
  switch (id) {
    case "tela-geral-usuarios":   renderListaUsuarios(); break;
    case "tela-geral-livros":     renderListaLivros();   break;
    case "tela-alugueis":         renderListaAlugueis(); break;
    case "tela-historico":        renderHistorico();     break;
    case "tela-editoras":         renderListaEditoras(); break;
    case "tela-livros-editora":   renderLivrosEditora(); break;
  }
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function fazerLogin() {
  const nome  = val("login-nome").trim();
  const senha = val("login-senha").trim();

  if (!nome || !senha) { alerta("Preencha nome e senha."); return; }

  const u = DB.usuarios.find(u => u.nome.toLowerCase() === nome.toLowerCase() && u.matricula === senha);
  if (!u) { alerta("Usuário ou senha incorretos."); return; }

  usuarioLogado = u;
  set("topbar-usuario", "Olá, " + u.nome.split(" ")[0]);
  set("nome-boas-vindas", u.nome.split(" ")[0]);

  // Mostrar botão excluir apenas para bibliotecário
  const ehBib = u.funcao === "bibliotecario";
  document.getElementById("btn-excluir-usuario").style.display = ehBib ? "inline-block" : "none";
  document.getElementById("btn-excluir-livro")  .style.display = ehBib ? "inline-block" : "none";

  pilhaTelas = [];
  irPara("tela-inicial");
}

function sair() {
  usuarioLogado = null;
  pilhaTelas = [];
  const atual = document.querySelector(".tela.ativa");
  if (atual) atual.classList.remove("ativa");
  document.getElementById("tela-login").classList.add("ativa");
  set("login-nome", "");
  set("login-senha", "");
}

function abrirEsqueceuSenha() {
  alerta("Para redefinir sua senha, entre em contato com a bibliotecária.");
}

// ============================================================
// USUÁRIOS – CRUD
// ============================================================
function salvarUsuario() {
  const nome = val("cad-nome").trim();
  if (!nome) { alerta("Informe o nome completo."); return; }

  const foto = document.getElementById("preview-foto-cadastro").src || "";

  const novo = {
    id:           Date.now(),
    nome,
    matricula:    val("cad-matricula").trim(),
    cpf:          val("cad-cpf").trim(),
    endereco:     val("cad-endereco").trim(),
    email:        val("cad-email").trim(),
    telefone:     val("cad-telefone").trim(),
    serie:        val("cad-serie").trim(),
    curso:        val("cad-curso").trim(),
    funcao:       document.getElementById("cad-funcao").value,
    monitor:      val("cad-monitor").trim(),
    bibliotecario:val("cad-bibliotecario").trim(),
    foto
  };

  // Senha = matrícula (já definida no objeto)
  const lista = DB.usuarios;
  lista.push(novo);
  DB.usuarios = lista;

  // Limpar campos
  ["cad-nome","cad-matricula","cad-cpf","cad-endereco","cad-email",
   "cad-telefone","cad-serie","cad-curso","cad-monitor","cad-bibliotecario"].forEach(id => set(id,""));
  document.getElementById("cad-funcao").value = "";

  alerta("Usuário cadastrado com sucesso!", () => irPara("tela-inicial"));
}

function renderListaUsuarios(filtro="") {
  const lista = DB.usuarios.filter(u =>
    u.nome.toLowerCase().includes(filtro.toLowerCase())
  );
  const cont = document.getElementById("lista-usuarios");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhum usuário encontrado.</p>"
    : lista.map(u => `
        <div class="card-item" onclick="verPerfil(${u.id})">
          <h3>${u.nome}</h3>
          <p>Matrícula: ${u.matricula || "—"} | Função: ${u.funcao || "—"}</p>
          <p>Série: ${u.serie || "—"} | Curso: ${u.curso || "—"}</p>
        </div>`).join("");
}

function filtrarUsuarios() {
  renderListaUsuarios(val("busca-usuario"));
}

function verPerfil(id) {
  const u = DB.usuarios.find(u => u.id === id);
  if (!u) return;
  usuarioAtual = u;

  set("p-nome",      u.nome);
  set("p-matricula", u.matricula);
  set("p-cpf",       u.cpf);
  set("p-endereco",  u.endereco);
  set("p-email",     u.email);
  set("p-telefone",  u.telefone);
  set("p-serie",     u.serie);
  set("p-curso",     u.curso);
  set("p-funcao",    u.funcao);

  const foto    = document.getElementById("perfil-foto");
  const ph      = document.getElementById("perfil-foto-placeholder");
  if (u.foto && u.foto.startsWith("data:")) {
    foto.src = u.foto;
    foto.style.display = "block";
    ph.style.display = "none";
  } else {
    foto.style.display = "none";
    ph.style.display = "flex";
  }

  // Excluir visível apenas para bibliotecário
  const ehBib = usuarioLogado && usuarioLogado.funcao === "bibliotecario";
  document.getElementById("btn-excluir-usuario").style.display = ehBib ? "inline-block" : "none";

  irPara("tela-perfil-usuario");
}

function excluirUsuarioAtual() {
  if (!usuarioAtual) return;
  confirmar(`Excluir o usuário "${usuarioAtual.nome}"?`, () => {
    DB.usuarios = DB.usuarios.filter(u => u.id !== usuarioAtual.id);
    usuarioAtual = null;
    voltarTela();
  });
}

function verHistoricoUsuario() {
  irPara("tela-historico");
}

// ============================================================
// LIVROS – CRUD
// ============================================================
function salvarLivro() {
  const nome = val("liv-nome").trim();
  if (!nome) { alerta("Informe o nome do livro."); return; }

  const novo = {
    id:        Date.now(),
    nome,
    autor:     val("liv-autor").trim(),
    editora:   val("liv-editora").trim(),
    codigo:    val("liv-codigo").trim(),
    codEditora:val("liv-cod-edit").trim(),
    isbn:      val("liv-isbn").trim(),
    categoria: val("liv-categoria").trim(),
  };

  const lista = DB.livros;
  lista.push(novo);
  DB.livros = lista;

  // Adicionar editora se não existe
  adicionarEditoraSeNova(novo.editora, novo.codEditora);

  ["liv-nome","liv-autor","liv-editora","liv-codigo","liv-cod-edit","liv-isbn","liv-categoria"]
    .forEach(id => set(id,""));

  alerta("Livro cadastrado!", () => irPara("tela-geral-livros"));
}

function adicionarEditoraSeNova(nome, codigo) {
  if (!nome) return;
  const lista = DB.editoras;
  if (!lista.find(e => e.nome.toLowerCase() === nome.toLowerCase())) {
    lista.push({ id: Date.now(), nome, codigo });
    DB.editoras = lista;
  }
}

function renderListaLivros(filtro="") {
  const lista = DB.livros.filter(l =>
    l.nome.toLowerCase().includes(filtro.toLowerCase())
  );
  const cont = document.getElementById("lista-livros");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhum livro encontrado.</p>"
    : lista.map(l => `
        <div class="card-item" onclick="verDadosLivro(${l.id})">
          <h3>${l.nome}</h3>
          <p>Autor: ${l.autor || "—"} | Editora: ${l.editora || "—"}</p>
          <p>Categoria: ${l.categoria || "—"} | ISBN: ${l.isbn || "—"}</p>
        </div>`).join("");
}

function filtrarLivros() {
  const filtro = val("busca-livro").trim();
  renderListaLivros(filtro);
  const sugs  = document.getElementById("sugestoes-livros");
  if (filtro.length < 2) { sugs.style.display = "none"; return; }
  const hits = DB.livros.filter(l => l.nome.toLowerCase().includes(filtro.toLowerCase())).slice(0,6);
  if (!hits.length) { sugs.style.display = "none"; return; }
  sugs.style.display = "block";
  sugs.innerHTML = hits.map(l =>
    `<div class="sugestao-item" onclick="verDadosLivro(${l.id})">${l.nome}</div>`
  ).join("");
}

function verDadosLivro(id) {
  const l = DB.livros.find(l => l.id === id);
  if (!l) return;
  livroAtual = l;

  set("l-nome",       l.nome);
  set("l-autor",      l.autor);
  set("l-editora",    l.editora);
  set("l-codigo",     l.codigo);
  set("l-cod-editora",l.codEditora);
  set("l-isbn",       l.isbn);
  set("l-categoria",  l.categoria);

  document.querySelector("#tela-dados-livro .livro-titulo").textContent = l.nome;

  const ehBib = usuarioLogado && usuarioLogado.funcao === "bibliotecario";
  document.getElementById("btn-excluir-livro").style.display = ehBib ? "inline-block" : "none";

  document.getElementById("sugestoes-livros").style.display = "none";
  irPara("tela-dados-livro");
}

function excluirLivroAtual() {
  if (!livroAtual) return;
  confirmar(`Excluir o livro "${livroAtual.nome}"?`, () => {
    DB.livros = DB.livros.filter(l => l.id !== livroAtual.id);
    livroAtual = null;
    voltarTela();
  });
}

function alugarLivroAtual() {
  if (!livroAtual) return;
  set("alug-livro", livroAtual.nome);
  irPara("tela-cadastro-aluguel");
}

// ============================================================
// ALUGUÉIS – CRUD
// ============================================================
function salvarAluguel() {
  const livro = val("alug-livro").trim();
  const aluno = val("alug-aluno").trim();
  if (!livro || !aluno) { alerta("Preencha o livro e o aluno."); return; }

  const novo = {
    id:        Date.now(),
    livro,
    aluno,
    data:      val("alug-data"),
    codigo:    val("alug-codigo").trim(),
    devolucao: val("alug-devolucao").trim(),
    devolvido: false,
  };

  const lista = DB.alugueis;
  lista.push(novo);
  DB.alugueis = lista;

  ["alug-livro","alug-aluno","alug-data","alug-codigo","alug-devolucao"].forEach(id => set(id,""));

  alerta("Aluguel registrado!", () => irPara("tela-alugueis"));
}

function renderListaAlugueis(filtro="") {
  const lista = DB.alugueis.filter(a =>
    a.livro.toLowerCase().includes(filtro.toLowerCase())
  );
  const cont = document.getElementById("lista-alugueis");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhum aluguel registrado.</p>"
    : lista.map(a => `
        <div class="card-item" onclick="selecionarAluguel(${a.id})">
          <h3>${a.livro}</h3>
          <p>Aluno: ${a.aluno} | Data: ${a.data || "—"}</p>
          <p>Devolução: ${a.devolucao || "—"}</p>
          <span class="badge ${a.devolvido ? "badge-devolvido":"badge-pendente"}">
            ${a.devolvido ? "Devolvido" : "Pendente"}
          </span>
        </div>`).join("");
}

function filtrarAlugueis() {
  renderListaAlugueis(val("busca-aluguel"));
}

function selecionarAluguel(id) {
  aluguelSelecionado = id;
  alerta("Aluguel selecionado. Use o botão 'Devolvido' para marcar.");
}

// ============================================================
// HISTÓRICO
// ============================================================
function renderHistorico(filtro="") {
  // Mostrar todos os aluguéis (se houver usuário atual, filtrar por ele)
  let lista = DB.alugueis;
  if (usuarioAtual) lista = lista.filter(a => a.aluno.toLowerCase() === usuarioAtual.nome.toLowerCase());
  if (filtro) lista = lista.filter(a => a.livro.toLowerCase().includes(filtro.toLowerCase()));

  const cont = document.getElementById("lista-historico");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhum aluguel encontrado.</p>"
    : lista.map(a => `
        <div class="card-item" onclick="selecionarAluguelHist(${a.id})">
          <h3>${a.livro}</h3>
          <p>Aluno: ${a.aluno} | Data: ${a.data || "—"}</p>
          <span class="badge ${a.devolvido ? "badge-devolvido":"badge-pendente"}">
            ${a.devolvido ? "Devolvido" : "Pendente"}
          </span>
        </div>`).join("");
}

function filtrarHistorico() {
  renderHistorico(val("busca-historico"));
}

function selecionarAluguelHist(id) {
  aluguelSelecionado = id;
}

function marcarDevolvido() {
  if (!aluguelSelecionado) {
    alerta("Selecione um aluguel na lista primeiro.");
    return;
  }
  confirmar("Marcar este aluguel como devolvido?", () => {
    const lista = DB.alugueis;
    const idx   = lista.findIndex(a => a.id === aluguelSelecionado);
    if (idx !== -1) {
      lista[idx].devolvido = true;
      DB.alugueis = lista;
      aluguelSelecionado = null;
      renderHistorico(val("busca-historico"));
    }
  });
}

// ============================================================
// EDITORAS
// ============================================================
function abrirCadEditora() {
  const nome   = prompt("Nome da editora:");
  if (!nome) return;
  const codigo = prompt("Código da editora:") || "";
  const lista  = DB.editoras;
  lista.push({ id: Date.now(), nome: nome.trim(), codigo: codigo.trim() });
  DB.editoras = lista;
  renderListaEditoras();
}

function renderListaEditoras(filtro="") {
  const lista = DB.editoras.filter(e =>
    e.nome.toLowerCase().includes(filtro.toLowerCase())
  );
  const cont = document.getElementById("lista-editoras");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhuma editora encontrada.</p>"
    : lista.map(e => {
        const qtd = DB.livros.filter(l => l.editora.toLowerCase() === e.nome.toLowerCase()).length;
        return `
          <div class="card-item" onclick="verLivrosEditora(${e.id})">
            <h3>${e.nome}</h3>
            <p>Código: ${e.codigo || "—"} | Livros cadastrados: ${qtd}</p>
          </div>`;
      }).join("");
}

function filtrarEditoras() {
  renderListaEditoras(val("busca-editora"));
}

function verLivrosEditora(id) {
  const e = DB.editoras.find(e => e.id === id);
  if (!e) return;
  editoraAtual = e;
  document.getElementById("titulo-editora-selecionada").textContent = "Livros – " + e.nome;
  irPara("tela-livros-editora");
}

function renderLivrosEditora() {
  if (!editoraAtual) return;
  const lista = DB.livros.filter(l =>
    l.editora.toLowerCase() === editoraAtual.nome.toLowerCase()
  );
  const cont = document.getElementById("lista-livros-editora");
  cont.innerHTML = lista.length === 0
    ? "<p style='color:var(--bege);opacity:.6;text-align:center;margin-top:30px'>Nenhum livro desta editora.</p>"
    : lista.map(l => `
        <div class="card-item" onclick="verDadosLivro(${l.id})">
          <h3>${l.nome}</h3>
          <p>Autor: ${l.autor || "—"} | ISBN: ${l.isbn || "—"}</p>
          <p>Categoria: ${l.categoria || "—"}</p>
        </div>`).join("");
}

// ============================================================
// FOTO PREVIEW
// ============================================================
function previewFoto(inputId, imgId, placeholderId) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById(imgId);
    const ph  = document.getElementById(placeholderId);
    img.src = e.target.result;
    img.style.display = "block";
    ph.style.display  = "none";
  };
  reader.readAsDataURL(file);
}

// ============================================================
// MODAL – ALERTAS E CONFIRMAÇÕES
// ============================================================
let modalCallback = null;

function alerta(msg, callback) {
  document.getElementById("modal-msg").textContent = msg;
  document.getElementById("modal-input-area").innerHTML = "";
  document.getElementById("modal-btn-cancelar").style.display = "none";
  modalCallback = callback || null;
  document.getElementById("modal-overlay").classList.add("aberto");

  document.getElementById("modal-btn-ok").onclick = () => {
    fecharModal();
    if (modalCallback) modalCallback();
  };
}

function confirmar(msg, callback) {
  document.getElementById("modal-msg").textContent = msg;
  document.getElementById("modal-input-area").innerHTML = "";
  document.getElementById("modal-btn-cancelar").style.display = "inline-block";
  modalCallback = callback;
  document.getElementById("modal-overlay").classList.add("aberto");

  document.getElementById("modal-btn-ok").textContent = "Confirmar";
  document.getElementById("modal-btn-ok").onclick = () => {
    fecharModal();
    if (modalCallback) modalCallback();
  };
  document.getElementById("modal-btn-cancelar").onclick = fecharModal;
}

function fecharModal() {
  document.getElementById("modal-overlay").classList.remove("aberto");
  document.getElementById("modal-btn-ok").textContent = "OK";
  modalCallback = null;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function val(id)      { const el=document.getElementById(id); return el ? el.value : ""; }
function set(id, txt) { const el=document.getElementById(id); if(el) el.value !== undefined && el.tagName !== "SPAN" && el.tagName !== "P" ? el.value = txt : el.textContent = txt; }

// Ajuste: set() para spans/p usa textContent
function set(id, txt) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
    el.value = txt;
  } else {
    el.textContent = txt;
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  // Dados de demonstração (remova quando conectar ao banco real)
  if (DB.usuarios.length === 0) {
    DB.usuarios = [
      { id: 1, nome: "Ana Lima", matricula: "12345", cpf: "000.000.001-00",
        endereco: "Rua A, 10", email: "ana@escola.com", telefone: "88 99999-0001",
        serie: "3° Ano", curso: "Informática", funcao: "bibliotecario",
        monitor: "", bibliotecario: "Ana Lima", foto: "" }
    ];
  }
  if (DB.livros.length === 0) {
    DB.livros = [
      { id: 1, nome: "Dom Casmurro", autor: "Machado de Assis", editora: "Saraiva",
        codigo: "L001", codEditora: "E001", isbn: "978-85-02-01234-5", categoria: "Romance" },
      { id: 2, nome: "O Alquimista", autor: "Paulo Coelho", editora: "HarperCollins",
        codigo: "L002", codEditora: "E002", isbn: "978-85-02-56789-0", categoria: "Ficção" }
    ];
    adicionarEditoraSeNova("Saraiva","E001");
    adicionarEditoraSeNova("HarperCollins","E002");
  }
});
