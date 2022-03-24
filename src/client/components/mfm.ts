import { VNode, defineComponent, h } from 'vue';
import { MfmForest } from '@client/../mfm/prelude';
import { parse, parsePlain } from '@client/../mfm/parse';
import MkUrl from '@client/components/global/url.vue';
import MkLink from '@client/components/link.vue';
import MkMention from '@client/components/mention.vue';
import MkEmoji from '@client/components/global/emoji.vue';
import { concat } from '@client/../prelude/array';
import MkFormula from '@client/components/formula.vue';
import MkCode from '@client/components/code.vue';
import MkGoogle from '@client/components/google.vue';
import MkSparkle from '@client/components/sparkle.vue';
import MkA from '@client/components/global/a.vue';
import { host } from '@client/config';
import 'animate.css/animate.min.css';

function toDirection(attr: string): string {
	switch (attr) {
		case 'left': return 'reverse';
		case 'right': return 'normal';
		case 'alternate': return 'alternate';
		default: return 'normal';
	}
}

export default defineComponent({
	props: {
		text: {
			type: String,
			required: true
		},
		plain: {
			type: Boolean,
			default: false
		},
		nowrap: {
			type: Boolean,
			default: false
		},
		author: {
			type: Object,
			default: null
		},
		i: {
			type: Object,
			default: null
		},
		customEmojis: {
			required: false,
		},
		isNote: {
			type: Boolean,
			default: true
		},
	},

	render() {
		if (this.text == null || this.text == '') return;

		const ast = (this.plain ? parsePlain : parse)(this.text);

		const genEl = (ast: MfmForest) => concat(ast.map((token): VNode[] => {
			switch (token.node.type) {
				case 'text': {
					const text = token.node.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (!this.plain) {
						const res = [];
						for (const t of text.split('\n')) {
							res.push(h('br'));
							res.push(t);
						}
						res.shift();
						return res;
					} else {
						return [text.replace(/\n/g, ' ')];
					}
				}

				case 'bold': {
					return [h('b', genEl(token.children))];
				}

				case 'strike': {
					return [h('del', genEl(token.children))];
				}

				case 'italic': {
					return h('i', {
						style: 'font-style: oblique;'
					}, genEl(token.children));
				}

				case 'big': {
					return h('strong', {
						style: `display: inline-block; font-size: 150%;` + (this.$store.state.animatedMfm ? 'animation: anime-tada 1s linear infinite both;' : ''),
					}, genEl(token.children));
				}

				case 'small': {
					return [h('small', {
						style: 'opacity: 0.7;'
					}, genEl(token.children))];
				}

				case 'center': {
					return [h('div', {
						style: 'text-align:center;'
					}, genEl(token.children))];
				}

				case 'motion': {
					return h('span', {
						style: 'display: inline-block;' + (this.$store.state.animatedMfm ? 'animation: anime-rubberBand 1s linear infinite both;' : ''),
					}, genEl(token.children));
				}

				case 'animate': {
					const animations =
						[ 'bounce'
						, 'flash'
						, 'pulse'
						, 'rubberBand'
						, 'headShake'
						, 'swing'
						, 'tada'
						, 'wobble'
						, 'jello'
						, 'flip'
						];
					const attrs = token.node.props.attrs || [];
					const animation = attrs.length > 0 ? attrs[0] : animations[Math.floor(animations.length * Math.random())];
					const iteration = attrs.length > 1 ? attrs[1] : 'infinite';

					return h('span', {
						class: 'animate__animated',
						style: {
							display: 'inline-block',
							animationName: animation,
							animationIterationCount: iteration,
						}
					}, genEl(token.children));
				}

				case 'spin': {
					const attrs = token.node.props.attrs || [];
					const direction = attrs.length > 0 ? toDirection(attrs[0]) : 'normal';
					const style = this.$store.state.animatedMfm
						? `animation: anime-spin 1.5s linear infinite; animation-direction: ${direction};` : '';
					return h('span', {
						style: 'display: inline-block;' + style
					}, genEl(token.children));
				}

				case 'slide': {
					const attrs = token.node.props.attrs || [];
					const direction = attrs.length > 0 ? toDirection(attrs[0]) : 'normal';
					const duration = attrs.length > 1 ? attrs[1] : '3s';
					const style = this.$store.state.animatedMfm
						? `animation: slide ${duration} linear infinite; animation-direction: ${direction};` : '';
					return h('span', {
						style: 'display: inline-block;' + style
					}, genEl(token.children));
				}

				case 'jump': {
					return h('span', {
						style: this.$store.state.animatedMfm ? 'display: inline-block; animation: anime-jump 0.75s linear infinite;' : 'display: inline-block;'
					}, genEl(token.children));
				}

				case 'flip': {
					return h('span', {
						style: 'display: inline-block; transform: scaleX(-1);'
					}, genEl(token.children));
				}

				case 'twitch': {
					return h('span', {
						style: this.$store.state.animatedMfm ? 'display: inline-block; animation: anime-twitch 0.5s ease infinite;' : 'display: inline-block;'
					}, genEl(token.children));
				}

				case 'shake': {
					return h('span', {
						style: this.$store.state.animatedMfm ? 'display: inline-block; animation: anime-shake 0.5s ease infinite;' : 'display: inline-block;'
					}, genEl(token.children));
				}

				case 'url': {
					return [h(MkUrl, {
						key: Math.random(),
						url: token.node.props.url,
						rel: 'nofollow noopener',
					})];
				}

				case 'link': {
					return [h(MkLink, {
						key: Math.random(),
						url: token.node.props.url,
						rel: 'nofollow noopener',
					}, genEl(token.children))];
				}

				case 'mention': {
					return [h(MkMention, {
						key: Math.random(),
						host: (token.node.props.host == null && this.author && this.author.host != null ? this.author.host : token.node.props.host) || host,
						username: token.node.props.username
					})];
				}

				case 'hashtag': {
					return [h(MkA, {
						key: Math.random(),
						to: this.isNote ? `/tags/${encodeURIComponent(token.node.props.hashtag)}` : `/explore/tags/${encodeURIComponent(token.node.props.hashtag)}`,
						style: 'color:var(--hashtag);'
					}, `#${token.node.props.hashtag}`)];
				}

				case 'blockCode': {
					return [h(MkCode, {
						key: Math.random(),
						code: token.node.props.code,
						lang: token.node.props.lang,
					})];
				}

				case 'inlineCode': {
					return [h(MkCode, {
						key: Math.random(),
						code: token.node.props.code,
						lang: token.node.props.lang,
						inline: true
					})];
				}

				case 'quote': {
					if (!this.nowrap) {
						return [h('div', {
							class: 'quote'
						}, genEl(token.children))];
					} else {
						return [h('span', {
							class: 'quote'
						}, genEl(token.children))];
					}
				}

				case 'title': {
					return [h('div', {
						class: 'title'
					}, genEl(token.children))];
				}

				case 'emoji': {
					return [h(MkEmoji, {
						key: Math.random(),
						emoji: token.node.props.name ? `:${token.node.props.name}:` : token.node.props.emoji,
						customEmojis: this.customEmojis,
						normal: this.plain
					})];
				}

				case 'mathInline': {
					return [h(MkFormula, {
						key: Math.random(),
						formula: token.node.props.formula,
						block: false
					})];
				}

				case 'mathBlock': {
					return [h(MkFormula, {
						key: Math.random(),
						formula: token.node.props.formula,
						block: true
					})];
				}

				case 'search': {
					return [h(MkGoogle, {
						key: Math.random(),
						q: token.node.props.query
					})];
				}

				default: {
					console.error('unrecognized ast type:', token.node.type);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return h('span', genEl(ast));
	}
});
