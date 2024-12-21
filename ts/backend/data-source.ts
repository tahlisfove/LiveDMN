import { DataSource } from "typeorm";
import { RequestLog } from "./entities/RequestLog";

// Create a connection to the database using TypeORM
export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "request",
  synchronize: true,
  // true displays data on terminal
  logging: false,
  entities: [RequestLog],
  migrations: [],
});