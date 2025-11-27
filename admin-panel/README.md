# EcoGastos Admin Panel

Painel administrativo para gerenciar o aplicativo EcoGastos.

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Deploy no Railway

### Passo 1: Criar Novo Serviço
1. No Railway, crie um novo serviço
2. Conecte seu repositório GitHub
3. Configure **Root Directory** para: `admin-panel`

### Passo 2: Configurar Build
No Railway, configure:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Passo 3: Variáveis de Ambiente
Adicione a variável de ambiente:
- `VITE_API_URL` = URL do seu backend (ex: `https://seu-backend.up.railway.app/api`)

### Passo 4: Deploy
O Railway vai fazer o deploy automaticamente após o commit.

## Login
Use suas credenciais de administrador (usuário com `isAdmin: true` no banco de dados).

## Funcionalidades
- ✅ Ativar/Desativar Modo Manutenção
- ✅ Configurar Atualizações do App
- ✅ Definir se Atualização é Obrigatória
