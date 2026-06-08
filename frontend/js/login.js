const API = 'http://localhost:3000';

// Redireciona se já estiver logado
if (localStorage.getItem('token')) {
  window.location.href = 'certificados.html';
}

// Permitir envio com a tecla Enter
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') fazerLogin();
});

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
      localStorage.setItem('token', dados.token);
      localStorage.setItem('perfil', dados.perfil);
      localStorage.setItem('email', dados.email);
      msg.style.color = '#4caf7d';
      msg.textContent = 'Login realizado! Redirecionando...';
      setTimeout(() => window.location.href = 'certificados.html', 800);
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
