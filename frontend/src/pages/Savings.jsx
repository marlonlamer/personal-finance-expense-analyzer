import React from "react";

export default function Savings({ totalIncomes, totalExpenses, totalSavings, savingsRate, savingsRateColor }) {
  return (
    <div>
      <h2>Savings</h2>
      <p>Total Income: ₱{totalIncomes.toFixed(2)}</p>
      <p>Total Expenses: ₱{totalExpenses.toFixed(2)}</p>
      <p>Savings: ₱{totalSavings.toFixed(2)}</p>
      <p style={{ color: savingsRateColor }}>Savings Rate: {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A"}</p>
    </div>
  );
}
