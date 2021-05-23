import { Mood } from "../entities/Mood";
import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

@Resolver()
export class MoodResolver {
  @Mutation(() => String)
  async addMood(
    @Arg("mood") mood: String,
    @Ctx() { em, jwtUserId }: MyContext
  ) {
    if (jwtUserId?.userId) {
      const newMood = em.create(Mood, {
        mood,
        userId: jwtUserId.userId,
      });
      await em.persistAndFlush(newMood);
    }
    return "ok";
  }
}
