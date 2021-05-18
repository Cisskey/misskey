<template>
<XColumn :func="{ handler: func, title: $ts.selectChannel }" :column="column" :is-stacked="isStacked" :indicated="indicated" @change-active-state="onChangeActiveState">
	<template #header>
		<i class="fas fa-satellite-dish"></i>
		<span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XPostForm v-if="showFixedPostForm" :channel="{ id: column.chId }" class="" fixed :autofocus="false"/>
	<XTimeline v-if="column.chId" ref="timeline" src="channel" :channel="column.chId" @after="() => $emit('loaded')" @queue="queueUpdated" @note="onNote" :key="column.chId"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XColumn from './column.vue';
import XTimeline from '@client/components/timeline.vue';
import XPostForm from '@client/components/post-form.vue';
import * as os from '@client/os';
import { removeColumn, updateColumn } from './deck-store';

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
			showFixedPostForm: this.column.showFixedPostForm || false,
			faCog, faSatelliteDish, faEye, faEyeSlash,
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		},

		showFixedPostForm() {
			updateColumn(this.column.id, {
				chId: this.column.chId,
				name: this.column.name,
				showFixedPostForm: this.showFixedPostForm,
			});
		},
	},

	mounted() {
		if (this.column.chId == null) {
			this.selectChannel();
		}
	},

	methods: {
		async func(ev) {
			await os.modalMenu([{
				icon: faCog,
				text: this.$t('selectChannel'),
				action: this.selectChannel
			}, {
				icon: this.showFixedPostForm ? faEyeSlash : faEye,
				text: this.showFixedPostForm ? this.$t('_deck.hideFixedPostForm') : this.$t('_deck.showFixedPostForm'),
				action: () => {
					this.showFixedPostForm = !this.showFixedPostForm;
					updateColumn(this.column.id, {
						chId: this.column.chId,
						name: this.column.name,
						showFixedPostForm: this.showFixedPostForm,
					});
				}
			}], ev.currentTarget || ev.target);
		},

		async selectChannel() {
			const channels = await os.api('channels/followed', { limit: 100 });
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
			if (canceled) {
				if (this.column.chId == null) {
					removeColumn(this.column.id);
				}
				return;
			}

			updateColumn(this.column.id, {
				chId: channel.id,
				name: channel.name,
				showFixedPostForm: this.column.showFixedPostForm,
			});
		},

		focus() {
			(this.$refs.timeline as any).focus();
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
