-- Data migration: replace encounter.enemy.tier "TOUGH" with "ELITE" in Run.stateJson.
-- Idempotent: safe to run multiple times (no rows match after first run).
UPDATE "Run"
SET "stateJson" = jsonb_set("stateJson"::jsonb, '{encounter,enemy,tier}', '"ELITE"')
WHERE "stateJson" IS NOT NULL
  AND ("stateJson"::jsonb)->'encounter'->'enemy'->>'tier' = 'TOUGH';
