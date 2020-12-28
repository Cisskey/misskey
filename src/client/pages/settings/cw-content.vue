<template>
<section class="_section">
	<div class="_card">
		<div class="_content">
			<MkSwitch v-model:value="autoShowCwContentAll">{{ $t('_autoShowCwContent.showAll') }}</MkSwitch>
			<MkTextarea v-model:value="items" v-if="!autoShowCwContentAll">
				<span>{{ $t('_autoShowCwContent.showWords') }}</span>
				<template #desc>{{ $t('_autoShowCwContent.showWordsDescription') }}</template>
			</MkTextarea>
		</div>
		<div class="_footer" v-if="!autoShowCwContentAll">
			<MkButton inline @click="save()" primary :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
		</div>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import MkSwitch from '@/components/ui/switch.vue';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import { defaultStore } from '@/store';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkSwitch,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('autoShowCwContent'),
					icon: faEyeSlash
				}]
			},
			items: (this.$store.state.showCwWords as string[]).join('\n'),
			changed: false,
			faEyeSlash, faSave,
		}
	},

	watch: {
		items: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
		autoShowCwContentAll: {
			handler() {
				location.reload()
			},
			deep: true
		},
	},

	computed: {
		splited(): string[] {
			return this.items.trim().split('\n').filter(x => x.trim() !== '');
		},

		autoShowCwContentAll: defaultStore.makeGetterSetter('autoShowCwContentAll'),
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		save() {
			this.$store.set('showCwWords', this.splited);
			this.changed = false;
			location.reload()
		},
	},
});
</script>
