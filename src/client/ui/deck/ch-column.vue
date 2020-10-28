<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated" @change-active-state="onChangeActiveState">
	<template #header>
		<Fa :icon="faSatelliteDish"/>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XPostForm v-if="showFixedPostForm" :channel="{ id: column.chId }" class="" fixed/>
	<XTimeline v-if="column.chId" ref="timeline" src="channel" :channel="column.chId" @after="() => $emit('loaded')" @queue="queueUpdated" @note="onNote" :key="column.chId"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog, faSatelliteDish, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '@/components/timeline.vue';
import XPostForm from '@/components/post-form.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XColumn,
		XTimeline,
		XPostForm,
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			menu: [],
			indicated: false,
			columnActive: true,
			showFixedPostForm: false,
			faCog, faSatelliteDish, faEye, faEyeSlash,
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		},

		showFixedPostForm() {
			this.setMenu();
		},
	},

	created() {
		this.setMenu();
	},

	mounted() {
		if (this.column.chId == null) {
			this.selectChannel();
		}
	},

	methods: {
		async selectChannel() {
			const channels = await os.api('channels/followed');
			const { canceled, result: channel } = await os.dialog({
				title: this.$t('selectChannel'),
				type: null,
				select: {
					items: channels.map(x => ({
						value: x, text: x.name
					})),
				},
				showCancelButton: true
			});
			if (canceled) return;

			this.column.chId = channel.id;
			this.column.name = channel.name;
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		},

		focus() {
			(this.$refs.timeline as any).focus();
		},

		setMenu() {
			const m = [{
				icon: faCog,
				text: this.$t('selectChannel'),
				action: this.selectChannel
			}, {
				icon: this.showFixedPostForm ? faEyeSlash : faEye,
				text: this.showFixedPostForm ? this.$t('_deck.hideFixedPostForm') : this.$t('_deck.showFixedPostForm'),
				action: () => {
					this.showFixedPostForm = !this.showFixedPostForm;
				}
			}];

			this.menu.splice(0, this.menu.length);
			this.menu.push(...m)
		},

		queueUpdated(q) {
			if (this.columnActive) {
				this.indicated = q !== 0;
			}
		},

		onNote() {
			if (!this.columnActive) {
				this.indicated = true;
			}
		},

		onChangeActiveState(state) {
			this.columnActive = state;

			if (this.columnActive) {
				this.indicated = false;
			}
		},
	}

});
</script>

<style lang="scss" scoped>
</style>
