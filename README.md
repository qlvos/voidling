# voidling
This is a mono repository containing all the components that makes up the Voidling agentic memecoin index manager. The Voidling is a character within the wider Voidlings universe, initially spawned by the Reaper of the Reaper's Gambit project (https://www.reapersgambit.com).

The application is dockerized and consists of the following services:

| Service  | Description  |  Tech stack
| ------------ | ------------ |  ------------ 
|  frontend | The Voidling website.  | Vanilla JavaScript
|  backend | Contains the backend for the website as well as the AI model interactions. | NodeJS / JavaScript
|  trader | Contains the on-chain interactions to trade tokens on the Voidling memecoin index. | NodeJS / JavaScript
|  telegrambot | Contains the Voidling Telegram interactions.  | NodeJS / JavaScript
|  postgres | Data storage.   | Postgres
|  redis | Used as pub/sub message bus for the intra service communication. | Redis
|  adminer |  Database administration UI. | n/a

## General information
The instructions in this document are high level and does not cover all the technical implementation details. In order to setup and use the project it will be necessary to have the skills to inspect the code and adapt it to your specific environment.

Environment variables are used for much of the configuration, and the complete list of variables used can be located in the docker compose files under the environment section.

To separate dev/test/prod settings the NODE_ENV value is used, and the parameters are read from the /config/config.js file within each service.

## Installation

- Set all the environment variables which are listed inside docker-compose.yml for each service on your system.
- One time activity to initialize the postgres database:
	- Start the postgres container
``docker compose -f docker-compose.yml up --build postgres``
	- Access the postgres container with a shell and create the database
`` psql -U postgres``
`` CREATE DATABASE voidling_db ``
	- Copy and run the SQL from /db/postgres/schema.sql

- Run with test settings:
``docker compose -f docker-compose.dev.yml up --build``
- Run with production settings: 
``docker compose -f docker-compose.yml up --build``


## License

voidling is licensed under the terms of the GNU General Public License v3.0. For more information, see <a href="LICENSE">LICENSE</a> file.

## Contact
You can get in touch with us on X (<a href="https://x.com/figure31_">figure31</a>, <a href="https://x.com/psueded">psueded</a>).
