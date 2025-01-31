import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '../../../../../models';
import { makePaginationQuery } from '../../../common/make-pagination-query';
import { ID } from '@/misc/cafy-id';
import { Emoji } from '../../../../../models/entities/emoji';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字一覧を取得します。',
		'en-US': 'List custom emojis.'
	},

	tags: ['admin'],

	requireCredential: true as const,

	params: {
		query: {
			validator: $.optional.nullable.str,
			default: null as any
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id',
					description: 'The unique identifier for this Emoji.'
				},
				aliases: {
					type: 'array' as const,
					optional: false as const, nullable: false as const,
					description: 'List to make it easier to be displayed as a candidate when entering emoji.',
					items: {
						type: 'string' as const,
						optional: false as const, nullable: false as const
					}
				},
				name: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					description: 'Official name of custom emoji.'
				},
				category: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					description: 'Names categorized in the emoji list.'
				},
				host: {
					type: 'string' as const,
					optional: false as const, nullable: true as const,
					description: 'If it is another server, the FQDN will be returned here.'
				},
				url: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					description: 'Image URL of emoji.'
				}
			}
		}
	}
};

export default define(meta, async (ps) => {
	const q = makePaginationQuery(Emojis.createQueryBuilder('emoji'), ps.sinceId, ps.untilId)
		.andWhere(`emoji.host IS NULL`);

	let emojis: Emoji[];

	if (ps.query) {
		//q.andWhere('emoji.name ILIKE :q', { q: `%${ps.query}%` });
		//const emojis = await q.take(ps.limit!).getMany();

		emojis = await q.getMany();

		emojis = emojis.filter(emoji =>
			emoji.name.includes(ps.query!) ||
			emoji.aliases.some(a => a.includes(ps.query!)) ||
			emoji.category?.includes(ps.query!));

		emojis.splice(ps.limit! + 1);
	} else {
		emojis = await q.take(ps.limit!).getMany();
	}

	return Emojis.packMany(emojis);
});
