const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (permitidos.includes(ext)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'));
  }
});

function uploadParaCloudinary(buffer, originalname) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalname).toLowerCase();
    const resourceType = ext === '.pdf' ? 'raw' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'senac-pi' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function conectarBanco() {
  await db.query('SELECT 1');
  console.log('Banco de dados conectado.');
}

app.use(cors());
app.use(express.json());

async function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }
  try {
    const email = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8');
    const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
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
  const { rows } = await db.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2', [email, senha]);
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

  try {
    const resultado = await uploadParaCloudinary(req.file.buffer, req.file.originalname);
    const arquivoUrl = resultado.secure_url;

    const { rows } = await db.query(
      'INSERT INTO certificados (usuario_id, nome, categoria, horas, descricao, arquivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [req.usuario.id, nome, categoria, horasNum, descricao || '', arquivoUrl]
    );
    res.status(201).json({ mensagem: 'Certificado enviado com sucesso!', id: rows[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer upload do arquivo.' });
  }
});

app.get('/certificados', autenticar, async (req, res) => {
  let result;
  if (req.usuario.perfil === 'aluno') {
    result = await db.query(`
      SELECT c.*, u.nome AS "nomeAluno", u.email AS "emailAluno",
             TO_CHAR(c.criado_em, 'DD/MM/YYYY') AS data
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.usuario_id = $1
      ORDER BY c.criado_em DESC
    `, [req.usuario.id]);
  } else {
    result = await db.query(`
      SELECT c.*, u.nome AS "nomeAluno", u.email AS "emailAluno",
             TO_CHAR(c.criado_em, 'DD/MM/YYYY') AS data
      FROM certificados c
      JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.criado_em DESC
    `);
  }
  res.json(result.rows);
});

app.get('/certificados/:id/arquivo', autenticar, async (req, res) => {
  const { rows } = await db.query(
    'SELECT c.*, u.email AS "emailAluno" FROM certificados c JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = $1',
    [Number(req.params.id)]
  );
  if (rows.length === 0) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  const cert = rows[0];
  if (req.usuario.perfil === 'aluno' && cert.emailAluno !== req.usuario.email) {
    return res.status(403).json({ erro: 'Acesso não autorizado.' });
  }
  res.redirect(cert.arquivo);
});

app.patch('/certificados/:id/status', autenticar, exigirPerfil('coordenador', 'admin'), async (req, res) => {
  const { status, observacao } = req.body;
  if (!['aprovado', 'pendente', 'reprovado'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  const { rowCount } = await db.query(
    'UPDATE certificados SET status = $1, observacao = $2 WHERE id = $3',
    [status, observacao || '', Number(req.params.id)]
  );
  if (rowCount === 0) return res.status(404).json({ erro: 'Certificado não encontrado.' });
  res.json({ mensagem: 'Status atualizado.' });
});

app.get('/stats', autenticar, exigirPerfil('admin', 'coordenador'), async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'aprovado'  THEN 1 ELSE 0 END) AS aprovados,
      SUM(CASE WHEN status = 'pendente'  THEN 1 ELSE 0 END) AS pendentes,
      SUM(CASE WHEN status = 'reprovado' THEN 1 ELSE 0 END) AS reprovados,
      COALESCE(SUM(CASE WHEN status = 'aprovado' THEN horas ELSE 0 END), 0) AS "totalHoras"
    FROM certificados
  `);
  res.json(rows[0]);
});

app.get('/usuarios', autenticar, exigirPerfil('admin'), async (req, res) => {
  const { rows } = await db.query('SELECT id, nome, email, perfil, criado_em FROM usuarios ORDER BY criado_em DESC');
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
    const { rows } = await db.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id',
      [nome, email, senha, perfil]
    );
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    throw err;
  }
});

app.delete('/usuarios/:id', autenticar, exigirPerfil('admin'), async (req, res) => {
  const id = Number(req.params.id);
  const { rows: adminRows } = await db.query("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'admin'");
  const { rows: alvoRows }  = await db.query('SELECT perfil FROM usuarios WHERE id = $1', [id]);
  if (alvoRows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (alvoRows[0].perfil === 'admin' && Number(adminRows[0].total) <= 1) {
    return res.status(400).json({ erro: 'Não é possível excluir o único administrador.' });
  }
  await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
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
