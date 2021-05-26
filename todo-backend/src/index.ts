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

// interface ServiceTypeMap {
//   [serviceType: string]: RedisService[];
// }
interface IRedisServices {
  services: Record<string, RedisService[]>;
  serviceIds: Set<string>;
}

interface IRedisServiceRegistrar {
  serviceData: IRedisServices;
  send: (type: string, message: string) => void;
  registerHandler: (
    type: string,
    callback: (channel: string, message: string) => any
  ) => any;
  handlers: Record<string, (channel: string, message: string) => any>;
  roundRobinner: Record<string, number>;
}

const main = async () => {
  //const redisClient = redis.createClient();
  const redisSROptions: Redis.RedisOptions = {
    host: process.env.REDIS_SR ? process.env.REDIS_SR : "localhost",
    port: 6380,
    retryStrategy: () => 3000,
  };
  console.log(
    "6380: ",
    process.env.REDIS_PUBSUB ? process.env.REDIS_PUBSUB : "localhost"
  );

  const redisSRSub = new Redis(redisSROptions);
  const redisSR = new Redis(redisSROptions);

  const RedisServices: IRedisServices = {
    services: {},
    serviceIds: new Set(),
  };
  redisSRSub.on("message", async (channel: string, message: string) => {
    if (channel === "new_service") {
      const serviceData = await redisSR.get(message);
      const split = serviceData!.split("|");
      if (split.length == 5 && !RedisServices.serviceIds.has(message)) {
        if (!RedisServices.services[split[2]]) {
          RedisServices.services[split[2]] = [];
        }
        const redisOptions: Redis.RedisOptions = {
          host: split[3],
          port: parseInt(split[4]),
          retryStrategy: () => 100,
        };
        RedisServices.services[split[2]].push({
          listeningOn: split[0],
          sendingOn: split[1],
          pubclient: new Redis(redisOptions),
          subclient: new Redis(redisOptions),
        });
        RedisServices.serviceIds.add(message);
        console.log("added service", message);
      }
    }
  });
  const redisKeys = await redisSR.keys("*");
  await Promise.all(
    redisKeys.map((key) => {
      return new Promise<Boolean>((resolve, reject) => {
        redisSR.get(key).then((message) => {
          console.log("message: ", message);
          const split = message!.split("|");
          if (split.length == 5 && !RedisServices.serviceIds.has(key)) {
            if (!RedisServices.services[split[2]]) {
              RedisServices.services[split[2]] = [];
            }
            const redisOptions: Redis.RedisOptions = {
              host: split[3],
              port: parseInt(split[4]),
              retryStrategy: () => 100,
            };
            RedisServices.services[split[2]].push({
              listeningOn: split[0],
              sendingOn: split[1],
              pubclient: new Redis(redisOptions),
              subclient: new Redis(redisOptions),
            });
            console.log("adding");
            RedisServices.serviceIds.add(key);
          }
          resolve(true);
        });
      });
    })
  );
  console.log(util.inspect(RedisServices, { depth: null }));
  redisSRSub.subscribe("new_service");
  const redisRegistar: IRedisServiceRegistrar = {
    serviceData: RedisServices,
    handlers: {},
    send: (type: string, message: string) => {
      const max = redisRegistar.serviceData.services[type].length;
      redisRegistar.serviceData.services[type][
        redisRegistar.roundRobinner[type]
      ].pubclient.publish(
        redisRegistar.serviceData.services[type][
          redisRegistar.roundRobinner[type]
        ].listeningOn,
        message
      );
      console.log(
        "sending on: ",
        redisRegistar.serviceData.services[type][
          redisRegistar.roundRobinner[type]
        ].listeningOn
      );
      redisRegistar.roundRobinner[type] =
        redisRegistar.roundRobinner[type] % max;
    },
    registerHandler: (
      type: string,
      callback: (channel: string, message: string) => any
    ) => {
      redisRegistar.serviceData.services[type][
        redisRegistar.roundRobinner[type]
      ].subclient.subscribe(
        redisRegistar.serviceData.services[type][0].sendingOn
      );
      redisRegistar.handlers[type] = callback;
      redisRegistar.serviceData.services[type][
        redisRegistar.roundRobinner[type]
      ].subclient.on("message", (channel, message) => {
        redisRegistar.handlers[type](channel, message);
      });
    },
    roundRobinner: {},
  };
  console.log(Object.keys(RedisServices.services));
  Object.keys(RedisServices.services).forEach(
    (e) => (redisRegistar.roundRobinner[e] = 0)
  );
  // redisRegistar.send("export_service", "testing");
  // RedisServices.services.serviceType
  //   .keys()
  const redisOptions: Redis.RedisOptions = {
    host: process.env.REDIS_PUBSUB ? process.env.REDIS_PUBSUB : "localhost",
    port: 6379,
    retryStrategy: () => 3000,
  };
  const redisPubSub = new RedisPubSub({
    publisher: new Redis(redisOptions),
    subscriber: new Redis(redisOptions),
  });
  redisRegistar.registerHandler("export_service", (channel, message) => {
    const notif = message.split("|");
    redisPubSub.publish(notif[0], notif[1]);
    //console.log("handler", message);
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
