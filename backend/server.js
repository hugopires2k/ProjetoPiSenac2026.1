const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

require('dotenv').config();

const app   = express();
const PORT  = process.env.PORT || 3000;
const TOKEN_SECRETO = process.env.TOKEN_SECRETO || 'token-dev-123';

// ── Garantir que a pasta de uploads existe ─────────────────────────────────
const pastaUploads = path.join(__dirname, 'uploads');
if (!fs.existsSync(pastaUploads)) fs.mkdirSync(pastaUploads);

// ── Multer: salvar com extensão original ──────────────────────────────────
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const permitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (permitidos.includes(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'));
  }
});

// ── Dados em memória (suficiente para PI) ─────────────────────────────────
const usuarios = [
  { email: 'aluno@senac.br',       senha: 'senac123', perfil: 'aluno'       },
  { email: 'coordenador@senac.br', senha: 'coord123', perfil: 'coordenador' },
  { email: 'admin@senac.br',       senha: 'admin123', perfil: 'admin'       }
];
const certificados = [];

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(pastaUploads));

// ── Middleware de autenticação ─────────────────────────────────────────────
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  // Token carrega o email codificado em base64 para o PI
  try {
    const email = Buffer.from(token, 'base64').toString('utf8');
    const usuario = usuarios.find(u => u.email === email);
    if (!usuario) return res.status(401).json({ erro: 'Token inválido.' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

function apenasAdmin(req, res, next) {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  }
  next();
}

function coordenadorOuAdmin(req, res, next) {
  if (!['coordenador', 'admin'].includes(req.usuario.perfil)) {
    return res.status(403).json({ erro: 'Acesso restrito.' });
  }
  next();
}

// ── Rotas ─────────────────────────────────────────────────────────────────

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);
  if (!usuario) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
  // Token simples: email em base64 (suficiente para PI sem banco de dados)
  const token = Buffer.from(usuario.email).toString('base64');
  res.json({ token, perfil: usuario.perfil, email: usuario.email });
});

// Enviar certificado (aluno autenticado)
app.post('/certificados', autenticar, upload.single('arquivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Arquivo obrigatório.' });
  }
  const { nome, horas, categoria, descricao } = req.body;
  if (!nome || !horas || !categoria) {
    return res.status(400).json({ erro: 'Nome, horas e categoria são obrigatórios.' });
  }
  const horasNum = Number(horas);
  if (isNaN(horasNum) || horasNum <= 0) {
    return res.status(400).json({ erro: 'Carga horária inválida.' });
  }
  const certificado = {
    id:        certificados.length + 1,
    emailAluno: req.usuario.email,
    nome,
    horas:     horasNum,
    categoria,
    descricao: descricao || '',
    arquivo:   req.file.filename,
    status:    'pendente',
    data:      new Date().toLocaleDateString('pt-BR')
  };
  certificados.push(certificado);
  res.status(201).json({ mensagem: 'Certificado enviado com sucesso!', id: certificado.id });
});

// Listar certificados
// Aluno vê só os seus; coordenador/admin vê todos
app.get('/certificados', autenticar, (req, res) => {
  if (['coordenador', 'admin'].includes(req.usuario.perfil)) {
    return res.json(certificados);
  }
  const meus = certificados.filter(c => c.emailAluno === req.usuario.email);
  res.json(meus);
});

// Atualizar status (coordenador ou admin)
app.patch('/certificados/:id/status', autenticar, coordenadorOuAdmin, (req, res) => {
  const id   = Number(req.params.id);
  const cert = certificados.find(c => c.id === id);
  if (!cert) return res.status(404).json({ erro: 'Certificado não encontrado.' });

  const { status } = req.body;
  if (!['aprovado', 'pendente', 'reprovado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  cert.status = status;
  res.json({ mensagem: 'Status atualizado.', certificado: cert });
});

// Listar usuários (apenas admin)
app.get('/usuarios', autenticar, apenasAdmin, (req, res) => {
  const lista = usuarios.map(({ email, perfil }) => ({ email, perfil }));
  res.json(lista);
});

// Cadastrar usuário (apenas admin)
app.post('/usuarios', autenticar, apenasAdmin, (req, res) => {
  const { email, senha, perfil } = req.body;
  if (!email || !senha || !perfil) {
    return res.status(400).json({ erro: 'E-mail, senha e perfil são obrigatórios.' });
  }
  if (!['aluno', 'coordenador', 'admin'].includes(perfil)) {
    return res.status(400).json({ erro: 'Perfil inválido. Use: aluno, coordenador ou admin.' });
  }
  if (usuarios.find(u => u.email === email)) {
    return res.status(409).json({ erro: 'E-mail já cadastrado.' });
  }
  usuarios.push({ email, senha, perfil });
  res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso.' });
});

// ── Tratamento de erros do Multer ──────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ erro: err.message });
  }
  next(err);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
