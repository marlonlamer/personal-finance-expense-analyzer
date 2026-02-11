
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

function App() {
  const [expenses, setExpenses] = useState(() => {
    try {
      const raw = localStorage.getItem("expenses");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [incomes, setIncomes] = useState(() => {
    try {
      const raw = localStorage.getItem("incomes");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [incomeForm, setIncomeForm] = useState({
    title: "",
    amount: "",
    source: "",
    date: new Date().toISOString().slice(0, 10)
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

  const fetchIncomes = async () => {
    try {
      const res = await fetch("http://localhost:5000/incomes");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setIncomes(data);
    } catch (e) {
      console.warn("Failed to fetch incomes, using localStorage", e);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (e) {
      console.warn("Failed to write expenses to localStorage", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem("incomes", JSON.stringify(incomes));
    } catch (e) {
      console.warn("Failed to write incomes to localStorage", e);
    }
  }, [incomes]);

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

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: incomeForm.title,
        amount: incomeForm.amount,
        source: incomeForm.source,
        createdAt: incomeForm.date
      };

      const res = await fetch("http://localhost:5000/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newIncome = await res.json();
        setIncomes(prev => [newIncome, ...prev]);
      } else {
        console.warn("Failed to add income on server");
      }
    } catch (e) {
      console.warn("Create income failed, adding locally", e);
      const temp = {
        id: Date.now(),
        title: incomeForm.title,
        amount: Number(incomeForm.amount),
        source: incomeForm.source,
        createdAt: incomeForm.date || new Date().toISOString()
      };
      setIncomes(prev => [temp, ...prev]);
    } finally {
      setIncomeForm({ title: "", amount: "", source: "", date: new Date().toISOString().slice(0, 10) });
    }
  };

  const deleteIncome = async (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));

    try {
      const res = await fetch(`http://localhost:5000/incomes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        console.warn("Server failed to delete income, refetching");
        fetchIncomes();
      }
    } catch (e) {
      console.warn("Delete income request failed, data removed locally", e);
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

  const pieData = categorySummary.map((c) => ({ name: c.category, value: Number(c.amount) }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EFF", "#FF6B6B", "#2ED573", "#FFA3A3"];

  const monthlyExpenseMap = expenses.reduce((acc, expense) => {
    const d = expense.createdAt ? new Date(expense.createdAt) : null;
    if (!d || isNaN(d)) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const monthlyIncomeMap = incomes.reduce((acc, income) => {
    const d = income.createdAt ? new Date(income.createdAt) : null;
    if (!d || isNaN(d)) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(income.amount || 0);
    return acc;
  }, {});

  const allMonthKeys = Array.from(new Set([...Object.keys(monthlyExpenseMap), ...Object.keys(monthlyIncomeMap)])).sort();

  const combinedLineData = allMonthKeys.map((k) => {
    const [y, m] = k.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    const label = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
    return {
      month: label,
      monthKey: k,
      expenses: Number(monthlyExpenseMap[k] || 0),
      incomes: Number(monthlyIncomeMap[k] || 0)
    };
  });

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
        <h2>Expenses vs Income Per Month</h2>
        {combinedLineData.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={combinedLineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₱${v.toFixed(0)}`} />
                <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#FF6B6B" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="incomes" name="Incomes" stroke="#00C49F" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No monthly data available.</p>
        )}

        <h2 style={{ marginTop: 20 }}>By Category</h2>
        {pieData.length > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const RAD = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RAD);
                    const y = cy + radius * Math.sin(-midAngle * RAD);
                    return (
                      <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600 }}>
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No expenses to display.</p>
        )}

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

      <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
        <h3>Add Income</h3>
        <form onSubmit={handleIncomeSubmit}>
          <input
            placeholder="Title"
            value={incomeForm.title}
            onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })}
          />
          <input
            placeholder="Amount"
            type="number"
            value={incomeForm.amount}
            onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
          />
          <input
            placeholder="Date"
            type="date"
            value={incomeForm.date}
            onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })}
          />
          <input
            placeholder="Source"
            value={incomeForm.source}
            onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })}
            required
          />
          <button type="submit">Add Income</button>
        </form>

        <div style={{ marginTop: "1rem" }}>
          <p style={{ marginBottom: 8 }}>Showing {incomes.length} incomes</p>
          <ul>
            {incomes.map(income => (
              <li key={income.id}>
                {income.title} — ₱{income.amount} ({income.source}) — {new Date(income.createdAt).toLocaleDateString()}
                <button style={{ marginLeft: "10px" }} onClick={() => deleteIncome(income.id)}>❌</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

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

