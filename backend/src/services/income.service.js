const prisma = require("../prisma/client");

const getAllIncomes = async (userId) => {
  return prisma.income.findMany({ 
    where: { userId },
    orderBy: { date: "desc" } 
  });
};

const createIncome = async ({
  title,
  amount,
  source,
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
