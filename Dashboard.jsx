import { load } from "../utils/storage";

export default function Dashboard() {
  const income = load("income", []);
  const expenses = load("expenses", []);
  const loans = load("loans", []);

  const totalIncome = income.reduce((a, b) => a + b.amount, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const totalLoans = loans.reduce((a, b) => a + b.monthly, 0);

  const balance = totalIncome - totalExpenses - totalLoans;

  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>Income: {totalIncome}</p>
      <p>Expenses: {totalExpenses}</p>
      <p>Loans: {totalLoans}</p>
      <h3>Balance: {balance}</h3>
    </div>
  );
}
