import { Migration } from '@mikro-orm/migrations';

export class Migration20210424211659 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "mood" add column "user_id_id" int4 not null;');

    this.addSql('alter table "mood" add constraint "mood_user_id_id_foreign" foreign key ("user_id_id") references "user" ("id") on update cascade;');
  }

}
