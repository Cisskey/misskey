import {MigrationInterface, QueryRunner} from "typeorm";

export class addWebhookSecretColumn1603256087263 implements MigrationInterface {
    name = 'addWebhookSecretColumn1603256087263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "webhookSecret" character varying(128)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "webhookSecret"`);
    }

}
