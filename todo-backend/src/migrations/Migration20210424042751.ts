import { Migration } from '@mikro-orm/migrations';

export class Migration20210424042751 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "mood" ("id" serial primary key, "mood" varchar(2045) not null);');
  }

}
