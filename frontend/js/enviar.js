const API = 'http://localhost:3000';

// Proteção de rota
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('perfil');
  localStorage.removeItem('email');
  window.location.href = 'login.html';
}

function mostrarArquivo() {
  const arquivo = document.getElementById('arquivo-input').files[0];
  document.getElementById('arquivo-nome').textContent = arquivo
    ? '📄 ' + arquivo.name
    : '';
}

async function enviarCertificado() {
  const nome      = document.getElementById('nome').value.trim();
  const categoria = document.getElementById('categoria').value;
  const horas     = document.getElementById('horas').value;
  const descricao = document.getElementById('descricao').value.trim();
  const arquivo   = document.getElementById('arquivo-input').files[0];
  const msg       = document.getElementById('msg');
  const btn       = document.getElementById('btn-enviar');

  if (!nome || !categoria || !horas || !arquivo) {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Preencha todos os campos obrigatórios e anexe o arquivo.';
    return;
  }

  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('categoria', categoria);
  formData.append('horas', horas);
  formData.append('descricao', descricao);
  formData.append('arquivo', arquivo);

  btn.disabled = true;
  msg.style.color = '#7a7f99';
  msg.textContent = 'Enviando...';

  try {
    const resposta = await fetch(`${API}/certificados`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (resposta.status === 401) {
      sair();
      return;
    }

    const dados = await resposta.json();

    if (resposta.ok) {
      msg.style.color = '#4caf7d';
      msg.textContent = '✓ Certificado enviado com sucesso!';
      // Limpa o formulário
      document.getElementById('nome').value = '';
      document.getElementById('categoria').value = '';
      document.getElementById('horas').value = '';
      document.getElementById('descricao').value = '';
      document.getElementById('arquivo-input').value = '';
      document.getElementById('arquivo-nome').textContent = '';
    } else {
      msg.style.color = '#e05c5c';
      msg.textContent = dados.erro || 'Erro ao enviar certificado.';
    }
  } catch {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Não foi possível conectar ao servidor.';
  } finally {
    btn.disabled = false;
  }
}
