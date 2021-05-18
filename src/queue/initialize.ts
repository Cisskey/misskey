import * as Bull from 'bull';
import config from '@/config';

export function initialize<T>(name: string, limitPerSec = -1, limitDuration?: number, groupKey?: string) {
	return new Bull<T>(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			password: config.redis.pass,
			db: config.redis.db || 0,
		},
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue',

                // deliver, inbox (5/5s)との互換性のため
		limiter: limitPerSec > 0 ? {
			max: limitPerSec * 5,
			duration: 5000,
                        max: limitDuration ? limitPerSec : limitPerSec * 5,
                        duration: limitDuration || 5000,
                        groupKey: groupKey,
		} : undefined
	});
}
