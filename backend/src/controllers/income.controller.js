const incomeService = require("../services/income.service");

const getIncomes = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const incomes = await incomeService.getAllIncomes(req.userId);
    res.json(incomes);
  } catch (error) {
    console.error("Fetch incomes error:", error);
    res.status(500).json({ error: "Failed to fetch incomes" });
  }
};

const createIncome = async (req, res) => {
  const { title, amount, source } = req.body;

  if (!title || !amount || !source) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const income = await incomeService.createIncome({
      title,
      amount,
      source,
      userId: req.userId
    });

    res.status(201).json(income);
  } catch (error) {
    console.error("Create income error:", error);
    res.status(500).json({ error: "Failed to create income" });
  }
};

const deleteIncome = async (req, res) => {
  try {
    await incomeService.deleteIncome(req.params.id, req.userId);
    res.json({ message: "Income deleted" });
  } catch (error) {
    console.error("Delete income error:", error);
    res.status(500).json({ error: "Failed to delete income" });
  }
};

module.exports = {
  getIncomes,
  createIncome,
  deleteIncome
};
