<template>
<section class="_section">
	<div class="_card">
		<div class="_content">
			<MkInfo>{{ $t('_webhookNotification.descriptionForSlack')}}</MkInfo>
			<MkInfo>{{ $t('_webhookNotification.descriptionForBot')}}</MkInfo>
			<MkSwitch v-model:value="enableWebhook">
				{{ $t('_webhookNotification.enable') }}
			</MkSwitch>
			<MkSelect v-model:value="type">
				<template #label>{{ $t('_webhookNotification.jsonType') }}</template>
				<option v-for="type in types" :value="type" :key="type">{{ type }}</option>
			</MkSelect>
			<MkInput v-model:value="url">
				<span>{{ $t('_webhookNotification.url') }}</span>
				<template #desc>{{ $t('_webhookNotification.urlDescription') }}</template>
			</MkInput>
			<MkInput v-model:value="secret" v-if="type === 'bot'">
				<span>{{ $t('_webhookNotification.secret') }}</span>
				<template #desc>{{ $t('_webhookNotification.secretDescription') }}</template>
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
import MkSelect from '@/components/ui/select.vue';
import * as os from '@/os';
import { webhookTypes } from '../../../types';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		MkInfo,
		MkSelect,
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
			types: webhookTypes,
			type: this.$store.state.i.webhookType || 'slack',
			secret: this.$store.state.i.webhookSecret,
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
		type: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
		secret: {
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
				webhookUrl: this.url.trim() || null,
				webhookType: this.type,
				webhookSecret: this.secret.trim() || null
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
			os.api('notifications/webhook-test', {
				type: 'notification',
			}).then(() => {
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
