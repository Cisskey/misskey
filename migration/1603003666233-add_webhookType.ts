import {MigrationInterface, QueryRunner} from "typeorm";

export class addWebhookType1603003666233 implements MigrationInterface {
    name = 'addWebhookType1603003666233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "user_profile_webhooktype_enum" AS ENUM('slack', 'bot')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "webhookType" "user_profile_webhooktype_enum" NOT NULL DEFAULT 'slack'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "webhookType"`);
        await queryRunner.query(`DROP TYPE "user_profile_webhooktype_enum"`);
    }

}
