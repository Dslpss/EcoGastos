# EcoGastos Backend

Backend API para o aplicativo EcoGastos - Sistema de controle financeiro pessoal.

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **MongoDB Atlas** - Banco de dados na nuvem
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação segura
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing

## 📋 Pré-requisitos

- Node.js 16+ instalado
- Conta no MongoDB Atlas (já configurada)
- npm ou yarn

## ⚙️ Configuração

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com:
- `MONGODB_URI` - Conexão com MongoDB Atlas
- `JWT_SECRET` - Chave secreta para tokens
- `PORT` - Porta do servidor (3000)

**⚠️ IMPORTANTE**: O arquivo `.env` está no `.gitignore` e NÃO será commitado no Git por segurança.

### 3. Iniciar o servidor

```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

O servidor iniciará em `http://localhost:3000`

## 📡 Endpoints da API

### Autenticação

#### Registrar usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Obter usuário atual
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Atualizar perfil
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "settings": {
    "isDarkMode": true
  }
}
```

### Dados Financeiros

#### Obter todos os dados
```http
GET /api/finance
Authorization: Bearer <token>
```

#### Atualizar dados completos
```http
PUT /api/finance
Authorization: Bearer <token>
Content-Type: application/json

{
  "balance": 1000,
  "expenses": [...],
  "incomes": [...],
  "categories": [...],
  "recurringBills": [...]
}
```

#### Adicionar gasto
```http
POST /api/finance/expense
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "123",
  "amount": 50,
  "description": "Almoço",
  "categoryId": "1",
  "date": "2025-11-27"
}
```

#### Deletar gasto
```http
DELETE /api/finance/expense/:id
Authorization: Bearer <token>
```

#### Adicionar receita
```http
POST /api/finance/income
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "456",
  "amount": 3000,
  "description": "Salário",
  "date": "2025-11-27"
}
```

#### Deletar receita
```http
DELETE /api/finance/income/:id
Authorization: Bearer <token>
```

## 🔒 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Autenticação JWT (tokens expiram em 30 dias)
- ✅ Headers de segurança com Helmet
- ✅ Rate limiting (100 requisições por 15 minutos)
- ✅ CORS configurado
- ✅ Validação de entrada com express-validator
- ✅ Credenciais em variáveis de ambiente

## 🧪 Testar a API

### Health Check
```bash
curl http://localhost:3000/health
```

### Registrar usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"123456"}'
```

## 📝 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuração MongoDB
│   ├── models/
│   │   ├── User.js           # Modelo de usuário
│   │   └── FinanceData.js    # Modelo de dados financeiros
│   ├── routes/
│   │   ├── auth.js           # Rotas de autenticação
│   │   └── finance.js        # Rotas de dados financeiros
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticação JWT
│   └── server.js             # Servidor principal
├── .env                      # Variáveis de ambiente (não commitado)
├── .gitignore
└── package.json
```

## 🌐 Conectar do App Mobile

### Emulador Android/iOS
Use `http://localhost:3000`

### Dispositivo Físico
1. Descubra o IP local do seu computador:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Use `http://SEU_IP:3000` (ex: `http://192.168.1.100:3000`)
3. Atualize o arquivo `.env` do frontend com o IP correto

## 🚀 Deploy (Produção)

Para deploy em produção, considere:

1. **Hosting**: Railway, Render, Heroku, DigitalOcean
2. **Variáveis de ambiente**: Configure no painel do hosting
3. **CORS**: Atualize para permitir apenas o domínio do app
4. **HTTPS**: Sempre use HTTPS em produção
5. **Logs**: Configure sistema de logs (Winston, Morgan)
6. **Monitoring**: Configure monitoramento (Sentry, LogRocket)

## 📄 Licença

MIT

## 👨‍💻 Desenvolvedor

EcoGastos Team - 2025
