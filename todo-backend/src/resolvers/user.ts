import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { User } from "../entities/User";
import { jwt_secret, __prod__ } from "../constants";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => UserResponse, { nullable: true })
  async me(@Ctx() { jwtUserId, em, res }: MyContext) {
    console.log(jwtUserId?.userId);
    if (jwtUserId?.userId) {
      console.log("here");
      const user = await em.findOne(User, { id: jwtUserId.userId });
      if (user) {
        const token = jwt.sign(
          {
            userId: user.id,
          },
          jwt_secret,
          { expiresIn: 60 * 60 * 24 * 30 }
        );

        res.cookie("jwt", token, {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          secure: __prod__,
          sameSite: "lax",
          httpOnly: false,
          domain: "localhost",
          path: "/",
        });
        return { user };
      }
      return null;
    }
    return null;
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("options") options: UsernamePasswordInput,
    @Arg("email") email: String,
    @Ctx() { em, res }: MyContext
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
      email: email,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      if (err.constraint === "user_username_unique") {
        return {
          errors: [
            {
              field: "username",
              message: err.detail,
            },
          ],
        };
      } else if (err.constraint === "user_email_unique") {
        return {
          errors: [
            {
              field: "email",
              message: err.detail,
            },
          ],
        };
      }
    }
    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwt_secret,
      { expiresIn: 60 * 60 * 24 * 30 }
    );

    res.cookie("jwt", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: __prod__,
      sameSite: "lax",
      httpOnly: false,
      domain: "localhost",
      path: "/",
    });
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, res, jwtUserId }: MyContext,
    @PubSub() pubsub: PubSubEngine
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });

    if (user) {
      await pubsub.publish(`${user.id}`, { name: "test" });
    }

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "user does not exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    if (jwtUserId) {
      console.log(jwtUserId);
    }
    const token = jwt.sign(
      {
        userId: user.id,
      },
      jwt_secret,
      { expiresIn: 60 * 60 * 24 * 30 }
    );

    res.cookie("jwt", token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: __prod__,
      sameSite: "lax",
      httpOnly: false,
      domain: "localhost",
      path: "/",
    });

    return {
      user,
    };
  }
  @Mutation(() => String)
  async deleteUser(@Ctx() { em, res, jwtUserId }: MyContext) {
    if (jwtUserId) {
      // em.
      const user = await em
        .getRepository(User)
        .findOneOrFail({ id: jwtUserId?.userId });
      await em.getRepository(User).remove(user!).flush();
    }
    return "ok";
  }
}
