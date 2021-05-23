import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Mood {
  @Field()
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({ columnType: "varchar(2045)" })
  mood: string;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field()
  @ManyToOne()
  userId: User;
}
