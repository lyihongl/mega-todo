import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { Task } from "./Task";

@ObjectType()
@Entity()
export class CompletedTask {
  @Field()
  @PrimaryKey()
  id!: number;
  @Field()
  @Property({ type: "date" })
  timeOfCompletion!: Date;

  @Field()
  @ManyToOne()
  taskId!: Task;
}
