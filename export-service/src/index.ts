import Redis from "ioredis";
import { Client as DBClient } from "pg";
import {
  CreateBucketCommand,
  CreateBucketCommandInput,
  GetObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class UploadFileResponse {
  filename: string;

  mimetype: string;

  encoding: string;

  url: string;
}
const awsPrefix = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/`;

const main = async () => {
  if (
    process.env.AWS_ACCESS_KEY === undefined ||
    process.env.AWS_SECRET === undefined ||
    process.env.S3_REGION === undefined ||
    process.env.S3_BUCKET === undefined
  ) {
    throw new Error("Missing environment variables for aws");
  }
  const s3Client = new S3Client({
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET!,
    },
  });
  const buckets = (
    await s3Client.send(new ListBucketsCommand({}))
  ).Buckets?.map((b) => b.Name);
  if (!buckets?.includes(process.env.S3_BUCKET)) {
    const createBucketParams: CreateBucketCommandInput = {
      Bucket: process.env.S3_BUCKET,
    };
    const createBucket = new CreateBucketCommand(createBucketParams);
    await s3Client.send(createBucket);
  }
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
    dbClient.query(
      {
        text: 'select username, title, "time", time_of_completion from public.user u join task t on u.id = t.user_id_id join completed_task c on t.id = c.task_id_id where u.id = $1',
        values: [message],
      },
      async (_, res) => {
        // console.log(JSON.stringify(res.rows));
        const rawData = Buffer.from(JSON.stringify(res.rows));
        const awsKey = `data-${Date.now()}.json`;
        await new Promise<UploadFileResponse>((resolve, reject) => {
          const uploadParams: PutObjectCommandInput = {
            Bucket: process.env.S3_BUCKET,
            Key: awsKey,
            Body: rawData,
          };
          const obj = new PutObjectCommand(uploadParams);
          return s3Client
            .send(obj)
            .then((res) => {
              console.log("aws res", res);
              resolve({
                filename: "",
                encoding: "",
                mimetype: "",
                url: awsPrefix + awsKey,
              });
            })
            .catch((e) => {
              console.log(e);
              reject(e);
            });
        });
        const signedUrl = await new Promise<string>((resolve, reject) => {
          const getObject = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: awsKey,
          });
          getSignedUrl(s3Client, getObject)
            .then((url) => {
              resolve(url);
            })
            .catch((err) => reject(err));
        });
        console.log(signedUrl);
        serviceRedisPub.publish(
          "export_service_send",
          `${message}|${signedUrl}`
        );
        //getSignedUrl()
        //console.log(res1);
      }
    );
  });
  serviceRedisSub.subscribe("export_service_rec");
};

main();
