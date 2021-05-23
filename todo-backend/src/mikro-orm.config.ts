import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { __prod__ } from "./constants";
import { CompletedTask } from "./entities/CompletedTask";
import { Mood } from "./entities/Mood";
import { Task } from "./entities/Task";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"), 
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [User, Task, CompletedTask, Mood],
  dbName: "test",
  type: "postgresql",
  user: "postgres",
  password: "postgres",
  host: process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "localhost",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
