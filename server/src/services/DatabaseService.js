const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

class DatabaseService {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async saveSession(callSessionData) {
    try {
      const session = await this.prisma.callSession.create({
        data: callSessionData
      });
      console.log(`[DatabaseService] Session saved with ID: ${session.id}`);
      return session;
    } catch (err) {
      console.error('[DatabaseService] Failed to save session:', err);
    }
  }

  async saveCitizenConversation(data) {
    try {
      if (data.deviceId) {
        await this.prisma.citizenDevice.upsert({
          where: { deviceId: data.deviceId },
          create: { deviceId: data.deviceId, deviceSecretHash: 'dummy' },
          update: {}
        });
      }

      const conversation = await this.prisma.citizenConversation.upsert({
        where: { id: data.id },
        create: data,
        update: { updatedAt: new Date() },
      });
      return conversation;
    } catch (err) {
      console.error('[DatabaseService] Failed to save citizen conversation:', err);
    }
  }

  async getCitizenConversation(conversationId) {
    try {
      return await this.prisma.citizenConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 40,
          },
        },
      });
    } catch (err) {
      console.error('[DatabaseService] Failed to get citizen conversation:', err);
    }
  }

  async saveCitizenMessage(data) {
    try {
      const message = await this.prisma.citizenMessage.create({
        data: {
          ...data,
          createdAt: data.createdAt || new Date(),
        },
      });
      await this.prisma.citizenConversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });
      return message;
    } catch (err) {
      if (err.code === 'P2002') {
        return null;
      }
      console.error('[DatabaseService] Failed to save citizen message:', err);
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

const dbService = new DatabaseService();
module.exports = { dbService };