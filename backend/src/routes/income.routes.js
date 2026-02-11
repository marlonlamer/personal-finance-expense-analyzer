const express = require("express");
const { getIncomes, createIncome, deleteIncome } = require("../controllers/income.controller");

const router = express.Router();

router.get("/", getIncomes);
router.post("/", createIncome);
router.delete("/:id", deleteIncome);

module.exports = router;
