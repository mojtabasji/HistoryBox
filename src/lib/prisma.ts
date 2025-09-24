import { PrismaClient } from '@prisma/client';

declare global {
  // Using global var pattern for Next.js hot reload in dev
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  const options: { datasources?: { db?: { url?: string } } } = {};
  const rawUrl = process.env.DATABASE_URL;
  try {
    if (rawUrl) {
      const url = new URL(rawUrl);
      // Disable prepared statements to avoid "prepared statement already exists"
      // errors with pools/HMR. This is safe across environments.
      if (!url.searchParams.has('prepared_statements')) {
        url.searchParams.set('prepared_statements', 'false');
      }
    options.datasources = { db: { url: url.toString() } };
    }
  } catch {
    // If DATABASE_URL is missing or not a valid URL string, fall back to default
  }
  return new PrismaClient(options);
}

const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export default prisma;
