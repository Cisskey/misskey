import { DriveFile } from '@/models/entities/drive-file';
import { User } from '@/models/entities/user';
import { IActivity } from '@/remote/activitypub/type';
import * as httpSignature from 'http-signature';
import { notificationType, notificationBody } from '../services/push-notification';
import { webhookType } from '../types';

export type DeliverJobData = {
	/** Actor */
	user: ThinUser;
	/** Activity */
	content: unknown;
	/** inbox URL to deliver */
	to: string;
};

export type InboxJobData = {
	activity: IActivity;
	signature: httpSignature.IParsedSignature;
};

export type DbJobData = DbUserJobData | DbUserImportJobData;

export type DbUserJobData = {
	user: ThinUser;
};

export type DbUserImportJobData = {
	user: ThinUser;
	fileId: DriveFile['id'];
};

export type ObjectStorageJobData = ObjectStorageFileJobData | {};

export type ObjectStorageFileJobData = {
	key: string;
};

export type ThinUser = {
	id: User['id'];
};

export type PostWebhookJobData = {
	userId: string,
	type: notificationType,
	body: notificationBody,
	url: string,
	jsonType: webhookType,
	secret: string | null,
};
