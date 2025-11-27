import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceData {
  balance: number;
  income: number;
  expenses: number;
  transactions: any[];
  userName: string;
}

export const generateFinancialReport = async (data: FinanceData) => {
  const date = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #4A90E2;
            padding-bottom: 20px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #4A90E2;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .summary-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .card {
            flex: 1;
            padding: 20px;
            border-radius: 12px;
            margin: 0 10px;
            text-align: center;
            color: white;
          }
          .card-balance { background: linear-gradient(135deg, #4A90E2, #357ABD); }
          .card-income { background: linear-gradient(135deg, #00C853, #009624); }
          .card-expense { background: linear-gradient(135deg, #FF5252, #D32F2F); }
          
          .card-label { font-size: 12px; text-transform: uppercase; opacity: 0.9; }
          .card-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            text-align: left;
            padding: 12px;
            background-color: #f8f9fa;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #eee;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
          }
          .amount-positive { color: #00C853; font-weight: bold; }
          .amount-negative { color: #FF5252; font-weight: bold; }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">EcoGastos</h1>
          <div class="subtitle">Relatório Financeiro • ${data.userName}</div>
          <div class="subtitle">Gerado em ${date}</div>
        </div>

        <div class="summary-grid">
          <div class="card card-income">
            <div class="card-label">Receitas</div>
            <div class="card-value">R$ ${data.income.toFixed(2)}</div>
          </div>
          <div class="card card-expense">
            <div class="card-label">Despesas</div>
            <div class="card-value">R$ ${data.expenses.toFixed(2)}</div>
          </div>
          <div class="card card-balance">
            <div class="card-label">Saldo Atual</div>
            <div class="card-value">R$ ${data.balance.toFixed(2)}</div>
          </div>
        </div>

        <h3>Últimas Transações</h3>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${data.transactions.map(t => `
              <tr>
                <td>${format(new Date(t.date), 'dd/MM/yyyy')}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td class="${t.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                  ${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento gerado automaticamente pelo aplicativo EcoGastos.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
