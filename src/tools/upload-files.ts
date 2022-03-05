import * as fs from 'fs';
import * as S3 from 'aws-sdk/clients/s3';
import * as rename from 'rename';
import { getRepository } from 'typeorm';
import { initDb } from '../db/postgre';
import { contentDisposition } from '../misc/content-disposition';
import { detectType } from '../misc/get-file-info';
import { InternalStorage } from '../services/drive/internal-storage';
import { DriveFile } from '../models/entities/drive-file';

async function main(lastId) {
	await initDb();
	const DriveFiles = getRepository(DriveFile);
	const s3 = getS3();

	while (true) {
		const query = DriveFiles.createQueryBuilder('file');
		query.where('file.storedInternal = :storedInternal', { storedInternal: true });
		if (lastId) {
			query.andWhere('file.id > :lastId', { lastId: lastId });
		}
		query.orderBy('file.id', 'ASC').limit(20);
		const files = await query.getMany();
		if (files.length === 0) return;
		for (const file of files) {
			console.log(`Uploading ${file.id}`);
			await uploadFile(s3, file);
			lastId = file.id;
		}
	}
}

function getS3() {
	return new S3({
		endpoint: process.env['OBJECT_STORAGE_ENDPOINT'],
		accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
		secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
		region: process.env['AWS_REGION'],
		sslEnabled: true,
		s3ForcePathStyle: process.env['OBJECT_STORAGE_FORCE_PATH_STYLE'] == '1',
	});
}

async function uploadFile(s3: S3, file: DriveFile) {
	const uploads = [
		upload(s3, file, file.accessKey)
	];
	if (file.webpublicUrl) {
		uploads.push(upload(s3, file, file.webpublicAccessKey, '-web'));
	}
	if (file.thumbnailUrl) {
		uploads.push(upload(s3, file, file.thumbnailAccessKey, '-thumb'));
	}
	await Promise.all(uploads);
}

async function upload(s3: S3, file: DriveFile, key: string, suffix?: string) {
	try {
		await s3.headObject({
			Bucket: process.env['OBJECT_STORAGE_BUCKET'],
			Key: process.env['OBJECT_STORAGE_PREFIX'] + key,
		}).promise();
		console.log(`Object "${key}" is already exists. Skipping upload...`);
	} catch (err) {
		if (err.code !== 'NotFound') throw err;
	}

	let filename = file.name;
	let type = file.type;

	if (suffix) {
		const { mime, ext } = await detectType(InternalStorage.resolvePath(key));
		type = mime;
		filename = rename(filename, {
			suffix: suffix,
			extname: ext ? `.${ext}` : undefined
		}).toString();
	}
	if (type === 'image/apng') type = 'image/png';

	const upload = s3.upload({
		Bucket: process.env['OBJECT_STORAGE_BUCKET'],
		Key: process.env['OBJECT_STORAGE_PREFIX'] + key,
		Body: fs.createReadStream(InternalStorage.resolvePath(key)),
		ContentType: type,
		CacheControl: 'max-age=31536000, immutable',
		ContentDisposition: contentDisposition('inline', filename),
	}, {
		partSize: 8 * 1024 * 1024,
	});

	return await upload.promise();
}

const args = process.argv.slice(2);

main(args[0]).then(() => {
	console.log('Success');
	process.exit(0);
}).catch(e => {
	console.error(`Error: ${e.message || e}`);
	process.exit(1);
});
