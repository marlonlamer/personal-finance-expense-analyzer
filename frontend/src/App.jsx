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
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    category: "",
    source: "",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    source: "",
    date: new Date().toISOString().slice(0, 10),
    notes: ""
  });
  const [dateFilter, setDateFilter] = useState("all");
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const raw = localStorage.getItem("monthlyBudget");
      return raw ? Number(raw) : null;
    } catch  {
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

  const [perCategoryBudgets, setPerCategoryBudgets] = useState([]);

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
        amount: form.amount,
        category: form.category,
        description: form.description,
        source: form.source,
        date: form.date,
        notes: form.notes
      });

      setExpenses(prev => [newExpense, ...prev]);

    } catch (e) {
      console.warn("Create expense failed, adding locally", e);
      const temp = {
        id: Date.now(),
        description: form.description,
        source: form.source,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        notes: form.notes
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
        // backend expects `title` — map the new `name` field to `title`
        amount: incomeForm.amount,
        source: incomeForm.source,
        date: incomeForm.date,
        category: incomeForm.category,
        notes: incomeForm.notes
      });

      setIncomes(prev => [newIncome, ...prev]);

    } catch (e) {
      console.warn("Create income failed, adding locally", e);
      const temp = {
        id: Date.now(),
        amount: Number(incomeForm.amount),
        source: incomeForm.source,
        date: incomeForm.date,
        category: incomeForm.category,
        notes: incomeForm.notes
      };
      setIncomes(prev => [temp, ...prev]);
    } finally {
      setIncomeForm({ amount: "", category: "", source: "", date: new Date().toISOString().slice(0, 10), notes: "" });
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
    if (!expense || !expense.date) return dateFilter === "all";
    const d = parseDate(expense.date);
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
    const d = expense.date ? new Date(expense.date) : null;
    if (!d || isNaN(d)) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const monthlyIncomeMap = incomes.reduce((acc, income) => {
    const d = income.date ? new Date(income.date) : null;
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
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    if (page === "dashboard") {
      return (
        <>
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
          </div>

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

        </>
      );
    }

    if (page === "transactions") {
      return (
        <div>
          <h2>All Transactions</h2>
          <h3>Incomes</h3>
          <ul>
            {incomes.map(i => (
              <li key={i.id}>₱{i.amount} {i.category ? `(${i.category})` : `(${i.source})`} — {(i.date ? new Date(i.date).toLocaleDateString() : "N/A")} {i.notes ? `— ${i.notes}` : null}</li>
            ))}
          </ul>
          <h3>Expenses</h3>
          <ul>
            {expenses.map(e => (
              <li key={e.id}>₱{e.amount} {e.category ? `(${e.category})` : `(${e.source})`} {e.description ? `— ${e.description}` : ""} — {(e.date ? new Date(e.date).toLocaleDateString() : "N/A")} {e.notes ? `— ${e.notes}` : null}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (page === "income") {
      return (
        <div>
          <h3>Add Income</h3>
          <form onSubmit={handleIncomeSubmit}>
            <input placeholder="Amount" type="number" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
            <select value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
              <option value="">Select category</option>
              <option value="Salary">💼 Salary</option>
              <option value="Freelance">💻 Freelance</option>
              <option value="Investment">📈 Investment</option>
              <option value="Business">🏢 Business</option>
              <option value="Side Hustle">💪 Side Hustle</option>
              <option value="Other">➕ Other</option>
            </select>
            <input placeholder="Source of Fund" value={incomeForm.source} onChange={e => setIncomeForm({ ...incomeForm, source: e.target.value })} required />
            <input type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} />
            <input placeholder="Notes" value={incomeForm.notes} onChange={e => setIncomeForm({ ...incomeForm, notes: e.target.value })} />
            <button type="submit">Add Income</button>
          </form>

          <h3 style={{ marginTop: 12 }}>Incomes</h3>
          <ul>
            {incomes.map(income => (
              <li key={income.id}>₱{income.amount} {income.category ? `(${income.category})` : `(${income.source})`} — {(income.date ? new Date(income.date).toLocaleDateString() : "N/A")} {income.notes ? `— ${income.notes}` : null} <button style={{ marginLeft: 10 }} onClick={() => deleteIncome(income.id)}>❌</button></li>
            ))}
          </ul>
        </div>
      );
    }

    if (page === "expenses") {
      return (
        <div>
          <h3>Add Expense</h3>
          <form onSubmit={handleSubmit}>
            <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select category</option>
              <option value="Food">🍔 Food</option>
              <option value="Transportation">🚗 Transportation</option>
              <option value="Rent">🏠 Rent</option>
              <option value="Shopping">🛍️ Shopping</option>
              <option value="Bills">💡 Bills</option>
              <option value="Health">🩺 Health</option>
              <option value="Entertainment">🎬 Entertainment</option>
              <option value="Education">🎓 Education</option>
              <option value="Other">➕ Other</option>
            </select>
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button type="submit">Add Expense</button>
          </form>

          <h3 style={{ marginTop: 12 }}>Expenses</h3>
          <ul>
            {expenses.map(expense => (
              <li key={expense.id}>₱{expense.amount} {expense.category ? `(${expense.category})` : `(${expense.source})`} {expense.description ? `— ${expense.description}` : ""} — {(expense.date ? new Date(expense.date).toLocaleDateString() : "N/A")} {expense.notes ? `— ${expense.notes}` : null} <button style={{ marginLeft: 10 }} onClick={() => deleteExpense(expense.id)}>❌</button></li>
            ))}
          </ul>
        </div>
      );
    }

    if (page === "savings") {
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

    if (page === "reports") {
      return (
        <div>
          <h2>Reports</h2>
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

          <div style={{ width: "100%", height: 300, marginTop: 12 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} />
                <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (page === "profile") return <div><h2>Profile</h2><p>Profile details go here.</p></div>;
    if (page === "settings") return <div><h2>Settings</h2><p>App settings go here.</p></div>;

    return null;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav style={{ width: 220, borderRight: "1px solid #eee", padding: "1rem", background: "#fafafa" }}>
        <h2 style={{ marginTop: 0 }}>Expense Analyzer</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            ["dashboard", "Dashboard"],
            ["transactions", "Transactions"],
            ["income", "Income"],
            ["expenses", "Expenses"],
            ["savings", "Savings"],
            ["reports", "Reports"],
            ["profile", "Profile"],
            ["settings", "Settings"]
          ].map(([key, label]) => (
            <li key={key} style={{ marginBottom: 8 }}>
              <button onClick={() => setPage(key)} style={{ width: "100%", textAlign: "left", padding: "8px 10px", background: page === key ? "#e6f7ff" : "transparent", border: "none", borderRadius: 4 }}>{label}</button>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: "2rem" }}>{renderPage()}</main>
    </div>
  );
}

export default App;

