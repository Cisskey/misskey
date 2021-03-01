import $ from 'cafy';
import es from '../../../../db/elasticsearch';
import define from '../../define';
import { Notes, Users } from '../../../../models';
import { In } from 'typeorm';
import { ID } from '../../../../misc/cafy-id';
import config from '../../../../config';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateVisibilityQuery } from '../../common/generate-visibility-query';
import { generateMutedUserQuery } from '../../common/generate-muted-user-query';
import { toPunyNullable } from '../../../../misc/convert-host';
import { IUser } from '../../../../models/entities/user';
import { safeForSql } from '../../../../misc/safe-for-sql';

export const meta = {
	desc: {
		'ja-JP': '投稿を検索します。',
		'en-US': 'Search notes.'
	},

	tags: ['notes'],

	requireCredential: false as const,

	params: {
		query: {
			validator: $.str
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		host: {
			validator: $.optional.nullable.str,
			default: undefined
		},

		userId: {
			validator: $.optional.nullable.type(ID),
			default: null
		},

		channelId: {
			validator: $.optional.nullable.type(ID),
			default: null
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},

	errors: {
	}
};

export default define(meta, async (ps, me) => {
	if (es == null) {
		const query = makePaginationQuery(Notes.createQueryBuilder('note'), ps.sinceId, ps.untilId)
			.leftJoinAndSelect('note.user', 'user');

		if (ps.userId) {
			query.andWhere('note.userId = :userId', { userId: ps.userId });
		} else if (ps.channelId) {
			query.andWhere('note.channelId = :channelId', { channelId: ps.channelId });
		}

		const fromRegex = /^from:@?([\w-]+)(?:@([\w.-]+))?$/;
		const toRegex = /^to:@?([\w-]+)(?:@([\w.-]+))?$/;
		const pollsRegex = /^(poll|polls)$/i;
		const cwRegex = /cw/i;
		const filterRegex = /^filter:(\w+)$/;
		const excludeRegex = /^-([\w:@.-]+)$/;
		const filetypeRegex = /^filetype:(\w+)$/;
		const tokens = ps.query.trim().match(/(?:[^\s　"']+|['"][^'"]*["'])+/g);
		if (tokens == null) return [];
		for (let token of tokens) {
			token = token.replace(/(['"])/g, '');
			const matchFrom = token.match(fromRegex);
			if (matchFrom) {
				const user = await getUser(matchFrom[1], matchFrom[2]);
				if (user == null) {
					return [];
				} else {
					query.andWhere(`note.userId = '${user.id}'`);
					continue;
				}
			}

			const matchFileType = token.match(filetypeRegex);
			if (matchFileType) {
				if (matchFileType[1] === 'all') {
					query.andWhere('note.fileIds != :fileId', { fileId: '{}' });
					continue;
				} else {
					return [];
				}
			}

			const matchTo = token.match(toRegex);
			if (matchTo) {
				const user = await getUser(matchTo[1], matchTo[2]);
				if (user == null) {
					return [];
				} else {
					query.andWhere(`'${user.id}' = ANY (note.mentions)`);
					continue;
				}
			}

			const matchSince = token.match(/^since:(\d{4}-\d{1,2}-\d{1,2})/);
			if (matchSince) {
				const since = new Date(`${matchSince[1]} 00:00:00 +0900`);
				if (isNaN(since.getTime())) return [];
				query.andWhere('note.createdAt >= :since', { since: since });
				continue;
			}

			const matchUntil = token.match(/^until:(\d{4}-\d{1,2}-\d{1,2})/);
			if (matchUntil) {
				const until = new Date(`${matchUntil[1]} 23:59:59 +0900`);
				if (isNaN(until.getTime())) return [];
				query.andWhere('note.createdAt <= :until', { until: until });
				continue;
			}

			const matchFilter = token.match(filterRegex);
			if (matchFilter) {
				const matchPolls = matchFilter[1].match(pollsRegex);
				if (matchPolls) {
					query.andWhere('note.hasPoll = :withPolls', { withPolls: true });
					continue;
				}

				const matchCw = matchFilter[1].match(cwRegex);
				if (matchCw) {
					query.andWhere('note.cw IS NOT NULL');
					continue;
				}
				return [];
			}

			const matchExcludeWord = token.match(excludeRegex);
			if (matchExcludeWord) {
				const matchFrom = matchExcludeWord[1].match(fromRegex);
				if (matchFrom) {
					const user = await getUser(matchFrom[1], matchFrom[2]);
					if (user == null) {
						return [];
					} else {
						query.andWhere(`note.userId != '${user.id}'`);
						continue;
					}
				}

				const matchToUser = matchExcludeWord[1].match(toRegex);
				if (matchToUser) {
					const user = await getUser(matchToUser[1], matchToUser[2]);
					if (user == null) {
						return[];
					} else {
						query.andWhere(`'${user.id}' != ALL (note.mentions)`);
						continue;
					}
				}

				const matchFilter = matchExcludeWord[1].match(filterRegex);
				if (matchFilter) {
					const matchPolls = matchFilter[1].match(pollsRegex);
					if (matchPolls) {
						query.andWhere('note.hasPoll = :withPolls', { withPolls: false });
						continue;
					}

					const matchCw = matchFilter[1].match(cwRegex);
					if (matchCw) {
						query.andWhere('note.cw IS NULL');
						continue;
					}
					return [];
				}

				const matchFileType = matchExcludeWord[1].match(filetypeRegex);
				if (matchFileType) {
					if (matchFileType[1] === 'all') {
						query.andWhere('note.fileIds = :fileId', { fileId: '{}' });
						continue;
					} else {
						return [];
					}
				}

				if (!safeForSql(matchExcludeWord[1])) return [];
				query.andWhere(`note.text NOT ILIKE '%${matchExcludeWord[1]}%'`);
				continue;
			}
			if (!safeForSql(token)) return [];
			query.andWhere(`note.text ILIKE '%${token}%'`);
		}

		generateVisibilityQuery(query, me);
		if (me) generateMutedUserQuery(query, me);

		const notes = await query.take(ps.limit!).getMany();

		return await Notes.packMany(notes, me);
	} else {
		const userQuery = ps.userId != null ? [{
			term: {
				userId: ps.userId
			}
		}] : [];

		const hostQuery = ps.userId == null ?
			ps.host === null ? [{
				bool: {
					must_not: {
						exists: {
							field: 'userHost'
						}
					}
				}
			}] : ps.host !== undefined ? [{
				term: {
					userHost: ps.host
				}
			}] : []
		: [];

		const result = await es.search({
			index: config.elasticsearch.index || 'misskey_note',
			body: {
				size: ps.limit!,
				from: ps.offset,
				query: {
					bool: {
						must: [{
							simple_query_string: {
								fields: ['text'],
								query: ps.query.toLowerCase(),
								default_operator: 'and'
							},
						}, ...hostQuery, ...userQuery]
					}
				},
				sort: [{
					_doc: 'desc'
				}]
			}
		});

		const hits = result.body.hits.hits.map((hit: any) => hit._id);

		if (hits.length === 0) return [];

		// Fetch found notes
		const notes = await Notes.find({
			where: {
				id: In(hits)
			},
			order: {
				id: -1
			}
		});

		return await Notes.packMany(notes, me);
	}
});

const getUser = async (username: string, host: string): Promise<IUser | null>  => {
	if (!safeForSql(username)) return null;
	if (!safeForSql(host)) return null;
	const user = await Users.findOne({
		usernameLower: username.toLowerCase(),
		host: toPunyNullable(host),
	});
	if (user == null) return null;
	return user;
};
