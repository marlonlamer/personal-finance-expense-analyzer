const incomeService = require("../services/income.service");

const getIncomes = async (req, res) => {
  try {
    const incomes = await incomeService.getAllIncomes(req.userId);
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch incomes" });
  }
};

const createIncome = async (req, res) => {
  const { title, amount, source, createdAt } = req.body;

  if (!title || !amount || !source) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const income = await incomeService.createIncome({
      title,
      amount,
      source,
      createdAt
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: "Failed to create income" });
  }
};

const deleteIncome = async (req, res) => {
  const { id } = req.params;

  try {
    await incomeService.deleteIncome(id);
    res.json({ message: "Income deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete income" });
  }
};

module.exports = {
  getIncomes,
  createIncome,
  deleteIncome
};
