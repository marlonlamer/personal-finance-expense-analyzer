const prisma = require("../prisma/client");

const getAllIncomes = async () => {
  return prisma.income.findMany({ orderBy: { createdAt: "desc" } });
};

const createIncome = async ({ title, amount, source, createdAt }) => {
  const data = {
    title,
    amount: Number(amount),
    source
  };

  if (createdAt) {
    data.createdAt = new Date(createdAt);
  }

  return prisma.income.create({ data });
};

const deleteIncome = async (id) => {
  return prisma.income.delete({ where: { id: Number(id) } });
};

module.exports = { getAllIncomes, createIncome, deleteIncome };
