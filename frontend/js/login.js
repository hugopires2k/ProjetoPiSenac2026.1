const API = 'https://senac-pi-backend.onrender.com';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}


const PERFIL_INFO = {
  aluno:       { icon: '🎓', label: 'Aluno' },
  coordenador: { icon: '📋', label: 'Coordenador' },
  admin:       { icon: '⚙️', label: 'Administrador' }
};

if (localStorage.getItem('token')) {
  redirecionarPorPerfil(localStorage.getItem('perfil'));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !document.getElementById('step-login').classList.contains('hidden')) {
    fazerLogin();
  }
});

function redirecionarPorPerfil(perfil) {
  if (perfil === 'admin')            window.location.href = 'admin.html';
  else if (perfil === 'coordenador') window.location.href = 'coordenador.html';
  else                               window.location.href = 'certificados.html';
}

function selecionarPerfil(perfil) {
  const info = PERFIL_INFO[perfil];
  document.getElementById('perfil-ativo-label').textContent = info.icon + '  ' + info.label;
  document.getElementById('step-perfil').classList.add('hidden');
  document.getElementById('step-login').classList.remove('hidden');
  document.getElementById('email').focus();
}

function voltarPerfil() {
  document.getElementById('step-login').classList.add('hidden');
  document.getElementById('step-perfil').classList.remove('hidden');
  document.getElementById('msg').textContent = '';
  document.getElementById('email').value = '';
  document.getElementById('senha').value = '';
}

function toggleSenha() {
  const input = document.getElementById('senha');
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function fazerLogin() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const msg   = document.getElementById('msg');
  const btn   = document.getElementById('btn-login');

  if (!email || !senha) {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Preencha e-mail e senha.';
    return;
  }

  btn.disabled = true;
  msg.style.color = '#7a7f99';
  msg.textContent = 'Entrando...';

  try {
    const resposta = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('token',  dados.token);
      localStorage.setItem('perfil', dados.perfil);
      localStorage.setItem('nome',   dados.nome);
      localStorage.setItem('email',  dados.email);
      msg.style.color = '#4caf7d';
      msg.textContent = 'Login realizado! Redirecionando...';
      setTimeout(() => redirecionarPorPerfil(dados.perfil), 700);
    } else {
      msg.style.color = '#e05c5c';
      msg.textContent = dados.erro || 'E-mail ou senha inválidos.';
      btn.disabled = false;
    }
  } catch {
    msg.style.color = '#e05c5c';
    msg.textContent = 'Não foi possível conectar ao servidor.';
    btn.disabled = false;
  }
}
