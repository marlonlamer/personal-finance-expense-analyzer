const prisma = require("../prisma/client");

const getAllExpenses = async () => {
  return prisma.expense.findMany({
    orderBy: { createdAt: "desc" }
  });
};

const createExpense = async ({ title, amount, category, createdAt }) => {
  const data = {
    title,
    amount: Number(amount),
    category
  };

  if (createdAt) {
    data.createdAt = new Date(createdAt);
  }

  return prisma.expense.create({
    data
  });
};

const deleteExpense = async (id) => {
  return prisma.expense.delete({
    where: { id: Number(id) }
  });
};
module.exports = {
  getAllExpenses,
  createExpense
  ,deleteExpense
};
