import * as mfm from '@/mfm/index';
import { unique } from '@/prelude/array';

export function extractHashtags(nodes: mfm.MfmNode[]): string[] {
	const hashtagNodes = mfm.extract(nodes, (node) => node.type === 'hashtag');
	const hashtags = unique(hashtagNodes.map(x => x.props.hashtag));

	return hashtags;
}
