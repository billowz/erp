<template>
  <Menu
    theme="primary"
    width="auto"
    mode="horizontal"
    :open-names="menuItemArr"
    :active-name="activeMenu"
    @on-select="routeTo"
  >
    <div
      v-for="(node, index) in siteMap"
      :key="index"
    >
      <Submenu
        v-if="node.children"
        :name="node.path || node.name"
      >
        <template slot="title">
          <Icon
            v-if="node.icon"
            :type="node.icon"
          ></Icon>
          <span style="font-size:1.5em;">{{node.name}}</span>
        </template>
        <Menu-item
          v-for="(sub, index) in node.children"
          :name="sub.path"
          :key="index"
        >
          <Icon
            v-if="sub.icon"
            :type="sub.icon"
          ></Icon>
          <span style="font-size:1.2em;">{{sub.name}}</span>
        </Menu-item>
      </Submenu>

      <Menu-item
        v-else
        :name="node.path"
      >
        <Icon
          v-if="node.icon"
          :type="node.icon"
        ></Icon>
        <span style="font-size:1.5em;">{{node.name}}</span>
      </Menu-item>
    </div>
  </Menu>
</template>

<script>
import EventBus from '@/event_bus'
import { getSiteMap } from '@/siteMap'

export default {
	name: 'SideMenu',
	props: ['permissions'],
	data() {
		return {
			menuItemArr: [],
			activeMenu: '',
			siteMap: []
		}
	},
	computed: {},
	methods: {
		routeTo(route) {
			if (route) {
				const toRoute = route
				this.$router.push(toRoute)
			}
		},
		updateActive(path) {
			path = path.replace(/^\//, '')
			this.menuItemArr = [path.split('/')[0]]
			this.activeMenu = path.split('/').join(':')
		}
	},
	created() {
		this.updateActive(this.$router.currentRoute.path)

		getSiteMap().then(map => {
			this.siteMap = map
		})

		// 路由改变更新menu
		EventBus.$on('route-change', data => {
			this.updateActive(data.to.path)
		})
	}
}
</script>

<style scoped>
.layout-logo-left {
	height: 30px;
	line-height: 30px;
	background: #ffffff;
	border-radius: 3px;
	margin-top: 15px;
	margin-bottom: 15px;
	text-align: center;
	font-size: 18px;
}
</style>
