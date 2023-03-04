export class addWebhookSecretColumn1603256087263 {
    name = 'addWebhookSecretColumn1603256087263'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "webhookSecret" character varying(128)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "webhookSecret"`);
    }

}
