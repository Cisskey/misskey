export class WebhookNotification1598986920665 {
    name = 'WebhookNotification1598986920665'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "enableWebhookNotification" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "webhookUrl" character varying(256)`);
        await queryRunner.query(`CREATE INDEX "IDX_f0c7bece0ceafad7b18c34cbb8" ON "user_profile" ("enableWebhookNotification") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_f0c7bece0ceafad7b18c34cbb8"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "webhookUrl"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "enableWebhookNotification"`);
    }

}
