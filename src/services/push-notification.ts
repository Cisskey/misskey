import * as push from 'web-push';
import config from '../config';
import { SwSubscriptions } from '../models';
import { fetchMeta } from '../misc/fetch-meta';
import { PackedNotification } from '../models/repositories/notification';
import { PackedMessagingMessage } from '../models/repositories/messaging-message';
import { postWebhookJob } from '../queue';
import { UserProfiles } from '../models';
import { ensure } from '../prelude/ensure';

export const notification = ['notification', 'unreadMessagingMessage'] as const;
export type notificationType = typeof notification[number];
export type notificationBody = PackedNotification | PackedMessagingMessage;

export default async function(userId: string, type: notificationType, body: notificationBody) {
	const meta = await fetchMeta();

	const profile = await UserProfiles.findOne({userId: userId}).then(ensure);
	if (meta.enableWebhookNotification && profile.enableWebhookNotification && profile.webhookUrl != null) {
		postWebhookJob(userId, type, body);
	}

	if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;

	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.find({
		userId: userId
	});

	for (const subscription of subscriptions) {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.publickey
			}
		};

		push.sendNotification(pushSubscription, JSON.stringify({
			type, body
		}), {
			proxy: config.proxy
		}).catch((err: any) => {
			//swLogger.info(err.statusCode);
			//swLogger.info(err.headers);
			//swLogger.info(err.body);

			if (err.statusCode === 410) {
				SwSubscriptions.delete({
					userId: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey
				});
			}
		});
	}
}
