import {
  EntityManager,
  IDatabaseDriver,
  Connection,
  EntityName,
} from "@mikro-orm/core";
import {
  PostgreSqlDriver,
  QueryBuilder,
  SqlEntityManager,
} from "@mikro-orm/postgresql";
import { PubSub } from "apollo-server-express";
import { Request, Response } from "express";
import { RedisClient } from "redis";
import { ExecutionParams } from "subscriptions-transport-ws";

export type MyJwt = {
  userId: number;
  iat: number;
  exp: number;
};

export type MyContext = {
  em: SqlEntityManager<PostgreSqlDriver> &
    EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  redisClient?: RedisClient;
  jwtUserId: MyJwt | null;
  pubsub: PubSub;
  connection: ExecutionParams<any>;
};

export type RedisService = {
  listeningOn: string;
  sendingOn: string;
  data?: string;
};
