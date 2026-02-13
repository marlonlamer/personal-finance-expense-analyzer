const prisma = require("../prisma/client");

const getAllExpenses = async (userId) => {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};

const createExpense = async ({
  title,
  amount,
  category,
  date,
  userId
}) => {
  return prisma.expense.create({
    data: {
      title,
      amount: Number(amount),
      category,
      date: new Date(date),
      userId
    }
  });
};

const deleteExpense = async (id, userId) => {
  return prisma.expense.delete({
    where: {
      id: Number(id),
      userId
    }
  });
};

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense
};

