# SENAC PI 2026 — Sistema de Horas Complementares

Sistema web para envio e validação de certificados de horas complementares dos cursos do SENAC.

## Funcionalidades

- **Aluno** — envia certificados (PDF/imagem), acompanha status (pendente, aprovado, reprovado)
- **Coordenador** — visualiza todos os certificados e aprova ou reprova cada um
- **Admin** — gerencia usuários (cadastrar coordenadores e alunos)

## Estrutura do Projeto

```
/
├── backend/
│   ├── server.js          # API REST (Express)
│   ├── package.json
│   ├── .env.example       # Variáveis de ambiente (copie para .env)
│   └── uploads/           # Arquivos enviados (gerado automaticamente, não comitar)
│
├── frontend/
│   ├── html/
│   │   ├── login.html
│   │   ├── certificados.html
│   │   └── enviar.html
│   ├── css/
│   │   ├── login.css
│   │   ├── certificados.css
│   │   └── enviar.css
│   └── js/
│       ├── login.js
│       ├── certificados.js
│       └── enviar.js
│
├── .gitignore
└── README.md
```

## Como Rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configure as variáveis se quiser
npm start
```

O servidor sobe em `http://localhost:3000`.

### Frontend

Abra `frontend/html/login.html` diretamente no navegador **ou** sirva com uma extensão como o Live Server do VS Code.

## Usuários de Teste

| E-mail                  | Senha      | Perfil       |
|-------------------------|------------|--------------|
| aluno@senac.br          | senac123   | Aluno        |
| coordenador@senac.br    | coord123   | Coordenador  |
| admin@senac.br          | admin123   | Admin        |

## Rotas da API

| Método | Rota                        | Acesso              | Descrição                      |
|--------|-----------------------------|---------------------|--------------------------------|
| POST   | /login                      | Público             | Autenticar usuário             |
| POST   | /certificados               | Autenticado         | Enviar certificado             |
| GET    | /certificados               | Autenticado         | Listar certificados            |
| PATCH  | /certificados/:id/status    | Coordenador / Admin | Aprovar ou reprovar            |
| GET    | /usuarios                   | Admin               | Listar usuários                |
| POST   | /usuarios                   | Admin               | Cadastrar usuário              |

## Tecnologias

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express, Multer
- **Armazenamento:** Em memória (suficiente para demonstração do PI)

## Observações

- Os dados são armazenados em memória; reiniciar o servidor apaga os certificados enviados.
- Para persistência real, integre um banco de dados (ex: SQLite, MySQL).
- O token de autenticação é baseado em Base64 do e-mail — adequado para PI; em produção use JWT.
