import { Brackets } from 'typeorm';
import define from '../../define';
import { Notes, Channels } from '../../../../models';

export const meta = {
	tags: ['channels'],

	requireCredential: false as const,

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				channel: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'Channel',
				},
				chart: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					items: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
					}
				},
				usersCount: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
				}
			}
		}
	}
};

export default define(meta, async (ps, me) => {
	const now = new Date();
	// キャッシュさせるために丸める
	now.setMinutes(Math.round(now.getMinutes() / 5) * 5, 0, 0);

	const hots = await Notes.createQueryBuilder('note')
		.select('note.channelId', 'channelId')
		.addSelect('COUNT(DISTINCT note.userId)', 'count')
		.where(`note.createdAt > :date`, { date: new Date(now.getTime() - (1000 * 60 * 60)) }) // 60 min
		.andWhere(new Brackets(qb => { qb
			.where(`note.visibility = 'public'`)
			.orWhere(`note.visibility = 'home'`);
		}))
		.andWhere(`note.channelId IS NOT NULL`)
		.groupBy('note.channelId')
		.orderBy('count', 'DESC')
		.limit(5)
		.cache(1000 * 60) // 1 min
		.getRawMany();
	if (hots.length === 0) {
		return [];
	}

	const interval = 1000 * 60 * 10; // 10 min
	const range = 20;
	const countPromises: Promise<number[]>[] = [];
	for (let i = 0; i < range; i++) {
		countPromises.push(Promise.all(hots.map(hot => Notes.createQueryBuilder('note')
			.select('COUNT(DISTINCT note.userId)', 'count')
			.where('note.channelId = :channel', { channel: hot.channelId })
			.andWhere('note.createdAt < :lt', { lt: new Date(now.getTime() - (interval * i)) })
			.andWhere('note.createdAt > :gt', { gt: new Date(now.getTime() - (interval * (i + 1))) })
			.cache(1000 * 60) // 1 min
			.getRawOne()
			.then(x => parseInt(x.count, 10))
		)));
	}
	const countsLog = await Promise.all(countPromises);

	const channels = await Promise.all(hots.map(hot => Channels.pack(hot.channelId, me)));
	const stats = hots.map((hot, i) => ({
		channel: channels[i],
		chart: countsLog.map(counts => counts[i]),
		usersCount: parseInt(hot.count, 10),
	}));

	return stats;
});
