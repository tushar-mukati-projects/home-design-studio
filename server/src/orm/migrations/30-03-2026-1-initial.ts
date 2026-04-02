import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DROP TABLE IF EXISTS "placed_furniture" CASCADE;
    DROP TABLE IF EXISTS "rooms" CASCADE;
    DROP TABLE IF EXISTS "furniture_items" CASCADE;
    DROP TABLE IF EXISTS "designs" CASCADE;
    DROP TABLE IF EXISTS "users" CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "users" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "designs" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      canvas_data JSONB NOT NULL DEFAULT '{}',
      width DOUBLE PRECISION NOT NULL DEFAULT 800,
      height DOUBLE PRECISION NOT NULL DEFAULT 600,
      is_public BOOLEAN NOT NULL DEFAULT false,
      user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_designs_user_id ON "designs"(user_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "rooms" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT 'Room',
      type TEXT NOT NULL DEFAULT 'generic',
      color TEXT NOT NULL DEFAULT '#E5E7EB',
      points JSONB NOT NULL,
      area DOUBLE PRECISION NOT NULL DEFAULT 0,
      design_id UUID NOT NULL REFERENCES "designs"(id) ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_rooms_design_id ON "rooms"(design_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "furniture_items" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      width DOUBLE PRECISION NOT NULL,
      height DOUBLE PRECISION NOT NULL,
      depth DOUBLE PRECISION NOT NULL,
      color TEXT NOT NULL DEFAULT '#8B7355',
      icon TEXT,
      description TEXT,
      is_default BOOLEAN NOT NULL DEFAULT false
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_furniture_items_category ON "furniture_items"(category)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "placed_furniture" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      x DOUBLE PRECISION NOT NULL,
      y DOUBLE PRECISION NOT NULL,
      rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
      scale_x DOUBLE PRECISION NOT NULL DEFAULT 1,
      scale_y DOUBLE PRECISION NOT NULL DEFAULT 1,
      design_id UUID NOT NULL REFERENCES "designs"(id) ON DELETE CASCADE,
      furniture_item_id UUID NOT NULL REFERENCES "furniture_items"(id) ON DELETE CASCADE,
      room_id UUID
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_placed_furniture_design_id ON "placed_furniture"(design_id)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_designs_updated_at
    BEFORE UPDATE ON "designs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);
};
