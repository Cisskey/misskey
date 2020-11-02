import { MfmForest, MfmTree } from './prelude';
import { nyaize } from '../misc/nyaize';

export type RestoreOptions = {
	doNyaize?: boolean;
};

export function toString(tokens: MfmForest | null, opts?: RestoreOptions): string {

	if (tokens === null) return '';

	function appendChildren(children: MfmForest, opts?: RestoreOptions): string {
		return children.map(t => handlers[t.node.type](t, opts)).join('');
	}

	function tagHandler(name: string): (token: MfMTree, opts?: RestoreOptions) => string {
		return (token, opts) => {
			const attrs = token.node.props?.attrs;
			const post = attrs ? ` ${attrs.join(' ')}` : '';
			return `<${name}${post}>${appendChildren(token.children, opts)}</${name}>`;
		};
	}

	const handlers: { [key: string]: (token: MfmTree, opts?: RestoreOptions) => string } = {
		bold(token, opts) {
			return `**${appendChildren(token.children, opts)}**`;
		},

		big(token, opts) {
			return `***${appendChildren(token.children, opts)}***`;
		},

		small: tagHandler('small'),

		strike(token, opts) {
			return `~~${appendChildren(token.children, opts)}~~`;
		},

		italic: tagHandler('i'),

		motion: tagHandler('motion'),

		animate: tagHandler('animate'),

		spin: tagHandler('spin'),

		jump: tagHandler('jump'),

		flip: tagHandler('flip'),

		twitch: tagHandler('twitch'),

		shake: tagHandler('shake'),

		blockCode(token) {
			return `\`\`\`${token.node.props.lang || ''}\n${token.node.props.code}\n\`\`\`\n`;
		},

		center: tagHandler('center'),

		slide: tagHandler('slide'),

		emoji(token) {
			return (token.node.props.emoji ? token.node.props.emoji : `:${token.node.props.name}:`);
		},

		hashtag(token) {
			return `#${token.node.props.hashtag}`;
		},

		inlineCode(token) {
			return `\`${token.node.props.code}\``;
		},

		mathInline(token) {
			return `\\(${token.node.props.formula}\\)`;
		},

		mathBlock(token) {
			return `\\[${token.node.props.formula}\\]`;
		},

		link(token, opts) {
			if (token.node.props.silent) {
				return `?[${appendChildren(token.children, opts)}](${token.node.props.url})`;
			} else {
				return `[${appendChildren(token.children, opts)}](${token.node.props.url})`;
			}
		},

		mention(token) {
			return token.node.props.canonical;
		},

		quote(token) {
			return `${appendChildren(token.children, {doNyaize: false}).replace(/^/gm,'>').trim()}\n`;
		},

		title(token, opts) {
			return `[${appendChildren(token.children, opts)}]\n`;
		},

		text(token, opts) {
			return (opts && opts.doNyaize) ? nyaize(token.node.props.text) : token.node.props.text;
		},

		url(token) {
			return `<${token.node.props.url}>`;
		},

		search(token, opts) {
			const query = token.node.props.query;
			return `${(opts && opts.doNyaize ? nyaize(query) : query)} [search]\n`;
		}
	};

	return appendChildren(tokens, { doNyaize: (opts && opts.doNyaize) || false }).trim();
}
