
import { useEffect, useState } from "react";

function App() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const raw = localStorage.getItem("expenses");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0, 10)
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch("http://localhost:5000/expenses");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setExpenses(data);
    } catch (e) {
      console.warn("Failed to fetch expenses, using localStorage", e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (e) {
      console.warn("Failed to write expenses to localStorage", e);
    }
  }, [expenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        amount: form.amount,
        category: form.category,
        createdAt: form.date
      };

      const res = await fetch("http://localhost:5000/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newExpense = await res.json();
        setExpenses(prev => [newExpense, ...prev]);
      } else {
        console.warn("Failed to add expense on server");
      }
    } catch (e) {
      console.warn("Create expense failed, adding locally", e);
      const temp = {
        id: Date.now(),
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        createdAt: form.date || new Date().toISOString()
      };
      setExpenses(prev => [temp, ...prev]);
    } finally {
      setForm({ title: "", amount: "", category: "", date: new Date().toISOString().slice(0, 10) });
    }
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      const res = await fetch(`http://localhost:5000/expenses/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        console.warn("Server failed to delete, refetching");
        fetchExpenses();
      }
    } catch (e) {
      console.warn("Delete request failed, data removed locally", e);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const categorySummary = Object.values(
    expenses.reduce((acc, expense) => {
      const cat = expense.category || "Uncategorized";
      const amt = Number(expense.amount) || 0;
      if (!acc[cat]) acc[cat] = { category: cat, amount: 0 };
      acc[cat].amount += amt;
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>💰 Expense Analyzer</h1>
      <p>Total Expenses: ₱{totalExpenses.toFixed(2)}</p>

      <div style={{ marginTop: "1rem" }}>
        <h2>By Category</h2>
        <ul>
          {categorySummary.map((c) => (
            <li key={c.category}>
              {c.category}: ₱{c.amount.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

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
          placeholder="Date"
          type="date"
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
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

        <button type="submit">Add Expense</button>
      </form>

      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>
            {expense.title} — ₱{expense.amount} ({expense.category}) — {new Date(expense.createdAt).toLocaleDateString()}
            <button style={{ marginLeft: "10px" }} onClick={() => deleteExpense(expense.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

