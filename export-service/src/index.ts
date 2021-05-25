import Redis from "ioredis";
import { Client as DBClient } from "pg";

const main = () => {
  const dbClient = new DBClient({
    host: process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "test",
  });
  dbClient.connect().then(() => console.log("connected"));
  const redisSROptions: Redis.RedisOptions = {
    host: process.env.REDIS_PUBSUB ? process.env.REDIS_PUBSUB : "localhost",
    port: 6380,
    retryStrategy: () => 3000,
  };
  const serviceOptions: Redis.RedisOptions = {
    host: process.env.REDIS_SERVICE ? process.env.REDIS_SERVICE : "localhost",
    port: 6381,
    retryStrategy: () => 3000,
  };
  const redisSR = new Redis(redisSROptions);
  const serviceRedisSub = new Redis(serviceOptions);
  const serviceRedisPub = new Redis(serviceOptions);
  redisSR.set(
    "export_service",
    `export_service_rec|export_service_send|export_service|${
      process.env.REDIS_SERVICE ? process.env.REDIS_SERVICE : "localhost"
    }|6381`
  );
  redisSR.publish("new_service", "export_service");
  serviceRedisSub.on("message", (channel, message) => {
    console.log("ok");
    console.log(channel, message);
    dbClient.query("select * from public.user where ", (err, res) => {
      console.log(res);
    });
  });
  serviceRedisSub.subscribe("export_service_rec");
  serviceRedisPub.publish("export_service_send", "test");
};

main();
