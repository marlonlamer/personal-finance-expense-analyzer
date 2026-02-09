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

  return (
    <div style={{ padding: "2rem" }}>
      <h1>💰 Expense Analyzer</h1>

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
        <input
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        />
        <button>Add Expense</button>
      </form>

      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>
            {expense.title} — ₱{expense.amount} ({expense.category})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

