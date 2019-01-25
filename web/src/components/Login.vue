<template>
  <div>
    <Row
      justify="center"
      align="middle"
      class="spin-row"
    >
      <Col
        span="8"
        offset="8"
        class="spin-col"
      >
      <Spin
        fix
        size="large"
        class="login-spin"
        v-show="loading"
      ></Spin>&nbsp;</Col>
    </Row>

    <Row
      justify="center"
      align="middle"
      class="title-row"
    >
      <Col
        span="8"
        offset="8"
        class="title-col"
      > ERP </Col>
    </Row>

    <Row
      justify="center"
      align="middle"
      class="login-row"
    >
      <Col
        span="24"
        class="login-col"
      >
      <Card class="login-card">
        <p slot="title">
          请登录
        </p>
        <Form
          ref="formLogin"
          :model="formLogin"
          :rules="rules"
          :label-width="60"
        >
          <Form-item
            label="用户名"
            prop="username"
          >
            <Input
              type="text"
              v-model="formLogin.username"
              placeholder="请输入用户名"
            >
            <Icon
              type="ios-person-outline"
              slot="prepend"
            ></Icon></Input>
          </Form-item>
          <Form-item
            label="密码"
            prop="password"
          >
            <Input
              type="password"
              v-model="formLogin.password"
              placeholder="请输入密码"
            >
            <Icon
              type="ios-locked-outline"
              slot="prepend"
            ></Icon></Input>
          </Form-item>
          <Form-item>
            <Button
              long
              type="success"
              @click="handleSubmit('formLogin')"
            >登录</Button>
          </Form-item>
        </Form>
      </Card>
      </Col>
    </Row>
  </div>
</template>

<script>
export default {
	data() {
		return {
			loading: false,
			tip: true,
			formLogin: {
				username: '',
				password: ''
			},
			rules: {
				username: [
					{ required: true, message: '用户名不能为空', trigger: 'blur' },
					{ type: 'string', min: 3, message: '用户名不能少于3位', trigger: 'blur' }
				],
				password: [
					{ required: true, message: '密码不能为空', trigger: 'blur' },
					{ type: 'string', min: 6, message: '密码不能少于6位', trigger: 'blur' }
				]
			}
		}
	},
	methods: {
		handleSubmit(name) {
			this.loading = true
			this.$refs[name].validate(valid => {
				if (valid) {
					this.$http
						.post('sessions', {
							username: this.formLogin.username,
							password: this.formLogin.password
						})
						.then(res => {
							this.$store.commit('updateUser', res.data.data)
							if (!this.$router.currentRoute.name) this.$router.replace('/dashboard')
						})
						.finally(() => {
							this.loading = false
						})
				} else {
					this.loading = false
				}
			})
		},
		handleReset(name) {
			this.$refs[name].resetFields()
		},
		mouseover() {
			if (!this.tip) {
				this.tip = true
			}
		},
		mouseout() {
			this.tip = false
		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.title-row {
	height: 100px;
}

.title-col {
	padding-top: 100px;
	padding-bottom: 60px;
	height: 100px;
	text-align: center;
	font-size: 24px;
}

.login-col {
	text-align: center;
}

.login-card {
	margin: auto;
	width: 350px;
}

.tip-section {
	position: relative;
	top: -255px;
	left: 240px;
}

.login-spin {
	padding-top: 80px;
}
</style>
