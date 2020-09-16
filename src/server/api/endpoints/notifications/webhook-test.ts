import define from '../../define';
import { Notifications, UserProfiles } from '../../../../models';
import { ensure } from '../../../../prelude/ensure';
import { postWebhookJob } from '../../../../queue';
import { fetchMeta } from '../../../../misc/fetch-meta';
import { ApiError } from '../../../api/error';

export const meta = {
	desc: {
		'ja-JP': 'Webhook 通知のテストします。',
	},

	tags: ['notifications'],

	requireCredential: true as const,

	kind: 'read:notifications',

	errors: {
		instanceDisableWebhookNotification: {
			message: 'This instance disable Webhook notification.',
			code: 'INSTANCE_DISABLE_WEBHOOK_NOTIFICATION',
			id: '2e0cca8e-f95b-435b-b082-1826543cd3ea',
			kind: 'server' as const,
		},

		emptyWebhookUrl: {
			message: 'Webhook URL is empty.',
			code: 'EMPTY_WEBHOOK_URL',
			id: '3a1de390-e88c-469b-98d4-037457ee5d89',
		},

		emptyNotification: {
			message: 'Your notification is empty.',
			code: 'EMPTY_YOUR_NOTIFICATION',
			id: '8f553673-91e4-41fc-9414-f171af48c295',
		},
	},
};

export default define(meta, async (ps, user) => {
	const instance = await fetchMeta();
	if (!instance.enableWebhookNotification) throw new ApiError(meta.errors.instanceDisableWebhookNotification);
	const profile = await UserProfiles.findOne({userId: user.id}).then(ensure);
	if (profile.webhookUrl == null) throw new ApiError(meta.errors.emptyWebhookUrl);

	// テスト用の通知を作成するのは面倒なので直近1件の通知を送信する
	const mostResent = await Notifications.findOne({
		where: {
			notifieeId: user.id,
		},
		order: {
			createdAt: 'DESC',
		},
	}).then(ensure)
	.catch(() => {
		throw new ApiError(meta.errors.emptyNotification);
	});

	const packed = await Notifications.pack(mostResent);
	postWebhookJob(user.id, 'notification', packed, profile.webhookUrl);
});
