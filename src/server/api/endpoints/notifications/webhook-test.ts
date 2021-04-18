import $ from 'cafy';
import define from '../../define';
import { Notifications, UserProfiles, MessagingMessages } from '../../../../models';
import { postWebhookJob } from '../../../../queue';
import { fetchMeta } from '../../../../misc/fetch-meta';
import { ApiError } from '../../../api/error';
import { Not } from 'typeorm';
import { notification, notificationType } from '../../../../services/push-notification';

export const meta = {
	desc: {
		'ja-JP': 'Webhook 通知のテストします。',
	},

	tags: ['notifications'],

	requireCredential: true as const,

	kind: 'read:notifications',

	params: {
		type: {
			validator: $.str.or(notification as unknown as string[]),
		}
	},

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

		emptyMessage: {
			message: 'Your messaging is empty.',
			code: 'EMPTY_YOUR_MESSAGING',
			id: '71002ee2-834d-4010-ada3-0b97650deabd',
		},
	},
};

export default define(meta, async (ps, user) => {
	const instance = await fetchMeta();
	if (!instance.enableWebhookNotification) throw new ApiError(meta.errors.instanceDisableWebhookNotification);
	const profile = await UserProfiles.findOneOrFail({userId: user.id});
	if (profile.webhookUrl == null) throw new ApiError(meta.errors.emptyWebhookUrl);

	let packed;
	// テスト用の通知を作成するのは面倒なので直近1件の通知を送信する
	if (ps.type === 'notification') {
		const mostResent = await Notifications.findOneOrFail({
			where: {
				notifieeId: user.id,
				type: Not('app'),
			},
			order: {
				createdAt: 'DESC',
			},
		})
		.catch(() => {
			throw new ApiError(meta.errors.emptyNotification);
		});
		packed = await Notifications.pack(mostResent);
	} else {
		const mostResent = await MessagingMessages.findOneOrFail({
			where: {
				recipientId: user.id,
			},
			order: {
				createdAt: 'DESC',
			},
		})
		.catch(() => {
			throw new ApiError(meta.errors.emptyMessage);
		});
		packed = await MessagingMessages.pack(mostResent);
	}
	postWebhookJob(user.id, ps.type as notificationType, packed);
});
