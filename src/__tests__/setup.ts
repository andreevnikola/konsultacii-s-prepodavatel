// Redirect all Prisma connections to the test database.
// This file runs before any test file via vitest setupFiles.
process.env.DATABASE_URL = "file:./test.db";
process.env.SESSION_SECRET = "test-secret-for-vitest";
