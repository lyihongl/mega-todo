import { rootCertificates } from "node:tls";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

@ObjectType()
class Notification {
  @Field()
  name: String;

  @Field()
  desc?: String;

  @Field()
  info?: String;
}
@Resolver()
export class ExportCompleteNotificationResolver {
  @Subscription({
    topics: ({ args }) => args.topic,
    // topics: "TEST",
    filter: ({ payload, args, context }) => {
      console.log("payload", payload, "args", args, "context", context);
      return true;
    },
  })
  newNotification(
    @Arg("topic") topic: string,
    @Ctx() {}: MyContext,
    @Root() notificationPayload: String
  ): Notification {
    console.log("userid", topic);
    if (!notificationPayload) {
      return {
        name: "ok",
      };
    }
    // redisClient.on("message", (channel, message) => {
    //   console.log(
    //     "Message: " + message + " on channel: " + channel + " is arrive!"
    //   );
    //   return {
    //     name: "redis",
    //     desc: "test",
    //     info: message,
    //   };
    // });
    console.log("notif payload", notificationPayload);
    return {
      name: "redis-notif",
      desc: notificationPayload,
      info: "test",
    };
  }
}
