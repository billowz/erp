<template>
  <Table
    ref="module"
    :title="title"
    api="productTypes"
    :header="tableHeader"
    :editData="edit"
    :onEdit="onEdit"
    :onSave="onSave"
    :onEditEnd="onEditEnd"
  >

    <template slot="editor">
      <Form
        ref="editForm"
        :model="editData"
        :rules="editRule"
        :label-width="100"
      >
        <Form-item
          label="名称"
          prop="name"
        >
          <Input v-model="editData.name"></Input>
        </Form-item>
        <Form-item
          label="备注"
          prop="comment"
        >
          <Input
            v-model="editData.comment"
            type="textarea"
            :rows="8"
          ></Input>
        </Form-item>
      </Form>
    </template>
  </Table>
</template>
<script>
import Table from '@/components/Table'
const title = '商品分类'
export default {
	data() {
		return {
			title,
			edit: null,
			editData: {},
			editRule: {
				name: [
					{ required: true, message: `${title}名称不能为空`, trigger: 'blur' },
					{ type: 'string', min: 3, message: `${title}名称不能少于3位`, trigger: 'blur' }
				],
				comment: []
			},
			tableHeader: [
				{
					title: '名称',
					key: 'name'
				},
				{
					title: '备注',
					key: 'comment',
          ellipsis: true,
          tooltip: true
				}
			]
		}
	},
	methods: {
		onEdit(data) {
			this.setEdit(data)
		},
		onSave(data) {
			return new Promise((resolve, reject) => {
				this.$refs.editForm.validate(rs => {
					const data = this.editData
					rs
						? resolve(
								Object.keys(this.editRule).reduce(
									(obj, key) => ((obj[key] = data[key] === null ? undefined : data[key]), obj),
									{ id: data.id }
								)
						  )
						: reject()
				})
			})
		},
		onEditEnd() {
			this.setEdit()
			this.$refs.editForm.resetFields()
		},
		setEdit(data) {
			this.edit = data
			this.editData = data || {}
		}
	},
	components: {
		Table
	}
}
</script>
