<template>
<MkContainer :show-header="props.showHeader">
	<template #header><i class="fas fa-hashtag"></i>{{ $ts._widgets.trends }}</template>

	<div class="wbrkwala">
		<MkLoading v-if="fetching"/>
		<transition-group tag="div" name="chart" class="tags" v-else>
			<div v-for="stat in stats" :key="stat.key">
				<div class="tag">
					<MkA v-if="stat.tag" class="a" :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</MkA>
					<MkA v-if="stat.channel" class="a" :to="`/channels/${stat.channel.id}`" :title="stat.channel.name"><i class="fas fa-satellite-dish"/>{{ stat.channel.name }}</MkA>
					<p>{{ $t('nUsersMentioned', { n: stat.usersCount }) }}</p>
				</div>
				<MkMiniChart class="chart" :src="stat.chart"/>
			</div>
		</transition-group>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import MkMiniChart from '@client/components/mini-chart.vue';
import * as os from '@client/os';

const widget = define({
	name: 'hashtags',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer, MkMiniChart
	},
	data() {
		return {
			stats: [],
			fetching: true,
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 1000 * 60);
	},
	beforeUnmount() {
		clearInterval(this.clock);
	},
	methods: {
		fetch() {
			Promise.all([os.api('hashtags/trend'), os.api('channels/trend')]).then(res => {
				const stats = []
				res[0].forEach(stat => stats.push({ key: stat.tag, ...stat }));
				res[1].forEach(stat => stats.push({ key: stat.channelId, ...stat }));
				stats.sort((a, b) => b.usersCount - a.usersCount);
				this.stats = stats;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.wbrkwala {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .tags {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--divider);

			> .tag {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 18px;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: 16px;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>
