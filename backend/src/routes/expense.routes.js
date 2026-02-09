const express = require("express");
const {
  getExpenses,
  createExpense
} = require("../controllers/expense.controller");

const router = express.Router();

router.get("/", getExpenses);
router.post("/", createExpense);

module.exports = router;
