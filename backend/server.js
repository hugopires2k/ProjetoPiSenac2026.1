const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const mysql   = require('mysql2/promise');

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

let db;

async function conectarBanco() {
  db = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'senac_pi',
    waitForConnections: true,
    connectionLimit:    10
  });
  console.log('Banco de dados conectado.');
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(pastaUploads));

async function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  try {
    const email = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ erro: 'Token inválido.' });
    req.usuario = rows[0];
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

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios.' });
  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND senha = ?', [email, senha]);
  if (rows.length === 0) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  const usuario = rows[0];
  const token = Buffer.from(usuario.email).toString('base64');
  res.json({ token, perfil: usuario.perfil, nome: usuario.nome, email: usuario.email });
});

app.get('/me', autenticar, (req, res) => {
  const { senha, ...dados } = req.usuario;
  res.json(dados);
});

app.post('/certificados', autenticar, exigirPerfil('aluno'), upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Arquivo obrigatório.' });
  const { nome, horas, categoria, descricao } = req.body;
  if (!nome || !horas || !categoria) return res.status(400).json({ erro: 'Nome, horas e categoria são obrigatórios.' });
  const horasNum = Number(horas);
  if (isNaN(horasNum) || horasNum <= 0) return res.status(400).json({ erro: 'Carga horária inválida.' });

  const [result] = await db.query(
    'INSERT INTO certificados (usuario_id, nome, categoria, horas, descricao, arquivo) VALUES (?, ?, ?, ?, ?, ?)',
    [req.usuario.id, nome, categoria, horasNum, descricao || '', req.file.filename]
  );
  res.status(201).json({ mensagem: 'Certificado enviado com sucesso!', id: result.insertId });
});

app.get('/certificados', autenticar, async (req, res) => {
  let rows;
  if (req.usuario.perfil === 'aluno') {
    [rows] = await db.query(`
      SELECT c.*, u.nome AS nomeAluno, u.email AS emailAluno,
             DATE_FORMAT(c.criado_em, '%d/%m/%Y') AS data
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.usuario_id = ?
      ORDER BY c.criado_em DESC
    `, [req.usuario.id]);
  } else {
    [rows] = await db.query(`
      SELECT c.*, u.nome AS nomeAluno, u.email AS emailAluno,
             DATE_FORMAT(c.criado_em, '%d/%m/%Y') AS data
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.criado_em DESC
    `);
  }
  res.json(rows);
});

app.get('/certificados/:id/arquivo', autenticar, async (req, res) => {
  const [rows] = await db.query(
    'SELECT c.*, u.email AS emailAluno FROM certificados c JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = ?',
    [Number(req.params.id)]
  );
  if (rows.length === 0) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  const cert = rows[0];
  if (req.usuario.perfil === 'aluno' && cert.emailAluno !== req.usuario.email) {
    return res.status(403).json({ erro: 'Acesso não autorizado.' });
  }
  const filePath = path.join(pastaUploads, cert.arquivo);
  if (!fs.existsSync(filePath)) return res.status(404).json({ erro: 'Arquivo não encontrado.' });
  res.sendFile(filePath);
});

app.patch('/certificados/:id/status', autenticar, exigirPerfil('coordenador', 'admin'), async (req, res) => {
  const { status, observacao } = req.body;
  if (!['aprovado', 'pendente', 'reprovado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  const [result] = await db.query(
    'UPDATE certificados SET status = ?, observacao = ? WHERE id = ?',
    [status, observacao || '', Number(req.params.id)]
  );
  if (result.affectedRows === 0) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  res.json({ mensagem: 'Status atualizado.' });
});

app.get('/stats', autenticar, exigirPerfil('admin', 'coordenador'), async (req, res) => {
  const [[stats]] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'aprovado')  AS aprovados,
      SUM(status = 'pendente')  AS pendentes,
      SUM(status = 'reprovado') AS reprovados,
      COALESCE(SUM(CASE WHEN status = 'aprovado' THEN horas ELSE 0 END), 0) AS totalHoras
    FROM certificados
  `);
  res.json(stats);
});

app.get('/usuarios', autenticar, exigirPerfil('admin'), async (req, res) => {
  const [rows] = await db.query('SELECT id, nome, email, perfil, criado_em FROM usuarios ORDER BY criado_em DESC');
  res.json(rows);
});

app.post('/usuarios', autenticar, exigirPerfil('admin'), async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: 'Nome, e-mail, senha e perfil são obrigatórios.' });
  }
  if (!['aluno', 'coordenador', 'admin'].includes(perfil)) {
    return res.status(400).json({ erro: 'Perfil inválido.' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, senha, perfil]
    );
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    throw err;
  }
});

app.delete('/usuarios/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const [[admin]] = await db.query("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'admin'");
  const [[alvo]]  = await db.query('SELECT perfil FROM usuarios WHERE id = ?', [id]);
  if (!alvo) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (alvo.perfil === 'admin' && admin.total <= 1) {
    return res.status(400).json({ erro: 'Não é possível excluir o único administrador.' });
  }
  await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
  res.json({ mensagem: 'Usuário removido.' });
});

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ erro: err.message });
  next();
});

conectarBanco().then(() => {
  app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
}).catch(err => {
  console.error('Erro ao conectar ao banco:', err.message);
  process.exit(1);
});
