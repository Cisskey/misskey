import config from '@/config';
import { initialize as initializeQueue } from './initialize';
import { DeliverJobData, InboxJobData, DbJobData, ObjectStorageJobData, PostWebhookJobData } from './types';

export const deliverQueue = initializeQueue<DeliverJobData>('deliver', config.deliverJobPerSec || 128);
export const inboxQueue = initializeQueue<InboxJobData>('inbox', config.inboxJobPerSec || 16);
export const dbQueue = initializeQueue<DbJobData>('db');
export const objectStorageQueue = initializeQueue<ObjectStorageJobData>('objectStorage');
export const webhookQueue = initializeQueue<PostWebhookJobData>('webhook', config.webhookJobPerSec || 1, 1000, 'userId');

