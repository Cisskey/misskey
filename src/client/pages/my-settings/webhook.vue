<template>
<section class="_card">
	<div class="_title"><fa :icon="faLink"/> {{ $t('webhookNotification') }}</div>
		<div class="_content">
		<mk-info>{{ $t('_webhookNotification.descriptionForSlack')}}</mk-info>
		<mk-info>{{ $t('_webhookNotification.descriptionForBot')}}</mk-info>
		<mk-switch v-model="enableWebhook">
			{{ $t('_webhookNotification.enable') }}
		</mk-switch>
		<div class="_content">
			<mk-select v-model="type">
				<template #label>{{ $t('_webhookNotification.jsonType') }}</template>
				<option v-for="type in types" :value="type" :key="type">{{ type }}</option>
			</mk-select>
		</div>
		<mk-input v-model="url">
			<span>{{ $t('_webhookNotification.url') }}</span>
			<template #desc>{{ $t('_webhookNotification.urlDescription') }}</template>
		</mk-input>
		<mk-input v-model="secret" v-if="type === 'bot'">
			<span>{{ $t('_webhookNotification.secret') }}</span>
			<template #desc>{{ $t('_webhookNotification.secretDescription') }}</template>
		</mk-input>
	</div>
	<div class="_footer">
		<mk-button @click="test('notification')" inline :disabled="!url">{{ $t('_webhookNotification.testNormal') }}</mk-button>
		<mk-button @click="save(true)" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkSwitch from '../../components/ui/switch.vue';
import MkInfo from '../../components/ui/info.vue';
import MkSelect from '../../components/ui/select.vue';
import { notificationType } from '../../../services/push-notification';
import { webhookTypes } from '../../../types';

export default Vue.extend({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		MkInfo,
		MkSelect,
	},

	data() {
		return {
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
		url() {
			this.changed = true;
		},
		enableWebhook() {
			this.changed = true;
		},
		type() {
			this.changed = true;
		},
		secret() {
			this.changed = true;
		},
	},

	methods: {
		async save(notify?: boolean) {
			await this.$root.api('i/update', {
				enableWebhookNotification: this.enableWebhook,
				webhookUrl: this.url.trim() || null,
				webhookType: this.type,
				webhookSecret: this.secret.trim() || null,
			}).then(() => {
				this.changed = false;
				if (notify) {
					this.$root.dialog({
						type: 'success',
						iconOnly: true,
						autoClose: true,
					});
				}
			}).catch((err) => {
				this.$root.dialog({
					type: 'error',
					text: err.id,
				});
			});
		},

		async test(type: notificationType) {
			await this.save(false);
			// ここではジョブキューに追加するだけにして、送信エラーは"通知"でユーザーに知らせる
			this.$root.api('notifications/webhook-test', {
				type: type
			}).then(() => {
				console.log('postJobQueue Add');
			}).catch((err) => {
				this.$root.dialog({
					type: 'error',
					text: err,
				});
			});
		},
	},
});
</script>
