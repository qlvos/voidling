

CREATE ROLE cat_agent_db_user WITH LOGIN PASSWORD 'REPLACE_ME';

-- Grant privileges
GRANT CONNECT ON DATABASE cat_agent_db TO cat_agent_db_user;
GRANT USAGE ON SCHEMA public TO cat_agent_db_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cat_agent_db_user;
GRANT USAGE, SELECT ON SEQUENCE buys_id_seq TO cat_agent_db_user;
GRANT USAGE, SELECT ON SEQUENCE sells_id_seq TO cat_agent_db_user;

-- Apply privileges to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cat_agent_db_user;


