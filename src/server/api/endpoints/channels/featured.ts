import $ from 'cafy';
import define from '../../define';
import { Channels } from '@/models/index';

export const meta = {
	tags: ['channels'],

	requireCredential: false as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Channel',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = Channels.createQueryBuilder('channel')
		.where('channel.lastNotedAt IS NOT NULL')
		.orderBy('channel.lastNotedAt', 'DESC');

	const channels = await query.skip(ps.offset).take(ps.limit).getMany();

	return await Promise.all(channels.map(x => Channels.pack(x, me)));
});
