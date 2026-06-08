const API = 'http://localhost:3000';
const token = localStorage.getItem('token');
const perfil = localStorage.getItem('perfil');

if (!token || perfil !== 'coordenador') window.location.href = 'login.html';

function sair() {
  localStorage.clear();
  window.location.href = 'login.html';
}

async function carregarCertificados() {
  const lista = document.getElementById('lista');
  try {
    const res  = await fetch(`${API}/certificados`, { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 401) { sair(); return; }
    const certs = await res.json();

    document.getElementById('total-enviados').textContent  = certs.length;
    document.getElementById('total-pendentes').textContent = certs.filter(c => c.status === 'pendente').length;
    document.getElementById('total-aprovados').textContent = certs.filter(c => c.status === 'aprovado').length;
    document.getElementById('total-reprovados').textContent = certs.filter(c => c.status === 'reprovado').length;

    if (certs.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhum certificado enviado ainda.</div>';
      return;
    }

    lista.innerHTML = '';
    certs.forEach(cert => {
      const item = document.createElement('div');
      item.className = 'certificado-item';
      item.innerHTML = `
        <div class="cert-info">
          <div class="cert-nome">${cert.nome}</div>
          <div class="cert-aluno">👤 ${cert.nomeAluno} · ${cert.emailAluno}</div>
          <div class="cert-detalhes">${cert.categoria} · ${cert.horas}h · Enviado em ${cert.data}</div>
          ${cert.descricao ? `<div class="cert-desc">${cert.descricao}</div>` : ''}
          <span class="status ${cert.status}">${cert.status}</span>
          ${cert.observacao ? `<div class="cert-obs">💬 ${cert.observacao}</div>` : ''}
        </div>
        <div class="cert-acoes">
          <div class="cert-horas">${cert.horas}<span>horas</span></div>
          <textarea id="obs-${cert.id}" placeholder="Observação (opcional)..." rows="2"></textarea>
          <button class="btn-status aprovar"  onclick="atualizarStatus(${cert.id}, 'aprovado')">✓ Aprovar</button>
          <button class="btn-status reprovar" onclick="atualizarStatus(${cert.id}, 'reprovado')">✗ Reprovar</button>
        </div>
      `;
      lista.appendChild(item);
    });
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
    if (res.ok) carregarCertificados();
    else alert('Erro ao atualizar status.');
  } catch {
    alert('Não foi possível conectar ao servidor.');
  }
}

document.getElementById('nome-usuario').textContent = localStorage.getItem('nome') || 'Coordenador';
carregarCertificados();
