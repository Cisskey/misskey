export class addFeaturedNgWord1602079745193 {
    name = 'addFeaturedNgWord1602079745193'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "featuredNgWords" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "featuredNgWords"`);
    }

}
