const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

const pastaUploads = path.join(__dirname, 'uploads');
if (!fs.existsSync(pastaUploads)) fs.mkdirSync(pastaUploads);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pastaUploads),
  filename:    (req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (permitidos.includes(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'));
  }
});

const usuarios = [
  { id: 1, nome: 'Admin',        email: 'admin@senac.br',        senha: 'admin123',  perfil: 'admin'       },
  { id: 2, nome: 'Coordenador',  email: 'coordenador@senac.br',  senha: 'coord123',  perfil: 'coordenador' },
  { id: 3, nome: 'Aluno Teste',  email: 'aluno@senac.br',        senha: 'senac123',  perfil: 'aluno'       }
];
const certificados = [];
let proximoIdUsuario = 4;
let proximoIdCert    = 1;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(pastaUploads));

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  try {
    const email   = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) return res.status(401).json({ erro: 'Token inválido.' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Acesso não autorizado.' });
    }
    next();
  };
}


app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios.' });
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);
  if (!usuario) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  const token = Buffer.from(usuario.email).toString('base64');
  res.json({ token, perfil: usuario.perfil, nome: usuario.nome, email: usuario.email });
});

app.get('/me', autenticar, (req, res) => {
  const { senha, ...dados } = req.usuario;
  res.json(dados);
});


app.post('/certificados', autenticar, exigirPerfil('aluno'), upload.single('arquivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Arquivo obrigatório.' });
  const { nome, horas, categoria, descricao } = req.body;
  if (!nome || !horas || !categoria) return res.status(400).json({ erro: 'Nome, horas e categoria são obrigatórios.' });
  const horasNum = Number(horas);
  if (isNaN(horasNum) || horasNum <= 0) return res.status(400).json({ erro: 'Carga horária inválida.' });

  const cert = {
    id:         proximoIdCert++,
    emailAluno: req.usuario.email,
    nomeAluno:  req.usuario.nome,
    nome,
    horas:      horasNum,
    categoria,
    descricao:  descricao || '',
    arquivo:    req.file.filename,
    status:     'pendente',
    data:       new Date().toLocaleDateString('pt-BR'),
    observacao: ''
  };
  certificados.push(cert);
  res.status(201).json({ mensagem: 'Certificado enviado com sucesso!', id: cert.id });
});

app.get('/certificados', autenticar, (req, res) => {
  if (req.usuario.perfil === 'aluno') {
    return res.json(certificados.filter(c => c.emailAluno === req.usuario.email));
  }
  res.json(certificados);
});

app.patch('/certificados/:id/status', autenticar, exigirPerfil('coordenador', 'admin'), (req, res) => {
  const cert = certificados.find(c => c.id === Number(req.params.id));
  if (!cert) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  const { status, observacao } = req.body;
  if (!['aprovado', 'pendente', 'reprovado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  cert.status     = status;
  cert.observacao = observacao || '';
  res.json({ mensagem: 'Status atualizado.', certificado: cert });
});


app.get('/usuarios', autenticar, exigirPerfil('admin'), (req, res) => {
  res.json(usuarios.map(({ senha, ...u }) => u));
});

app.post('/usuarios', autenticar, exigirPerfil('admin'), (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: 'Nome, e-mail, senha e perfil são obrigatórios.' });
  }
  if (!['aluno', 'coordenador', 'admin'].includes(perfil)) {
    return res.status(400).json({ erro: 'Perfil inválido.' });
  }
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }
  const novo = { id: proximoIdUsuario++, nome, email, senha, perfil };
  usuarios.push(novo);
  res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: novo.id });
});

app.delete('/usuarios/:id', autenticar, exigirPerfil('admin'), (req, res) => {
  const id  = Number(req.params.id);
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (usuarios[idx].perfil === 'admin' && usuarios.filter(u => u.perfil === 'admin').length === 1) {
    return res.status(400).json({ erro: 'Não é possível excluir o único administrador.' });
  }
  usuarios.splice(idx, 1);
  res.json({ mensagem: 'Usuário removido.' });
});

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ erro: err.message });
  next();
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
