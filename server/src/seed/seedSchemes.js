require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const schemes = [
  {
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    description: "An initiative by the government of India in which all farmers will get up to ₹6,000 per year as minimum income support.",
    sector: "Agriculture",
    minAge: 18,
    maxAge: null,
    maxIncome: null,
    category: "any",
    gender: "any",
    state: "All India",
    benefits: "₹6,000 per year in three equal installments of ₹2,000 each.",
    applicationProcess: "Apply via PM-KISAN portal or local CSC center.",
    requiredDocuments: "Aadhaar Card, Bank Account Details, Land Ownership Documents."
  },
  {
    name: "Mudra Yojana",
    description: "Provide loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises.",
    sector: "Business & Entrepreneurship",
    minAge: 18,
    maxAge: 65,
    maxIncome: null,
    category: "any",
    gender: "any",
    state: "All India",
    benefits: "Collateral-free loans up to ₹10 Lakhs under Shishu, Kishore, and Tarun categories.",
    applicationProcess: "Apply at any commercial bank, RRB, Small Finance Bank, or online at Udyamimitra portal.",
    requiredDocuments: "Aadhaar, PAN, Business Plan, Proof of Identity/Address."
  },
  {
    name: "Sukanya Samriddhi Yojana",
    description: "A small deposit scheme for the girl child launched as a part of the 'Beti Bachao Beti Padhao' campaign.",
    sector: "Women & Child",
    minAge: 0,
    maxAge: 10,
    maxIncome: null,
    category: "any",
    gender: "female",
    state: "All India",
    benefits: "High interest rate (approx 8.2%), tax benefits under 80C, matures when the girl turns 21.",
    applicationProcess: "Open an account at any Post Office or authorized commercial bank.",
    requiredDocuments: "Birth Certificate of the girl child, ID/Address proof of parents."
  }
];

async function seed() {
  console.log('Seeding Government Schemes...');
  for (const scheme of schemes) {
    await prisma.scheme.create({
      data: scheme
    });
    console.log(`Created scheme: ${scheme.name}`);
  }
  console.log('Seeding completed.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
