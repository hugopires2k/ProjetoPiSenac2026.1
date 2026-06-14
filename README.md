# ResumeAI — Assistente de Resumo com Inteligência Artificial

> MVP desenvolvido para a Entrega Final da Residência em Software & IA — Porto Digital 2026

## 📌 Sobre o Projeto

O **ResumeAI** é uma aplicação web que utiliza IA para resumir textos automaticamente. O usuário cola qualquer conteúdo textual, seleciona o estilo de resumo desejado e a IA retorna:

- Um resumo no estilo escolhido
- O tema principal do texto
- O tom detectado (jornalístico, técnico, acadêmico etc.)
- Os pontos-chave extraídos

## 🧠 Serviços de IA Utilizados

| Serviço | Modelo | Uso |
|---|---|---|
| Groq API | LLaMA 3.3 70B Versatile | Geração de resumos e extração de metadados |

## 🗂 Estrutura do Projeto

```
resumo-ia/
├── index.html               # Aplicação completa (frontend + lógica JS)
├── README.md                # Este arquivo
├── prompt-engineering.md    # Documentação de prompts e integrações de IA
└── prompts-falharam.md      # Exemplos de prompts que falharam e ajustes
```

## ⚙️ Como Executar

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Chave de API da Groq (gratuita em console.groq.com)

### Passo 1 — Obter a chave de API

1. Acesse [console.groq.com](https://console.groq.com)
2. Faça login com sua conta Google
3. Vá em **API Keys** e clique em **Create API Key**
4. Copie a chave gerada (começa com `gsk_...`)

### Passo 2 — Configurar a chave na aplicação

Abra o arquivo `index.html` em um editor de texto e localize a linha:

```javascript
'Authorization': 'Bearer SUA_CHAVE_GROQ_AQUI'
```

Substitua `SUA_CHAVE_GROQ_AQUI` pela sua chave.

> ⚠️ **Atenção:** Em produção, NUNCA exponha chaves de API no frontend. Utilize um backend intermediário para fazer as chamadas à API de forma segura.

### Passo 3 — Executar

Abra o arquivo `index.html` diretamente no navegador, ou sirva com qualquer servidor HTTP local:

```bash
# Python
python -m http.server 3000

# Node.js
npx serve .
```

Acesse: `http://localhost:3000`

## 🔐 Variáveis de Ambiente (para produção com backend)

| Variável | Descrição |
|---|---|
| `GROQ_API_KEY` | Chave de API da Groq |
| `MODEL_NAME` | Modelo utilizado (padrão: `llama-3.3-70b-versatile`) |
| `MAX_TOKENS` | Limite de tokens na resposta (padrão: 1000) |

## 🚀 Deploy Rápido

A aplicação é um arquivo HTML estático e pode ser publicada em qualquer serviço de hospedagem estática:

- **Vercel**: arraste a pasta para vercel.com
- **Netlify**: arraste a pasta para netlify.com
- **GitHub Pages**: suba para um repositório e ative Pages

## 🛠 Tecnologias

- HTML5 / CSS3 / JavaScript (Vanilla)
- Groq API com modelo LLaMA 3.3 70B Versatile
- Google Fonts (Syne + DM Sans)

## 👥 Equipe

Residência em Software & IA — Porto Digital 2026
