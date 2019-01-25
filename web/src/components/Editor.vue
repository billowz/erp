<template>
  <Modal
    v-model="modal"
    :title="editorTitle"
    :width="width"
    :loading="saving"
    :scrollable="true"
    @on-ok="save()"
    @on-cancel="close(false)"
  >
    <slot></slot>
  </Modal>
</template>
<script>
export default {
	props: {
		title: { type: String, required: true },
		width: { type: Number, default: 500 },
		api: { type: String, required: true },
		load: { type: Function },
		data: { type: Object },
		label: { type: Function, default: data => data.name },
		onSave: { type: Function, save: data => data },
		onClose: { type: Function, default: () => {} }
	},
	watch: {
		data(data, odata) {
			this.editData = data
			if (!odata && this.id && this.load) {
				this.loading = true
				this.$http
					.get(`${this.api}/${this.id}`)
					.then(res => {
						this.load(res.data.data)
					})
					.finally(() => {
						this.loading = false
					})
			}
		}
	},
	data() {
		return {
			saving: true,
			editData: this.data,
			loading: false
		}
	},

	computed: {
		modal: {
			get() {
				return !!this.editData
			},
			set() {
				this.editData = null
			}
		},
		id() {
			return this.editData && this.editData.id
		},
		editorTitle() {
			if (this.editData) {
				if (this.editData.id) {
					const label = this.label(this.editData)
					return `修改${this.title}${label && typeof label === 'string' ? `(${label})` : ''}`
				}
			}
			return `创建${this.title}`
		}
	},
	methods: {
		save() {
			if (!this.loading) {
				Promise.resolve(this.onSave(this.editData))
					.then(editData => {
						const { id } = editData
						console.log(`${this.editorTitle}: `, id, editData)
						delete editData.id
						this.$http[id ? 'put' : 'post'](`${this.api}/${id || ''}`, editData || this.editData)
							.then(() => {
								this.$Message.success('保存成功!')
								this.close(true)
							})
							.catch(err => {
								this.resetEditing()
								console.error(err)
							})
					})
					.catch(err => {
						if (err) {
							console.error(err)
							this.$Message.error(err)
						}
						this.resetEditing()
					})
			}
		},
		close(saved) {
			this.editData = null
			this.$nextTick(() => this.onClose(saved))
		},
		resetEditing() {
			this.saving = false
			this.$nextTick(() => (this.saving = true))
		}
	}
}
</script>
