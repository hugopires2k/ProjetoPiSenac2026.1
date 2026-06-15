# 🎓 Koda Solution — Sistema de Horas Complementares

> Projeto Integrador 2026 — SENAC  
> Desenvolvido pela equipe **Koda Solution**

---

## 📌 Sobre o Projeto

O **Sistema de Horas Complementares** é uma aplicação web fullstack para gerenciamento de certificados de atividades extracurriculares. Alunos enviam seus certificados, coordenadores validam e aprovam, e administradores gerenciam os usuários da plataforma.

O sistema conta com suporte a **PWA (Progressive Web App)**, permitindo instalação no celular como aplicativo nativo.

---

## 🌐 Acesso ao Sistema

| Ambiente | URL |
|---|---|
| 🖥️ Frontend (Produção) | https://senac-pi-frontend.onrender.com/html/login.html |
| ⚙️ Backend API (Produção) | https://senac-pi-backend.onrender.com |

> ⚠️ O plano gratuito do Render pode causar um delay de ~30 segundos no primeiro acesso após períodos de inatividade.

---

## 👥 Perfis de Acesso

| Perfil | Descrição |
|---|---|
| 🎓 Aluno | Envia certificados e acompanha o status de aprovação |
| 📋 Coordenador | Analisa e valida os certificados enviados pelos alunos |
| ⚙️ Administrador | Gerencia usuários do sistema (cadastro e exclusão) |

---

## 🔑 Credenciais de Teste

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | admin@senac.br | admin123 |
| Coordenador | coordenador@senac.br | coord123 |
| Aluno | aluno@senac.br | senac123 |

> ⚠️ Altere essas senhas antes de qualquer uso em ambiente real.

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | v22+ | Runtime JavaScript |
| Express | v5.2.1 | Framework web |
| PostgreSQL | 18 | Banco de dados |
| pg (node-postgres) | v8.21.0 | Driver do PostgreSQL |
| Multer | v2.1.1 | Upload de arquivos |
| dotenv | v16.4.7 | Variáveis de ambiente |
| CORS | v2.8.6 | Cross-Origin Resource Sharing |

### Frontend
| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript (Vanilla) | Lógica e consumo da API |
| PWA | Progressive Web App (instalável) |
| Service Worker | Cache e funcionamento offline |
| Web App Manifest | Configuração do PWA |

---

## ☁️ Hospedagem e Infraestrutura

| Serviço | Plataforma | Plano |
|---|---|---|
| Frontend | Render (Static Site) | Free |
| Backend API | Render (Web Service) | Free |
| Banco de Dados | Render (PostgreSQL 18) | Free |
| Repositório | GitHub | Free |

---

## 🗄️ Banco de Dados

**Plataforma:** Render PostgreSQL 18  
**Região:** Oregon (US West)

### Tabelas

**`usuarios`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL PK | Identificador único |
| nome | VARCHAR(100) | Nome completo |
| email | VARCHAR(150) | E-mail (único) |
| senha | VARCHAR(255) | Senha de acesso |
| perfil | VARCHAR(20) | aluno / coordenador / admin |
| criado_em | TIMESTAMP | Data de cadastro |

**`certificados`**
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL PK | Identificador único |
| usuario_id | INT FK | Referência ao usuário |
| nome | VARCHAR(200) | Nome da atividade |
| categoria | VARCHAR(50) | Tipo da atividade |
| horas | INT | Carga horária |
| descricao | TEXT | Descrição opcional |
| arquivo | VARCHAR(255) | Nome do arquivo enviado |
| status | VARCHAR(20) | pendente / aprovado / reprovado |
| observacao | TEXT | Observação do coordenador |
| criado_em | TIMESTAMP | Data de envio |

---

## 🌐 Endpoints da API

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| POST | `/login` | Autenticação de usuário | Não |
| GET | `/me` | Dados do usuário logado | Todos |
| GET | `/usuarios` | Lista todos os usuários | Admin |
| POST | `/usuarios` | Cadastra novo usuário | Admin |
| DELETE | `/usuarios/:id` | Remove um usuário | Admin |
| GET | `/certificados` | Lista certificados | Todos |
| POST | `/certificados` | Envia novo certificado | Aluno |
| PATCH | `/certificados/:id/status` | Aprova ou reprova | Coordenador/Admin |
| GET | `/certificados/:id/arquivo` | Visualiza o arquivo | Todos |
| GET | `/stats` | Estatísticas gerais | Admin/Coordenador |

---

## 🗂️ Estrutura do Projeto

```
ProjetoPiSenac2026/
├── backend/
│   ├── server.js           # Servidor principal e rotas da API
│   ├── package.json        # Dependências do backend
│   ├── database.sql        # Script de criação do banco
│   ├── .env                # Variáveis de ambiente (não versionar)
│   ├── .gitignore
│   └── uploads/            # Arquivos enviados pelos alunos
│
├── frontend/
│   ├── html/
│   │   ├── login.html          # Tela de login (todos os perfis)
│   │   ├── certificados.html   # Meus certificados (aluno)
│   │   ├── enviar.html         # Enviar certificado (aluno)
│   │   ├── coordenador.html    # Painel de validação (coordenador)
│   │   └── admin.html          # Painel administrativo (admin)
│   ├── css/
│   │   ├── global.css
│   │   ├── login.css
│   │   ├── enviar.css
│   │   └── coordenador.css
│   ├── js/
│   │   ├── login.js
│   │   ├── certificados.js
│   │   ├── enviar.js
│   │   ├── coordenador.js
│   │   └── admin.js
│   ├── manifest.json       # Configuração do PWA
│   └── sw.js               # Service Worker
│
└── README.md
```

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- MySQL 8+ ou PostgreSQL 14+
- npm

### 1. Clonar o repositório
```bash
git clone https://github.com/hugopires2k/ProjetoPiSenac2026.1.git
cd ProjetoPiSenac2026.1
```

### 2. Configurar o banco de dados
```bash
mysql -u root -p < backend/database.sql
```

### 3. Criar o arquivo `.env`
```bash
cd backend
```
Crie o arquivo `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=senac_pi
```

### 4. Instalar dependências e iniciar
```bash
npm install
npm start
```

### 5. Abrir o frontend
Abra o arquivo `frontend/html/login.html` no navegador ou use um servidor local:
```bash
npx serve frontend/
```

---

## 📱 PWA — Instalação no Celular

1. Acesse a tela de login pelo navegador do celular
2. **Android:** toque em "Adicionar à tela inicial"
3. **iOS:** toque em "Compartilhar → Adicionar à Tela de Início"
4. O app será instalado com ícone e tela cheia

---

## 🔐 Segurança

- Autenticação via token Base64 (JWT em versões futuras)
- Rotas protegidas por perfil no backend
- Arquivos aceitos: PDF, JPG e PNG (máx. 10 MB)
- Validação de tipo de arquivo no backend (Multer)
- O arquivo `.env` nunca é versionado

---

## 👥 Equipe

**Koda Solution**  
Projeto Integrador 2026 — SENAC
