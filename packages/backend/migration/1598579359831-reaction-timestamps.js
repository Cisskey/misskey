export class reactionTimestamps1598579359831 {
    name = 'reactionTimestamps1598579359831'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "reactionTimestamps" jsonb NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "reactionTimestamps"`);
    }

}
