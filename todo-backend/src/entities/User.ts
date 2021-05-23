import {
  Cascade,
  Collection,
  Entity,
  LoadStrategy,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
import { Task } from "./Task";

@ObjectType()
@Entity()
export class User {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({ unique: true })
  username!: string;

  @Property()
  password!: string;

  @Field()
  @Property({ unique: true })
  email!: string;

  @OneToMany(() => Task, (task) => task.userId, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  tasks = new Collection<Task>(this);
}
