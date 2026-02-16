const express = require("express");
const router = express.Router();

const {
  getExpenses,
  createExpense
  ,deleteExpense
} = require("../controllers/expense.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.get("/expenses", authMiddleware, getExpenses);
router.post("/expenses", authMiddleware, createExpense);
router.delete("/expenses/:id", authMiddleware, deleteExpense);

module.exports = router;
