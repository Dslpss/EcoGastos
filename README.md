# EcoGastos - Gerenciador Financeiro Pessoal

Aplicativo de gerenciamento financeiro desenvolvido com React Native (Expo) e TypeScript.

## Funcionalidades

- **Gestão de Saldo**: Acompanhe seu saldo atual e histórico de entradas.
- **Registro de Gastos**: Adicione, edite e exclua gastos, categorizando-os.
- **Categorias Personalizadas**: Crie suas próprias categorias com cores personalizadas.
- **Contas Recorrentes**: Gerencie contas fixas mensais com lembretes visuais de vencimento.
- **Dashboard**: Visualize gráficos de gastos por categoria e resumo mensal.
- **Persistência de Dados**: Seus dados são salvos automaticamente no dispositivo.

## Tecnologias Utilizadas

- React Native (Expo Go)
- TypeScript
- React Navigation (Bottom Tabs)
- AsyncStorage (Persistência Local)
- React Native Chart Kit (Gráficos)
- Date-fns (Manipulação de Datas)

## Como Executar

1.  **Pré-requisitos**:
    - Node.js instalado.
    - Aplicativo **Expo Go** instalado no seu celular (Android ou iOS).

2.  **Instalação**:
    ```bash
    npm install
    ```

3.  **Execução**:
    ```bash
    npx expo start
    ```

4.  **No Celular**:
    - Abra o Expo Go.
    - Escaneie o QR Code exibido no terminal.

## Estrutura do Projeto

- `/src`: Código fonte
  - `/components`: Componentes reutilizáveis (Modais, Cards)
  - `/screens`: Telas do aplicativo (Dashboard, Gastos, Contas, Categorias)
  - `/context`: Gerenciamento de estado global (FinanceContext)
  - `/navigation`: Configuração de rotas
  - `/types`: Definições de tipos TypeScript
  - `/constants`: Cores e dados estáticos
  - `/utils`: Funções auxiliares

## Desenvolvedor

Desenvolvido como parte de um desafio técnico.
