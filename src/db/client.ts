import { config } from "dotenv";
import { Client } from "pg";

config();

export const client = new Client({
  host: process.env.DATABASE_URL,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  database: "postgres",
});
