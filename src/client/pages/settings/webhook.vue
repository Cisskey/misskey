<template>
<section class="_section">
	<div class="_card">
		<div class="_content">
			<MkInfo>{{ $t('_webhookNotification.description')}}</MkInfo>
			<MkSwitch v-model:value="enableWebhook">
				{{ $t('_webhookNotification.enable') }}
			</MkSwitch>
			<MkInput v-model:value="url">
				<span>{{ $t('_webhookNotification.url') }}</span>
				<template #desc>{{ $t('_webhookNotification.urlDescription') }}</template>
			</MkInput>
		</div>
		<div class="_footer">
			<MkButton @click="test()" inline :disabled="!url">{{ $t('_webhookNotification.test') }}</MkButton>
			<MkButton @click="save(true)" primary inline :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkInfo from '@/components/ui/info.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		MkInfo,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('webhookNotification'),
					icon: faLink
				}]
			},
			enableWebhook: this.$store.state.i.enableWebhookNotification,
			url: this.$store.state.i.webhookUrl,
			changed: false,
			faSave, faLink,
		}
	},

	watch: {
		url: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
		enableWebhook: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async save(notify?: boolean) {
			await os.api('i/update', {
				enableWebhookNotification: this.enableWebhook,
				webhookUrl: this.url || null,
			}).then(() => {
				this.changed = false;
				if (notify) {
					os.dialog({
						type: 'success',
						iconOnly: true,
						autoClose: true,
					});
				}
			}).catch((err) => {
				os.dialog({
					type: 'error',
					text: err.id,
				});
			});
		},

		async test() {
			await this.save(false);
			// ここではジョブキューに追加するだけにして、送信エラーは"通知"でユーザーに知らせる
			os.api('notifications/webhook-test').then(() => {
				console.log('postJobQueue Add');
			}).catch((err) => {
				os.dialog({
					type: 'error',
					text: err,
				});
			});
		},
	},
});
</script>
