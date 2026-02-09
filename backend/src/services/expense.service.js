const prisma = require("../prisma/client");

const getAllExpenses = async () => {
  return prisma.expense.findMany({
    orderBy: { createdAt: "desc" }
  });
};

const createExpense = async ({ title, amount, category }) => {
  return prisma.expense.create({
    data: {
      title,
      amount: Number(amount),
      category
    }
  });
};

module.exports = {
  getAllExpenses,
  createExpense
};
