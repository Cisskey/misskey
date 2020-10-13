import {MigrationInterface, QueryRunner} from "typeorm";

export class addFeaturedNgWord1602079745193 implements MigrationInterface {
    name = 'addFeaturedNgWord1602079745193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "featuredNgWords" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "featuredNgWords"`);
    }

}
