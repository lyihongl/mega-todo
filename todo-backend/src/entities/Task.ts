import {
  Cascade,
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { CompletedTask } from "./CompletedTask";
import { User } from "./User";

@ObjectType()
@Entity()
export class Task {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({ columnType: "varchar(255)" })
  title!: string;

  @Field()
  @Property()
  time!: number;

  @Field()
  @Property()
  enabled: boolean;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: "cascade" })
  userId!: User;

  @Field(() => [CompletedTask])
  @OneToMany(() => CompletedTask, (task) => task.taskId, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
    strategy: LoadStrategy.JOINED,
  })
  CompletedTasks = new Collection<CompletedTask>(this);
}
