const API = 'https://senac-pi-backend.onrender.com';
const token = localStorage.getItem('token');
const perfil = localStorage.getItem('perfil');

if (!token || perfil !== 'admin') window.location.href = 'login.html';

let listaUsuarios = [];

function sair() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function toast(msg, tipo = 'verde') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + tipo;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function renderTabela(lista) {
  const tbody = document.getElementById('tabela-usuarios');
  tbody.innerHTML = '';
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum usuário encontrado.</td></tr>';
    return;
  }
  lista.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td style="color:var(--muted);font-size:13px">${u.email}</td>
      <td><span class="badge ${u.perfil}">${u.perfil}</span></td>
      <td><button class="btn-excluir" onclick="excluirUsuario(${u.id}, '${u.nome.replace(/'/g, "\\'")}')">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function buscarUsuario() {
  const q = document.getElementById('busca-usuario').value.toLowerCase();
  renderTabela(listaUsuarios.filter(u =>
    u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  ));
}

async function carregarUsuarios() {
  try {
    const res   = await fetch(`${API}/usuarios`, { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { sair(); return; }
    const lista = await res.json();
    listaUsuarios = lista;

    document.getElementById('total-alunos').textContent       = lista.filter(u => u.perfil === 'aluno').length;
    document.getElementById('total-coordenadores').textContent = lista.filter(u => u.perfil === 'coordenador').length;
    document.getElementById('total-admins').textContent       = lista.filter(u => u.perfil === 'admin').length;

    renderTabela(lista);
  } catch {
    document.getElementById('tabela-usuarios').innerHTML =
      '<tr><td colspan="4" class="vazio">Erro ao carregar usuários.</td></tr>';
  }
}

async function carregarStats() {
  try {
    const res = await fetch(`${API}/stats`, { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) {
      const s = await res.json();
      document.getElementById('total-certs').textContent = s.total;
    }
  } catch {}
}

async function cadastrarUsuario() {
  const nome   = document.getElementById('c-nome').value.trim();
  const email  = document.getElementById('c-email').value.trim();
  const senha  = document.getElementById('c-senha').value;
  const perfil = document.getElementById('c-perfil').value;
  const msg    = document.getElementById('msg-cadastro');
  const btn    = document.getElementById('btn-cadastrar');

  if (!nome || !email || !senha || !perfil) {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Preencha todos os campos.';
    return;
  }

  btn.disabled = true;
  msg.style.color = '#7a7f99';
  msg.textContent = 'Cadastrando...';

  try {
    const res   = await fetch(`${API}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ nome, email, senha, perfil })
    });
    const dados = await res.json();
    if (res.ok) {
      msg.style.color = '#4caf7d';
      msg.textContent = '✓ Usuário cadastrado!';
      toast('✓ Usuário cadastrado com sucesso!', 'verde');
      document.getElementById('c-nome').value   = '';
      document.getElementById('c-email').value  = '';
      document.getElementById('c-senha').value  = '';
      document.getElementById('c-perfil').value = '';
      carregarUsuarios();
    } else {
      msg.style.color = '#e05c5c';
      msg.textContent = dados.erro || 'Erro ao cadastrar.';
    }
  } catch {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Não foi possível conectar ao servidor.';
  } finally {
    btn.disabled = false;
  }
}

async function excluirUsuario(id, nome) {
  if (!confirm(`Excluir o usuário "${nome}"?`)) return;
  try {
    const res   = await fetch(`${API}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    const dados = await res.json();
    if (res.ok) {
      toast('Usuário removido.', 'verde');
      carregarUsuarios();
    } else {
      toast(dados.erro || 'Erro ao excluir.', 'vermelho');
    }
  } catch {
    toast('Não foi possível conectar ao servidor.', 'vermelho');
  }
}

document.getElementById('nome-usuario').textContent = localStorage.getItem('nome') || 'Admin';
carregarUsuarios();
carregarStats();
