import { useEffect, useState } from "react";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: ""
  });

  const fetchExpenses = () => {
    fetch("http://localhost:5000/expenses")
      .then(res => res.json())
      .then(data => setExpenses(data));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5000/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm({ title: "", amount: "", category: "" });
    fetchExpenses();
  };

    const deleteExpense = async (id) => {
    await fetch(`http://localhost:5000/expenses/${id}`, {
      method: "DELETE"
    });

    fetchExpenses();
  };

    const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );


  return (
    <div style={{ padding: "2rem" }}>
      <h1>💰 Expense Analyzer</h1>
      <p>Total Expenses: ₱{totalExpenses.toFixed(2)}</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="Amount"
          type="number"
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
          required
        >
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transportation">Transportation</option>
          <option value="Rent/Housing">Rent / Housing</option>
          <option value="Utilities">Utilities</option>
          <option value="Health">Health</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Education">Education</option>
          <option value="Other">Other</option>
        </select>

        <button>Add Expense</button>
      </form>

      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>
            {expense.title} — ₱{expense.amount} ({expense.category})
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => deleteExpense(expense.id)}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

