const { Pool } = require("pg");
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@cuidarteplus-postgres-ev:5432/cuidarteplus";

const pool = new Pool({ connectionString });

module.exports = { pool };
