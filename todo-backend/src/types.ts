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
import { Redis } from "ioredis";
import { RedisClient } from "redis";
import { ExecutionParams } from "subscriptions-transport-ws";

export type MyJwt = {
  userId: number;
  iat: number;
  exp: number;
};

export interface IRedisServices {
  services: Record<string, RedisService[]>;
  serviceIds: Set<string>;
}

export interface IRedisServiceRegistrar {
  serviceData: IRedisServices;
  send: (type: string, message: string) => void;
  registerHandler: (
    type: string,
    callback: (channel: string, message: string) => any
  ) => any;
  handlers: Record<string, (channel: string, message: string) => any>;
  roundRobinner: Record<string, number>;
}

export type MyContext = {
  em: SqlEntityManager<PostgreSqlDriver> &
    EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  // redisClient?: RedisClient;
  serviceRegister: IRedisServiceRegistrar
  jwtUserId: MyJwt | null;
  pubsub: PubSub;
  connection: ExecutionParams<any>;
};

export type RedisService = {
  pubclient: Redis;
  subclient: Redis;
  listeningOn: string;
  sendingOn: string;
  data?: string;
};
