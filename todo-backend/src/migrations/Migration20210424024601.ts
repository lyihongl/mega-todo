import { Migration } from '@mikro-orm/migrations';

export class Migration20210424024601 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "task" add column "created_at" timestamptz(0) not null, add column "updated_at" timestamptz(0) not null;');
  }

}
