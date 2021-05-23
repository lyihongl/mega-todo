import { Migration } from '@mikro-orm/migrations';

export class Migration20210424025149 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "task" drop column "description";');
  }

}
