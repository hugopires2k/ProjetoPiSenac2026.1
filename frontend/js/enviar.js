const API = 'https://senac-pi-backend.onrender.com';
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

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

function mostrarArquivo() {
  const arquivo = document.getElementById('arquivo-input').files[0];
  document.getElementById('arquivo-nome').textContent = arquivo ? '📎 ' + arquivo.name : '';
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.add('drag');
}

function dragLeave() {
  document.getElementById('upload-area').classList.remove('drag');
}

function drop(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const permitidos = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!permitidos.includes(file.type)) {
    toast('Arquivo inválido. Use PDF, JPG ou PNG.', 'vermelho');
    return;
  }
  const input = document.getElementById('arquivo-input');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  mostrarArquivo();
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
    const res = await fetch(`${API}/certificados`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (res.status === 401) { sair(); return; }

    const dados = await res.json();

    if (res.ok) {
      msg.style.color = '#4caf7d';
      msg.textContent = '✓ Certificado enviado com sucesso!';
      toast('✓ Certificado enviado!', 'verde');
      document.getElementById('nome').value      = '';
      document.getElementById('categoria').value = '';
      document.getElementById('horas').value     = '';
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
