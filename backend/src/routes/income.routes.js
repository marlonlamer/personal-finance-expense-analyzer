const express = require("express");
const { getIncomes, createIncome, deleteIncome } = require("../controllers/income.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/incomes", authMiddleware, getIncomes);
router.post("/incomes", authMiddleware, createIncome);
router.delete("/incomes/:id", authMiddleware, deleteIncome);

module.exports = router;
