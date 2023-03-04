export class addWebhookType1603003666233 {
    name = 'addWebhookType1603003666233'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "user_profile_webhooktype_enum" AS ENUM('slack', 'bot')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "webhookType" "user_profile_webhooktype_enum" NOT NULL DEFAULT 'slack'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "webhookType"`);
        await queryRunner.query(`DROP TYPE "user_profile_webhooktype_enum"`);
    }

}
