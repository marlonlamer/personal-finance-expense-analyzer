import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.expense.createMany({
    data: [
      { title: "Lunch", amount: 120, category: "Food" },
      { title: "Jeepney", amount: 15, category: "Transport" },
      { title: "Coffee", amount: 90, category: "Food" }
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
