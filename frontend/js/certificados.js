const API = 'http://localhost:3000';

const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('perfil');
  localStorage.removeItem('email');
  window.location.href = 'login.html';
}

async function carregarCertificados() {
  const lista = document.getElementById('lista');

  try {
    const resposta = await fetch(`${API}/certificados`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (resposta.status === 401) {
      sair();
      return;
    }

    const certificados = await resposta.json();

    if (!resposta.ok) {
      lista.innerHTML = '<div class="vazio">Erro ao carregar certificados.</div>';
      return;
    }

    if (certificados.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhum certificado enviado ainda.</div>';
      return;
    }

    let totalHoras     = 0;
    let totalAprovados = 0;
    let totalPendentes = 0;

    lista.innerHTML = '';
    const perfil = localStorage.getItem('perfil');

    certificados.forEach(function(cert) {
      totalHoras += cert.horas;
      if (cert.status === 'aprovado') totalAprovados++;
      if (cert.status === 'pendente')  totalPendentes++;

      const item = document.createElement('div');
      item.className = 'certificado-item';

      const detalheExtra = (perfil === 'coordenador' || perfil === 'admin')
        ? `<div class="cert-aluno">${cert.emailAluno}</div>`
        : '';

      const acoes = (perfil === 'coordenador' || perfil === 'admin')
        ? `<div class="cert-acoes">
             <button class="btn-status aprovar"   onclick="atualizarStatus(${cert.id}, 'aprovado')">Aprovar</button>
             <button class="btn-status reprovar"  onclick="atualizarStatus(${cert.id}, 'reprovado')">Reprovar</button>
           </div>`
        : '';

      item.innerHTML = `
        <div class="cert-info">
          <div class="cert-nome">${cert.nome}</div>
          ${detalheExtra}
          <div class="cert-detalhes">${cert.categoria} · Enviado em ${cert.data}</div>
          <span class="status ${cert.status}">${cert.status}</span>
          ${acoes}
        </div>
        <div class="cert-horas">
          ${cert.horas}
          <span>horas</span>
        </div>
      `;
      lista.appendChild(item);
    });

    document.getElementById('total-horas').textContent     = totalHoras;
    document.getElementById('total-aprovados').textContent = totalAprovados;
    document.getElementById('total-pendentes').textContent = totalPendentes;

  } catch {
    lista.innerHTML = '<div class="vazio">Não foi possível conectar ao servidor.</div>';
  }
}

async function atualizarStatus(id, status) {
  try {
    const resposta = await fetch(`${API}/certificados/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status })
    });
    if (resposta.ok) carregarCertificados();
    else alert('Erro ao atualizar status.');
  } catch {
    alert('Não foi possível conectar ao servidor.');
  }
}

carregarCertificados();
