export class webhookInstanceSetting1599309954647 {
    name = 'webhookInstanceSetting1599309954647'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableWebhookNotification" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableWebhookNotification"`);
    }

}
