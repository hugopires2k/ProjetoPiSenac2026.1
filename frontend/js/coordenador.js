const API = 'https://senac-pi-backend.onrender.com';
const token = localStorage.getItem('token');
const perfil = localStorage.getItem('perfil');

if (!token || perfil !== 'coordenador') window.location.href = 'login.html';

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

  const acoesAtivas = cert.status === 'pendente'
    ? `<textarea id="obs-${cert.id}" placeholder="Observação (opcional)..." rows="2"></textarea>
       <button class="btn-status aprovar"  onclick="atualizarStatus(${cert.id}, 'aprovado')">✓ Aprovar</button>
       <button class="btn-status reprovar" onclick="atualizarStatus(${cert.id}, 'reprovado')">✗ Reprovar</button>`
    : '';

  item.innerHTML = `
    <div class="cert-info">
      <div class="cert-nome">${cert.nome}</div>
      <div class="cert-aluno">👤 ${cert.nomeAluno} · ${cert.emailAluno}</div>
      <div class="cert-detalhes">${cert.categoria} · ${cert.horas}h · ${cert.data}</div>
      ${cert.descricao ? `<div class="cert-desc">${cert.descricao}</div>` : ''}
      <span class="status ${cert.status}">${cert.status}</span>
      ${cert.observacao ? `<div class="cert-obs">💬 ${cert.observacao}</div>` : ''}
    </div>
    <div class="cert-acoes">
      <div class="cert-horas">${cert.horas}<span>horas</span></div>
      <button class="btn-ver-arquivo" onclick="verArquivo(${cert.id}, '${cert.nome.replace(/'/g, "\\'")}')">📄 Ver arquivo</button>
      ${acoesAtivas}
    </div>
  `;
  return item;
}

async function carregarCertificados() {
  const lista = document.getElementById('lista');
  try {
    const res = await fetch(`${API}/certificados`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.status === 401) { sair(); return; }
    const certs = await res.json();
    todosOsCerts = certs;

    document.getElementById('total-enviados').textContent   = certs.length;
    document.getElementById('total-pendentes').textContent  = certs.filter(c => c.status === 'pendente').length;
    document.getElementById('total-aprovados').textContent  = certs.filter(c => c.status === 'aprovado').length;
    document.getElementById('total-reprovados').textContent = certs.filter(c => c.status === 'reprovado').length;

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
  const obs = document.getElementById('obs-' + id)?.value || '';
  try {
    const res = await fetch(`${API}/certificados/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status, observacao: obs })
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

document.getElementById('nome-usuario').textContent = localStorage.getItem('nome') || 'Coordenador';
carregarCertificados();
