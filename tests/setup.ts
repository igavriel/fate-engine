// Use a URL that tests treat as "no real DB" so integration test doesn't expect 200 when unset
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/dummy";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
