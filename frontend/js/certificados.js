const API = 'https://senac-pi-backend.onrender.com';
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const perfil = localStorage.getItem('perfil');
let todosOsCerts = [];

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

function fecharModal() {
  document.getElementById('modal-arquivo').classList.add('hidden');
  document.getElementById('modal-iframe').src = '';
}

function verArquivo(id, nome) {
  document.getElementById('modal-titulo').textContent = nome;
  fetch(`${API}/certificados/${id}/arquivo`, {
    headers: { 'Authorization': 'Bearer ' + token },
    redirect: 'follow'
  }).then(async res => {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    document.getElementById('modal-iframe').src = url;
    document.getElementById('modal-arquivo').classList.remove('hidden');
  }).catch(() => alert('Erro ao carregar arquivo.'));
}

function filtrar(status, btn) {
  document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  const lista = document.getElementById('lista');
  const certs = status === 'todos' ? todosOsCerts : todosOsCerts.filter(c => c.status === status);
  if (certs.length === 0) {
    lista.innerHTML = '<div class="vazio">Nenhum certificado nessa categoria.</div>';
    return;
  }
  lista.innerHTML = '';
  certs.forEach(cert => lista.appendChild(criarItem(cert)));
}

function criarItem(cert) {
  const item = document.createElement('div');
  item.className = 'certificado-item';

  const alunoLine = (perfil === 'coordenador' || perfil === 'admin')
    ? `<div class="cert-aluno">👤 ${cert.nomeAluno} · ${cert.emailAluno}</div>`
    : '';

  const acoesCoord = (perfil === 'coordenador' || perfil === 'admin') && cert.status === 'pendente'
    ? `<div class="cert-acoes-coord">
         <button class="btn-status aprovar"  onclick="atualizarStatus(${cert.id}, 'aprovado')">✓ Aprovar</button>
         <button class="btn-status reprovar" onclick="atualizarStatus(${cert.id}, 'reprovado')">✗ Reprovar</button>
       </div>`
    : '';

  const obsLine = cert.observacao
    ? `<div class="cert-obs">💬 ${cert.observacao}</div>`
    : '';

  const descLine = cert.descricao
    ? `<div class="cert-desc">${cert.descricao}</div>`
    : '';

  item.innerHTML = `
    <div class="cert-info">
      <div class="cert-nome">${cert.nome}</div>
      ${alunoLine}
      <div class="cert-detalhes">${cert.categoria} · ${cert.data}</div>
      ${descLine}
      <span class="status ${cert.status}">${cert.status}</span>
      ${obsLine}
      ${acoesCoord}
    </div>
    <div class="cert-right">
      <div class="cert-horas">${cert.horas}<span>horas</span></div>
      <button class="btn-ver-arquivo" onclick="verArquivo(${cert.id}, '${cert.nome.replace(/'/g, "\\'")}')">📄 Ver arquivo</button>
    </div>
  `;
  return item;
}

async function carregarCertificados() {
  const lista = document.getElementById('lista');
  try {
    const res = await fetch(`${API}/certificados`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) { sair(); return; }
    const certs = await res.json();
    todosOsCerts = certs;

    const aprovados  = certs.filter(c => c.status === 'aprovado');
    const pendentes  = certs.filter(c => c.status === 'pendente');
    const reprovados = certs.filter(c => c.status === 'reprovado');
    const totalHoras = aprovados.reduce((s, c) => s + c.horas, 0);

    document.getElementById('total-horas').textContent      = totalHoras;
    document.getElementById('total-aprovados').textContent  = aprovados.length;
    document.getElementById('total-pendentes').textContent  = pendentes.length;
    document.getElementById('total-reprovados').textContent = reprovados.length;

    if (certs.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhum certificado enviado ainda.</div>';
      return;
    }

    lista.innerHTML = '';
    certs.forEach(cert => lista.appendChild(criarItem(cert)));
  } catch {
    lista.innerHTML = '<div class="vazio">Não foi possível conectar ao servidor.</div>';
  }
}

async function atualizarStatus(id, status) {
  try {
    const res = await fetch(`${API}/certificados/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      toast(status === 'aprovado' ? '✓ Certificado aprovado' : '✗ Certificado reprovado',
            status === 'aprovado' ? 'verde' : 'vermelho');
      carregarCertificados();
    } else {
      toast('Erro ao atualizar status.', 'vermelho');
    }
  } catch {
    toast('Sem conexão com o servidor.', 'vermelho');
  }
}

const saudacaoEl = document.getElementById('saudacao');
if (saudacaoEl) {
  const nome = localStorage.getItem('nome') || '';
  const h = new Date().getHours();
  const periodo = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  saudacaoEl.textContent = `${periodo}, ${nome}`;
}

carregarCertificados();
