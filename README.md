# Lend And Learn

## Description

Backend for web application Lend And Learn that handles devices reservations for users from FIT CTU. Built with Nest, Typescript and PostgreSQL.

## Running the app with npm
Before running the app with npm, database must be running on port 5432. Database can be run with docker.
```bash
# run database with docker
$ docker-compose up database
```
If you run only database with docker and backend with npm, change host configuration
from 'database' to 'localhost' in *app.module.ts* file.

Then start app with npm:
```bash
# install
$ npm install

# run in development
$ npm run start

# run in watch mode
$ npm run start:dev
```

## Running the app with docker
Run commands inside project folder.

```bash
# run
$ docker-compose up
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```
