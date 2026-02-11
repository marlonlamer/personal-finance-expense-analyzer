const express = require("express");
const cors = require("cors");

const expenseRoutes = require("./routes/expense.routes");
const incomeRoutes = require("./routes/income.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Expense Analyzer API is running 🚀");
});

app.use("/expenses", expenseRoutes);
app.use("/incomes", incomeRoutes);

module.exports = app;
