require('dotenv').config();
const { dbService } = require('./src/services/DatabaseService');

async function main() {
  const users = await dbService.prisma.user.findMany();
  console.log(users);
}
main().finally(() => dbService.disconnect());
