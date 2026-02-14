const prisma = require("../prisma/client");

const getAllIncomes = async (userId) => {
  return prisma.income.findMany({ 
    where: { userId },
    orderBy: { createdAt: "desc" } 
  });
};

const createIncome = async ({
  title,
  amount,
  source,
  date,
  userId
}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return prisma.income.create({
    data: {
      title,
      amount: Number(amount),
      source,
      date: new Date(date),
      userId
    }
  });
};

const deleteIncome = async (id, userId) => {
  return prisma.income.delete({
    where: {
      id: Number(id),
      userId 
    }
  });
};

module.exports = { getAllIncomes, createIncome, deleteIncome };
