import define from '../../../define';
import { createCleanRemoteFilesJob } from '../../../../../queue';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireAdmin: true,
};

export default define(meta, async (ps, me) => {
	createCleanRemoteFilesJob();
});
