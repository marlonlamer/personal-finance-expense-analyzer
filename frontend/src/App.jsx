import { api } from "./api";
import { useEffect, useState, useRef } from "react";
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
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const raw = localStorage.getItem("monthlyBudget");
      return raw ? Number(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const fetchExpenses = async () => {
    try {
      const data = await api.get("/expenses");
      setExpenses(data);
    } catch (e) {
      console.warn("Failed to fetch expenses", e);
    }
  };


  const fetchIncomes = async () => {
    try {
      const data = await api.get("/incomes");
      setIncomes(data);
    } catch (e) {
      console.warn("Failed to fetch incomes", e);
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

  useEffect(() => {
    try {
      if (monthlyBudget === null) localStorage.removeItem("monthlyBudget");
      else localStorage.setItem("monthlyBudget", String(monthlyBudget));
    } catch (e) {
      console.warn("Failed to persist monthlyBudget", e);
    }
  }, [monthlyBudget]);

  const [perCategoryBudgets, setPerCategoryBudgets] = useState(() => {
    try {
      const raw = localStorage.getItem("categoryBudgets");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("categoryBudgets", JSON.stringify(perCategoryBudgets));
    } catch (e) {
      console.warn("Failed to persist categoryBudgets", e);
    }
  }, [perCategoryBudgets]);

  // Modal & autosave state for editing category budgets
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [tempBudgets, setTempBudgets] = useState({});
  const originalBudgetsRef = useRef({});
  const autosaveTimerRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const openBudgetModal = () => {
    originalBudgetsRef.current = { ...perCategoryBudgets };
    setTempBudgets({ ...perCategoryBudgets });
    setBudgetModalOpen(true);
  };

  const closeBudgetModal = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    // revert to original budgets
    setPerCategoryBudgets({ ...originalBudgetsRef.current });
    setBudgetModalOpen(false);
    setSaving(false);
  };

  const saveBudgetModal = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaving(true);
    setPerCategoryBudgets({ ...tempBudgets });
    setSaving(false);
    setSavedAt(Date.now());
    setBudgetModalOpen(false);
  };

  // Debounced autosave of tempBudgets into perCategoryBudgets while modal open
  useEffect(() => {
    if (!budgetModalOpen) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setSaving(true);
    autosaveTimerRef.current = setTimeout(() => {
      setPerCategoryBudgets({ ...tempBudgets });
      autosaveTimerRef.current = null;
      setSaving(false);
      setSavedAt(Date.now());
    }, 800);
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [tempBudgets, budgetModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newExpense = await api.post("/expenses", {
        title: form.title,
        amount: form.amount,
        category: form.category,
        createdAt: form.date
      });

      setExpenses(prev => [newExpense, ...prev]);

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

    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      const newIncome = await api.post("/incomes", {
        title: incomeForm.title,
        amount: incomeForm.amount,
        source: incomeForm.source,
        createdAt: incomeForm.date
      });

      setIncomes(prev => [newIncome, ...prev]);

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

    await api.delete(`/incomes/${id}`);
    fetchIncomes();
  };

  const editCategoryBudget = (category) => {
    const current = perCategoryBudgets[category];
    const raw = window.prompt(`Set budget for ${category} (leave empty to clear):`, current == null ? "" : String(current));
    if (raw === null) return; // cancelled
    if (raw === "") {
      const next = { ...perCategoryBudgets };
      delete next[category];
      setPerCategoryBudgets(next);
      return;
    }
    const num = Number(raw);
    if (isNaN(num) || num < 0) {
      window.alert("Please enter a valid non-negative number for budget.");
      return;
    }
    setPerCategoryBudgets(prev => ({ ...prev, [category]: num }));
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

  const filteredIncomes = incomes.filter(matchesFilter);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalIncomes = filteredIncomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);

  const totalSavings = totalIncomes - totalExpenses;
  const savingsRate = totalIncomes > 0 ? (totalSavings / totalIncomes) * 100 : null;
  const savingsRateColor =
    savingsRate === null
      ? "inherit"
      : savingsRate < 0
      ? "#FF6B6B"
      : savingsRate < 15
      ? "#FFD166"
      : "#2ED573";

  const percentBudgetUsed = monthlyBudget && monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : null;
  const budgetColor =
    percentBudgetUsed === null
      ? "inherit"
      : percentBudgetUsed >= 100
      ? "#FF6B6B"
      : percentBudgetUsed >= 80
      ? "#FFD166"
      : "#2ED573";
  const budgetRemaining = monthlyBudget !== null ? monthlyBudget - totalExpenses : null;

  const categorySummary = Object.values(
    filteredExpenses.reduce((acc, expense) => {
      const cat = expense.category || "Uncategorized";
      const amt = Number(expense.amount) || 0;
      if (!acc[cat]) acc[cat] = { category: cat, amount: 0 };
      acc[cat].amount += amt;
      return acc;
    }, {})
  ).sort((a, b) => b.amount - a.amount);

  const overBudgetCategories = categorySummary.filter(c => {
    const b = perCategoryBudgets[c.category];
    return b != null && c.amount >= b;
  });

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
      <p>Total Income: ₱{totalIncomes.toFixed(2)}</p>
      <p>Total Expenses: ₱{totalExpenses.toFixed(2)}</p>
      <p>Savings: ₱{totalSavings.toFixed(2)}</p>
      <p style={{ color: savingsRateColor }}>Savings Rate: {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "N/A"}</p>

      <div style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: 8 }}>Date filter:</label>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
        </select>
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <label style={{ marginRight: 8 }}>Monthly Budget:</label>
        <input
          type="number"
          placeholder="Set monthly budget"
          value={monthlyBudget === null ? "" : monthlyBudget}
          onChange={e => setMonthlyBudget(e.target.value === "" ? null : Number(e.target.value))}
        />
        {monthlyBudget !== null && (
          <span style={{ marginLeft: 12, color: budgetColor }}>
            {percentBudgetUsed !== null ? `${percentBudgetUsed.toFixed(1)}% used` : ""}
            {budgetRemaining !== null && ` — Remaining: ₱${budgetRemaining.toFixed(2)}`}
          </span>
        )}
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
        {overBudgetCategories.length > 0 && (
          <div style={{ padding: 10, background: "#FFEEEE", color: "#AA0000", borderRadius: 6, marginBottom: 12 }}>
            <strong>Budget Alert:</strong> You have exceeded the budget for {overBudgetCategories.map(c => c.category).join(", ")}.
          </div>
        )}
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
          {categorySummary.map((c) => {
            const budget = perCategoryBudgets[c.category] ?? null;
            const pct = budget && budget > 0 ? (c.amount / budget) * 100 : null;
            const color = pct === null ? "inherit" : pct >= 100 ? "#FF6B6B" : pct >= 80 ? "#FFD166" : "#2ED573";
            const remaining = budget !== null ? budget - c.amount : null;
            return (
              <li key={c.category} style={{ marginBottom: 6 }}>
                <strong>{c.category}</strong>: ₱{c.amount.toFixed(2)}
                {budget !== null ? (
                  <span style={{ marginLeft: 12, color }}>
                    {pct !== null ? `${pct.toFixed(1)}%` : ""} used
                    {remaining !== null && ` — Remaining: ₱${remaining.toFixed(2)}`}
                  </span>
                ) : (
                  <span style={{ marginLeft: 12, color: "#666" }}>No budget</span>
                )}
                <button style={{ marginLeft: 10 }} onClick={() => { originalBudgetsRef.current = { ...perCategoryBudgets }; setTempBudgets({ ...perCategoryBudgets }); setBudgetModalOpen(true); }}>Edit Budget</button>
              </li>
            );
          })}
        </ul>

        {budgetModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ background: "#fff", padding: 20, borderRadius: 8, width: "90%", maxWidth: 720, maxHeight: "80%", overflow: "auto" }}>
              <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Edit Category Budgets</span>
                <span style={{ fontSize: 12, color: saving ? "#FFD166" : savedAt ? "#2ED573" : "#666" }}>
                  {saving ? "Autosaving..." : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
                </span>
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 8 }}>Category</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Spent</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Budget</th>
                    <th style={{ textAlign: "right", padding: 8 }}>Used</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySummary.map((c) => {
                    const key = c.category;
                    const spent = c.amount;
                    const b = tempBudgets[key] ?? "";
                    const pct = b && b > 0 ? (spent / b) * 100 : null;
                    return (
                      <tr key={key}>
                        <td style={{ padding: 8 }}>{key}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>₱{spent.toFixed(2)}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          <input
                            type="number"
                            min="0"
                            value={b}
                            onChange={e => {
                              const raw = e.target.value;
                              setTempBudgets(prev => {
                                const copy = { ...prev };
                                if (raw === "") delete copy[key];
                                else copy[key] = Number(raw);
                                return copy;
                              });
                            }}
                            style={{ width: 120 }}
                          />
                        </td>
                        <td style={{ padding: 8, textAlign: "right" }}>{pct !== null ? `${pct.toFixed(1)}%` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button onClick={closeBudgetModal} style={{ marginRight: 8 }}>Cancel</button>
                <button onClick={saveBudgetModal}>Save</button>
              </div>
            </div>
          </div>
        )}
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

