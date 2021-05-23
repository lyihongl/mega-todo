import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { jwt_secret, __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";

import { buildSchema, PubSub, PubSubEngine } from "type-graphql";
import { execute, graphql, subscribe } from "graphql";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { ExportCompleteNotificationResolver } from "./resolvers/notification";
import { createServer } from "http";
import { TaskResolver } from "./resolvers/task";
import Redis from "ioredis";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { MoodResolver } from "./resolvers/mood";
import { RedisService } from "./types";
import util from "util";

// import { Kafka } from "kafkajs";

interface ServiceTypeMap {
  [serviceType: string]: RedisService[];
}
interface IRedisServices {
  services: ServiceTypeMap;
  serviceIds: Set<string>;
}

const main = async () => {
  //const redisClient = redis.createClient();
  const redisSROptions: Redis.RedisOptions = {
    host: process.env.REDIS_PUBSUB ? process.env.REDIS_PUBSUB : "localhost",
    port: 6380,
    retryStrategy: () => 3000,
  };

  const redisSRSub = new Redis(redisSROptions);
  const redisSR = new Redis(redisSROptions);

  const RedisServices: IRedisServices = {
    services: {},
    serviceIds: new Set(),
  };
  redisSR.keys("*").then((res) => {
    res.forEach((key) =>
      redisSR.get(key).then((message) => {
        const split = message!.split("|");
        if (split.length == 3 && !RedisServices.serviceIds.has(key)) {
          if (!RedisServices.services[split[2]]) {
            RedisServices.services[split[2]] = [];
          }
          RedisServices.services[split[2]].push({
            listeningOn: split[0],
            sendingOn: split[1],
          });
          RedisServices.serviceIds.add(key);
        }
      })
    );
  });
  redisSRSub.on("message", async (channel: string, message: string) => {
    const serviceData = await redisSR.get(message);
    const split = serviceData!.split("|");
    if (split.length == 3 && !RedisServices.serviceIds.has(message)) {
      if (!RedisServices.services[split[2]]) {
        RedisServices.services[split[2]] = [];
      }
      RedisServices.services[split[2]].push({
        listeningOn: split[0],
        sendingOn: split[1],
      });
      RedisServices.serviceIds.add(message);
    }
    console.log(util.inspect(RedisServices, { depth: null }));
  });
  redisSRSub.subscribe("new_service");
  const redisOptions: Redis.RedisOptions = {
    host: process.env.REDIS_PUBSUB ? process.env.REDIS_PUBSUB : "localhost",
    port: 6379,
    retryStrategy: () => 3000,
  };
  const redisPubSub = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions),
  });

  // redisClient.on("message", (channel, message) => {
  //   console.log(
  //     "Message: " + message + " on channel: " + channel + " is arrive!"
  //   );
  // });
  // redisClient.subscribe("notification");
  // redisClient.set("key", "value", redis.print)
  // redisClient.get("key", redis.print)
  const orm = await MikroORM.init({ ...mikroConfig, driver: PostgreSqlDriver });
  await orm.getMigrator().up();
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());
  // app.use("/sub");

  const graphqlSchema = await buildSchema({
    resolvers: [
      UserResolver,
      ExportCompleteNotificationResolver,
      TaskResolver,
      MoodResolver,
    ],
    pubSub: redisPubSub,
    validate: false,
  });

  const apolloServer = new ApolloServer({
    subscriptions: {
      path: "/sub",
    },
    schema: graphqlSchema,
    context: ({ req, res, connection }) => ({
      em: orm.em,
      req,
      res,
      connection,
      // redisClient,
      jwtUserId: req.cookies.jwt
        ? jwt.verify(req.cookies.jwt, jwt_secret)
        : null,
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  const server = createServer(app);
  server.listen(4000, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema: graphqlSchema,
        onConnect: (connectionParams: Object, webSocket: WebSocket) => {
          console.log("connected", connectionParams);
          // return { test: connectionParams};
        },
      },
      {
        server: server,
        path: "/sub",
      }
    );
  });
  // const kafkaClient = new Kafka({
  //   clientId: "test",
  //   brokers: ["localhost:29092"],
  // });
  // const admin = kafkaClient.admin()
  // admin.connect()
  // console.log(await admin.listTopics())
  // admin.createTopics({
  //   validateOnly: false,
  //   waitForLeaders: true,
  //   timeout: 2000,
  //   topics: [
  //     {
  //       topic: 'test',
  //       numPartitions: 1,
  //       replicationFactor: 1
  //     }
  //   ]
  // })
  // admin.disconnect()

  // app.listen(4000, () => {
  //   new SubscriptionServer(
  //     {
  //       schema: await buildSchema({
  //         resolvers: [ExportCompleteNotificationResolver],
  //         validate: false,
  //       }),
  //     },
  //     {
  //       server: app,
  //       path: "/subscriptions",
  //     }
  //   );
  // });
};

main();
