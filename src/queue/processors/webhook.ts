import * as Bull from 'bull';
import { getAgentByUrl } from '../../misc/fetch';
import getNoteSummary from '../../misc/get-note-summary';
import fetch from 'node-fetch';
import * as locale from '../../../locales/';
import config from '../../config';
import { notificationType, notificationBody } from '../../services/push-notification';
import { PostWebhookJobData } from '..';
import { createNotification } from '../../services/create-notification';
import { Users } from '../../models';
import { ensure } from '../../prelude/ensure';
import * as crypto from 'crypto';

export default async (job: Bull.Job<PostWebhookJobData>) => {
	// 無限ループ防止
	if ((job.data.body as any).type === 'app') return;

	let body;
	let signature;

	if (job.data.jsonType === 'bot') {
		// JSON 形式がややこしくなるので、とりあえず、チャットでの通知は送信しない
		if (job.data.type === 'unreadMessagingMessage') return;

		body = JSON.stringify(job.data.body);
		signature = await createSignature(job.data.userId, JSON.stringify(job.data.body));
	} else if (job.data.jsonType === 'slack') {
		// TODO: Webhook 通知で使われる言語を設定画面で変更できるように
		body = buildBodySlack(job.data.type, job.data.body, locale['ja-JP']);
	}

	let headers = {
		'Content-type': 'application/json',
		...(signature ? {
			'X-Misskey-Signature': signature,
		} : {}),
	}

	await fetch(job.data.url, {
		method: 'POST',
		headers: headers,
		agent: getAgentByUrl(job.data.url) as any,
		body: body,
	})
	.catch(() => {
		throw 'network error (server side) or illegal URL';
	})
	.then((res) => {
		if (res.ok) return 'Success';

		const errorText = `${res.status} - ${res.statusText} - userId: ${job.data.userId}`;
		// Rate Limit を超えている or POST 先サーバのエラー のためリトライ
		if (res.status === 429 || (500 <= res.status && res.status < 600)) {
			throw errorText;
		}

		// ユーザーによる Webhook URL の設定ミスなどのためスキップ
		res.text().then((text) => {
			createNotification(job.data.userId, 'app', {
				customBody: `Webhook Error: ${res.status} - ${res.statusText} - ${text} (${job.data.url})`,
			});
		});
		return `skip (URL setting miss?) ${errorText}`;
	});
};

/**
 * i token をシークレットとする Signature(SHA256) を作成
 * @param userId
 * @param body
 * @returns `sha256=` で始まる Signature
 */
const createSignature = async (userId: string, body: string) => {
	const user = await Users.findOne(userId).then(ensure);
	if (user.token == null) return;
	const hmac = crypto.createHmac('sha256', user.token).update(body);
	const header = `sha256=${hmac.digest('hex')}`;
	return header;
}

const buildBodySlack = (type: notificationType, body: any, locale: any) => {
	let typeText = '';
	let quoteText = '';
	// 通知送信者のユーザー名 (ex. user)
	const name = body.user.name || body.user.username;
	// 通知送信者のユーザー名 (ex. @localuser, @remoteuser@example.com)
	const username = body.user.host ? `@${body.user.username}@${body.user.host}` : `@${body.user.username}`;

	const noteDetail = body.note ? `${getNoteSummary(body.note, locale)}\n${config.url}/notes/${body.note.id}` : '';
	const notifier = `${name} (${username})`;

	switch (type) {
		case 'notification':
			switch (body.type) {
				case 'mention':
					typeText = locale['_notification']['youGotMention'].replace('{name}', body.user.username);
					quoteText = noteDetail;
					break;
				case 'reply':
					typeText = locale['_notification']['youGotReply'].replace('{name}', body.user.username);
					quoteText = noteDetail;
					break;
				case 'renote':
					typeText = locale['_notification']['youRenoted'].replace('{name}', body.user.username);
					quoteText = noteDetail;
					break;
				case 'quote':
					typeText = locale['_notification']['youGotQuote'].replace('{name}', body.user.username);
					quoteText = noteDetail;
					break;
				case 'reaction':
					typeText = `${body.reaction} by ${body.user.username}`;
					quoteText = noteDetail;
					break;
				case 'follow':
					typeText = `${locale['_notification']['youWereFollowed']} (${body.user.username})`;
					quoteText = notifier;
					break;
				case 'receiveFollowRequest':
					typeText = `${locale['_notification']['youReceivedFollowRequest']} (${body.user.username})`;
					quoteText = notifier;
					break;
				case 'followRequestAccepted':
					typeText = `${locale['_notification']['yourFollowRequestAccepted']} (${body.user.username})`;
					quoteText = notifier;
					break;
				case 'groupInvited':
					typeText = `${locale['_notification']['youWereInvitedToGroup']} (${body.invitation.group.name})`;
					quoteText = notifier;
					break;
				default:
					typeText = 'Notification (unknown)';
					break;
			}
			break;
		case 'unreadMessagingMessage':
			if (body.groupId === null) {
				typeText = locale['_notification']['youGotMessagingMessageFromUser'].replace('{name}', body.user.username);
			} else {
				typeText = locale['_notification']['youGotMessagingMessageFromGroup'].replace('{name}', body.group.name);
			}
			quoteText = body.text;
			break;
	}

	const attachment = {
		fallback: 'Notification detail',
		color: 'good',
		text: quoteText,
	};

	return JSON.stringify({
		text: typeText,
		attachments: [attachment],
	});
};
