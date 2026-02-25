import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.COACH_EMAIL;
  const password = process.env.COACH_PASSWORD;

  if (!email || !password) {
    throw new Error("COACH_EMAIL and COACH_PASSWORD must be set in .env");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const coach = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Coach" },
    create: {
      email,
      passwordHash,
      name: "Coach",
      role: "COACH",
    },
  });

  console.log(`Coach account ready: ${coach.email} (${coach.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
