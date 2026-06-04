const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const certificados = [];

app.use(cors());
app.use(express.json());

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (senha === '123456') {
    res.json({ token: 'token-fixo-123' });
  } else {
    res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }
});

app.post('/certificados', upload.single('arquivo'), (req, res) => {
  const { nome, horas, categoria, descricao } = req.body;
  const certificado = {
    nome,
    horas: Number(horas),
    categoria,
    descricao,
    arquivo: req.file.filename,
    status: 'pendente',
    data: new Date().toLocaleDateString('pt-BR')
  };
  certificados.push(certificado);
  res.status(201).json({ message: 'Certificado enviado com sucesso' });
});

app.get('/certificados', (req, res) => {
  res.json(certificados);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
