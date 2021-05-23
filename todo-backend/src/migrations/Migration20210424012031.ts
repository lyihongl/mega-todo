import { Migration } from '@mikro-orm/migrations';

export class Migration20210424012031 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "task" add column "enabled" bool not null;');
  }

}
