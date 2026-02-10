const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Expense Analyzer API is running 🚀");
});

app.get("/expenses", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

app.post("/expenses", async (req, res) => {
  const { title, amount, category, createdAt } = req.body;

  if (!title || !amount || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const data = {
      title,
      amount: Number(amount),
      category
    };

    if (createdAt) data.createdAt = new Date(createdAt);

    const expense = await prisma.expense.create({ data });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: "Failed to create expense" });
  }
});

app.delete("/expenses/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.expense.delete({ where: { id: Number(id) } });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

app.delete("/expenses/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.expense.delete({
      where: { id: Number(id) }
    });
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

