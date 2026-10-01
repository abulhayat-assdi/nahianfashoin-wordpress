-- Add consignment_id to orders table (Steadfast courier parcel ID)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "consignment_id" TEXT;
