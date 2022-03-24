import * as mfm from '@/mfm/index';
import { unique } from '@/prelude/array';

export function extractCustomEmojisFromMfm(nodes: mfm.MfmNode[]): string[] {
	const emojiNodes = mfm.extract(nodes, (node) => {
		return (node.type === 'emojiCode' && node.props.name.length <= 100);
	});

	return unique(emojiNodes.map(x => x.props.name));
}
