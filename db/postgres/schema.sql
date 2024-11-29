

CREATE ROLE voidling_db_user WITH LOGIN PASSWORD 'REPLACE_ME';

-- Grant privileges
GRANT CONNECT ON DATABASE voidlig_db TO voidling_db_user;
GRANT USAGE ON SCHEMA public TO voidling_db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE buys_id_seq TO voidling_db_user;
GRANT USAGE, SELECT ON SEQUENCE sells_id_seq TO voidling_db_user;

-- Apply privileges to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO voidling_db_user;


