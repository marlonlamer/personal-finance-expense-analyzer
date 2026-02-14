const express = require("express");
const { getIncomes, createIncome, deleteIncome } = require("../controllers/income.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getIncomes);
router.post("/", authMiddleware, createIncome);
router.delete("/:id", authMiddleware, deleteIncome);

module.exports = router;
