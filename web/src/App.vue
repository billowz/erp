<template>
  <div
    class="app-section"
    style="height: 100%; min-height: 100%;"
  >
    <login-view
      v-if="notLogin"
      v-show="loginSettle"
      v-cloak
    ></login-view>

    <div
      class="layout"
      v-else
    >
      <Row>
        <Col span="24">
        <side-menu :permissions="permissions"></side-menu>
        </Col>
      </Row>
      <div class="layout-header">
        <Row>
          <Col span="23">&nbsp;</Col>
          <Col
            span="1"
            class="top-menu-section"
          >
          <top-menu></top-menu>
          </Col>
        </Row>
      </div>

      <navigator></navigator>

      <router-view></router-view>

      <div class="layout-copy">
        made by
        <a src="https://github.com/tao-zeng">tao.zeng</a>
      </div>
    </div>
  </div>
</template>

<script>
import SideMenu from '@/components/layout/SideMenu'
import Navigator from '@/components/layout/Navigator'
import TopMenu from '@/components/layout/TopMenu'
import Login from '@/components/Login'

export default {
	data() {
		return {
			loginSettle: false
		}
	},
	computed: {
		permissions() {
			return (this.$store.state.user.permissions || []).reduce(
				(result, permission) => ((result[permission] = true), result),
				{}
			)
		},
		notLogin() {
			let result = true
			if (this.$store.state.user && this.$store.state.user.userInfo) {
				result = false
			}
			return result
		}
	},
	created() {
		// 查询登录用户
		this.$http.get('sessions').then(
			res => {
				this.loginSettle = true

				const data = res.data ? res.data.data[0] : null
				if (data && data.id && data.username) {
					this.$store.commit('updateUser', data)
					if (!this.$router.currentRoute.name) this.$router.replace('dashboard')
				} else {
					this.$store.commit('clearUser')
				}
			},
			err => {
				this.$store.commit('clearUser')
				console.error('App - session request error', err)
			}
		)
	},
	components: {
		'login-view': Login,
		'side-menu': SideMenu,
		navigator: Navigator,
		'top-menu': TopMenu
	}
}
</script>

<style scoped>
.error-message {
	font-size: 13px;
}

.error-wrapper {
	z-index: 1;
	position: absolute;
	width: 100%;
}

.layout {
	border: 1px solid #d7dde4;
	background: #f5f7f9;
	position: relative;
	height: 100%;
	min-height: 100%;
}

.layout-breadcrumb {
	padding: 10px 15px 0;
}

.layout-content {
	min-height: 200px;
	margin: 15px;
	overflow: hidden;
	background: #fff;
	border-radius: 4px;
}

.layout-content-main {
	padding: 10px;
}

.layout-copy {
	text-align: center;
	padding: 20px 0 20px;
	color: #9ea7b4;
}

.layout-menu-left {
	background: #464c5b;
}

.layout-header {
	height: 50px;
	background: #fff;
	box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.top-menu-section {
	padding-top: 15px;
}
</style>
<style>
::-webkit-scrollbar-track {
	-webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
	border-radius: 10px;
	background-color: #f5f5f5;
}

::-webkit-scrollbar {
	width: 12px;
	background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
	border-radius: 10px;
	-webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
	background-color: #555;
}
.ivu-input[disabled],
fieldset[disabled] .ivu-input {
	background-color: #f3f3f3;
	color: #000;
}
.ivu-select-disabled .ivu-select-selection {
    background-color: #f3f3f3;
    color: #000;
}
</style>
