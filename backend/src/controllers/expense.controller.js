const expenseService = require("../services/expense.service");
const expenses = await expenseService.getAllExpenses(req.userId);


const getExpenses = async (req, res) => {
  try {
    const expenses = await expenseService.getAllExpenses(req.userId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

const createExpense = async (req, res) => {
  const { title, amount, category, createdAt } = req.body;

  if (!title || !amount || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const expense = await expenseService.createExpense({
      title,
      amount,
      category,
      createdAt
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
};

const deleteExpense = async (req, res) => {
  const { id } = req.params;

  try {
    await expenseService.deleteExpense(id);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense
};
