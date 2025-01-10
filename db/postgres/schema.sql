
\connect "voidling_db";

-- Adminer 4.8.1 PostgreSQL 16.4 (Ubuntu 16.4-1.pgdg22.04+2) dump

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
    "tokenusdvalue" numeric,
    CONSTRAINT "sells_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "watchlist";
CREATE TABLE "public"."watchlist" (
    "name" character varying,
    "symbol" character varying NOT NULL,
    "address" character varying NOT NULL,
    CONSTRAINT "watchlist_address" UNIQUE ("address")
) WITH (oids = false);

DROP TABLE IF EXISTS "featureflags";
CREATE TABLE "public"."featureflags" (
    "key" character varying NOT NULL,
    "value" boolean NOT NULL,
    CONSTRAINT "featureflags_key" UNIQUE ("key")
) WITH (oids = false);

DROP TABLE IF EXISTS "whitelist";
CREATE TABLE "public"."whitelist" (
    "wallet" character varying NOT NULL
) WITH (oids = false);

DROP TABLE IF EXISTS "asset";
CREATE TABLE "public"."asset" (
    "address" character varying NOT NULL,
    "network" character varying NOT NULL,
    "totalsupply" bigint,
    "name" character varying,
    "symbol" character varying,
    "created" character varying,
    "xprofile" character varying,
    "github" character varying,
    CONSTRAINT "asset_address" PRIMARY KEY ("address")
) WITH (oids = false);

DROP TABLE IF EXISTS "indexassets";
CREATE TABLE "public"."indexassets" (
    "index" character varying NOT NULL,
    "asset" character varying NOT NULL,
    CONSTRAINT "indexassets_index_asset" UNIQUE ("index", "asset")
) WITH (oids = false);

ALTER TABLE ONLY "public"."indexassets" ADD CONSTRAINT "indexassets_asset_fkey" FOREIGN KEY (asset) REFERENCES asset(address) NOT DEFERRABLE;
CREATE ROLE voidling_db_user WITH LOGIN PASSWORD 'REPLACE_ME';

-- Grant privileges
GRANT CONNECT ON DATABASE voidling_db TO voidling_db_user;
GRANT USAGE ON SCHEMA public TO voidling_db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE buys_id_seq TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE sells_id_seq TO voidling_db_user;

-- Apply privileges to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO voidling_db_user;


