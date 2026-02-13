const express = require("express");
const router = express.Router();

const {
  getExpenses,
  createExpense
  ,deleteExpense
} = require("../controllers/expense.controller");

const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, getExpenses);
router.post("/", authMiddleware, createExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;
