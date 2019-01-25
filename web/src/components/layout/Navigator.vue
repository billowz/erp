<template>
  <div class="layout-breadcrumb">
    <Breadcrumb>
      <Breadcrumb-item
        v-for="(itemName, key, index) in itemNames"
        :key="index"
      >{{ itemName }}</Breadcrumb-item>
    </Breadcrumb>
  </div>
</template>

<script>
import EventBus from '@/event_bus'
import { getRoute } from '@/siteMap'

export default {
	name: 'Navigator',
	data() {
		return {
			itemNames: []
		}
	},
	created() {
		EventBus.$on('route-change', data => {
			const route = getRoute(data.to.path)
			if (route)
				route.then(node => {
					this.itemNames = node.namePath
				})
			else this.itemNames = []
		})
	}
}
</script>

<style scoped>
.layout-breadcrumb {
	padding: 10px 15px 10px 15px;
}
</style>
