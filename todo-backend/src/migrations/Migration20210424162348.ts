import { Migration } from '@mikro-orm/migrations';

export class Migration20210424162348 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "mood" add column "created_at" timestamptz(0) not null;');
  }

}
