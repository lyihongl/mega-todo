import {
  Arg,
  Args,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
} from "type-graphql";
import { LoadStrategy, wrap } from "@mikro-orm/core";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { CompletedTask } from "../entities/CompletedTask";
import { MyContext } from "../types";
import { asyncForEach } from "../utils/utils";

@ObjectType()
class TaskResponse {
  @Field()
  id: Number;
  @Field()
  title: String;
  @Field()
  time: Number;
  @Field({ defaultValue: false })
  completed: Boolean;
}

@InputType()
class CreateTaskInput {
  @Field()
  title: string;

  @Field(() => Int)
  time: number;
}

@Resolver()
export class TaskResolver {
  @Query(() => [TaskResponse])
  async getTasks(@Ctx() { em, res, jwtUserId }: MyContext) {
    if (jwtUserId) {
      console.log("ok");
      const qb = em.createQueryBuilder(Task);
      const qb1 = em.createQueryBuilder(CompletedTask);
      try {
        qb.select("*").where({
          $and: [
            {
              userId: jwtUserId.userId,
            },
            {
              enabled: true,
            },
          ],
        });
        const tasks: Task[] = await qb.execute();
        // let completedTasks: CompletedTask[] = [];
        let completedTasks: { [id: number]: CompletedTask[] } = {};

        const now = new Date(Date.now());
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        // const test = await em.find(Task, {
        //   $and: [
        //     {CompletedTasks: { timeOfCompletion: { $gte: today } }},
        //     {
        //       userId: jwtUserId.userId,
        //     },
        //   ],
        // });
        // console.log("test orm: ", test)
        await asyncForEach(tasks, async (task) => {
          qb1.select("*").where({
            $and: [{ taskId: task.id }, { timeOfCompletion: { $gte: today } }],
          });
          console.log("a");

          const compTasksRes: CompletedTask[] | null = await qb1.execute();
          if (compTasksRes) {
            compTasksRes.forEach((e) => {
              if (!completedTasks[task.id]) {
                completedTasks[task.id] = [];
              }
              completedTasks[task.id].push(e);
            });
          }
          // completedTasks.push(await qb1.execute());
        });
        console.log(tasks);
        console.log(completedTasks);
        const response: TaskResponse[] = tasks.map((e) => {
          return {
            id: e.id,
            title: e.title,
            time: e.time,
            completed: e.id in completedTasks,
          };
        });
        return response;
      } catch (err) {
        console.log(err);
        return [];
      }
    }
    return [];
  }
  @Query(() => String)
  async testNotif(
    @Ctx() { jwtUserId }: MyContext,
    @PubSub() pubsub: PubSubEngine
  ) {
    console.log("pre publish", jwtUserId);
    if (jwtUserId?.userId) {
      console.log("publishing");
      await pubsub.publish(`${jwtUserId.userId}`, {
        name: `${jwtUserId.userId}`,
        info: "testing info",
        desc: "testing desc",
      });
    }
    return "ok";
  }
  @Mutation(() => String)
  async createTask(
    @Arg("taskInfo") taskInfo: CreateTaskInput,
    @Ctx() { em, res, jwtUserId }: MyContext
  ) {
    console.log("create task", taskInfo);
    if (jwtUserId) {
      // const user = new User();
      // user.id = jwtUserId.userId;
      const newTask = em.create(Task, {
        title: taskInfo.title,
        userId: jwtUserId.userId,
        time: taskInfo.time,
        enabled: true,
      });

      await em.persistAndFlush(newTask);
    }
    return "ok";
  }
  @Mutation(() => String)
  async deleteTask() {
    return "ok";
  }
  @Mutation(() => String)
  async completeTask(
    @Arg("taskid", () => Int) taskid: number,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      const now = new Date(Date.now());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existing = await em.findOne(CompletedTask, {
        $and: [{ taskId: taskid }, { timeOfCompletion: { $gte: today } }],
      });
      if (!existing) {
        const completedTask = em.create(CompletedTask, {
          timeOfCompletion: Date.now(),
          taskId: taskid,
        });
        await em.persistAndFlush(completedTask);
      }
    }
    return "ok";
  }
  @Mutation(() => String)
  async disableTask(
    @Arg("taskid", () => Int) taskid: number,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId) {
      const task = await em.findOne(Task, { id: taskid });
      if (task) {
        task.enabled = false;
      }
      await em.flush();
    }
    return "ok";
  }
}
