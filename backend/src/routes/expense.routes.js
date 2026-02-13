const express = require("express");
const {
  getExpenses,
  createExpense
  ,deleteExpense
} = require("../controllers/expense.controller");

const router = express.Router();

router.get("/", authMiddleware, getExpenses);
router.post("/", authMiddleware, createExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
