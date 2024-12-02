
\connect "voidling_db";

-- Adminer 4.8.1 PostgreSQL 16.6 (Ubuntu 16.6-1.pgdg22.04+1) dump

DROP TABLE IF EXISTS "buys";
DROP SEQUENCE IF EXISTS buys_id_seq;
CREATE SEQUENCE buys_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."buys" (
    "fromaddress" character varying NOT NULL,
    "toaddress" character varying NOT NULL,
    "spentamount" numeric NOT NULL,
    "receivedamount" numeric NOT NULL,
    "receivedamountraw" character varying NOT NULL,
    "timestamp" bigint NOT NULL,
    "id" integer DEFAULT nextval('buys_id_seq') NOT NULL,
    "tokenusdvalue" numeric,
    CONSTRAINT "buys_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "catevent";
CREATE TABLE "public"."catevent" (
    "type" character varying NOT NULL,
    "img" character varying NOT NULL,
    "timestamp" bigint NOT NULL
) WITH (oids = false);


DROP TABLE IF EXISTS "sells";
DROP SEQUENCE IF EXISTS sells_id_seq;
CREATE SEQUENCE sells_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."sells" (
    "id" integer DEFAULT nextval('sells_id_seq') NOT NULL,
    "buyid" integer NOT NULL,
    "profitloss" integer NOT NULL,
    "timestamp" bigint NOT NULL,
    CONSTRAINT "sells_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "watchlist";
CREATE TABLE "public"."watchlist" (
    "name" character varying,
    "symbol" character varying NOT NULL,
    "address" character varying NOT NULL,
    CONSTRAINT "watchlist_address" UNIQUE ("address")
) WITH (oids = false);

CREATE ROLE voidling_db_user WITH LOGIN PASSWORD 'REPLACE_ME';

-- Grant privileges
GRANT CONNECT ON DATABASE voidling_db TO voidling_db_user;
GRANT USAGE ON SCHEMA public TO voidling_db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE buys_id_seq TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE sells_id_seq TO voidling_db_user;

-- Apply privileges to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO voidling_db_user;


