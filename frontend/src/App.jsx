
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
  const [dateFilter, setDateFilter] = useState("all");

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

  const parseDate = (d) => (d ? new Date(d) : null);

  const isSameDay = (a, b) => {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const isWithinWeek = (date) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6); // last 7 days including today
    start.setHours(0,0,0,0);
    const d = new Date(date);
    return d >= start && d <= now;
  };

  const isWithinMonth = (date) => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };

  const matchesFilter = (expense) => {
    if (!expense || !expense.createdAt) return dateFilter === "all";
    const d = parseDate(expense.createdAt);
    if (!d || isNaN(d)) return false;
    if (dateFilter === "all") return true;
    if (dateFilter === "today") return isSameDay(d, new Date());
    if (dateFilter === "week") return isWithinWeek(d);
    if (dateFilter === "month") return isWithinMonth(d);
    return true;
  };

  const filteredExpenses = expenses.filter(matchesFilter);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const categorySummary = Object.values(
    filteredExpenses.reduce((acc, expense) => {
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

      <div style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: 8 }}>Date filter:</label>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
        </select>
      </div>

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

      <div style={{ marginTop: "1rem" }}>
        <p style={{ marginBottom: 8 }}>Showing {filteredExpenses.length} of {expenses.length} expenses</p>
        <ul>
          {filteredExpenses.map(expense => (
            <li key={expense.id}>
              {expense.title} — ₱{expense.amount} ({expense.category}) — {new Date(expense.createdAt).toLocaleDateString()}
              <button style={{ marginLeft: "10px" }} onClick={() => deleteExpense(expense.id)}>❌</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

