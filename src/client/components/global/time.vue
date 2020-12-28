<template>
<time :title="absolute" v-tooltip="typeof time == 'string' ? new Date(time).toLocaleString() : time.toLocaleString()">
	<template v-if="_mode == 'relative'">{{ relative }}</template>
	<template v-else-if="_mode == 'absolute'">{{ absolute }}</template>
	<template v-else-if="_mode == 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		time: {
			type: [Date, String],
			required: true
		},
		mode: {
			type: String,
		}
	},
	data() {
		return {
			tickId: null,
			now: new Date()
		};
	},
	computed: {
		_mode(): string {
			if (this.mode) return this.mode;
			return this.$store.state.timestampFormat;
		},
		_time(): Date {
			return typeof this.time == 'string' ? new Date(this.time) : this.time;
		},
		absolute(): string {
			return this._time.toLocaleString();
		},
		relative(): string {
			const time = this._time;
			const ago = (this.now.getTime() - time.getTime()) / 1000/*ms*/;
			return (
				ago >= 31536000 ? this.$t('_ago.yearsAgo',   { n: (~~(ago / 31536000)).toString() }) :
				ago >= 2592000  ? this.$t('_ago.monthsAgo',  { n: (~~(ago / 2592000)).toString() }) :
				ago >= 604800   ? this.$t('_ago.weeksAgo',   { n: (~~(ago / 604800)).toString() }) :
				ago >= 86400    ? this.$t('_ago.daysAgo',    { n: (~~(ago / 86400)).toString() }) :
				ago >= 3600     ? this.$t('_ago.hoursAgo',   { n: (~~(ago / 3600)).toString() }) :
				ago >= 60       ? this.$t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() }) :
				ago >= 10       ? this.$t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() }) :
				ago >= -1       ? this.$ts._ago.justNow :
				ago <  -1       ? this.$ts._ago.future :
				this.$ts._ago.unknown);
		}
	},
	created() {
		if (this._mode == 'relative' || this._mode == 'detail') {
			this.tickId = window.requestAnimationFrame(this.tick);
		}
	},
	unmounted() {
		if (this._mode === 'relative' || this._mode === 'detail') {
			window.clearTimeout(this.tickId);
		}
	},
	methods: {
		tick() {
			// TODO: パフォーマンス向上のため、このコンポーネントが画面内に表示されている場合のみ更新する
			this.now = new Date();

			this.tickId = setTimeout(() => {
				window.requestAnimationFrame(this.tick);
			}, 10000);
		}
	}
});
</script>
