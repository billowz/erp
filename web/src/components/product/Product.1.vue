<template>
  <Module
    ref="module"
    :title="title"
    tableAPI="products"
    :tableHeader="tableHeader"
    :tableParam="tableParam"
    :getDataLabel="getDataLabel"
    :beforeEdit="beforeEdit"
    :onSave="onSave"
    :onCancelSave="onCancelSave"
    :beforeDelete="beforeDelete"
    :onDelete="onDelete"
    :onCancelDelete="onCancelDelete"
  >

    <template slot="editForm">
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
          label="编码"
          prop="code"
        >
          <Input v-model="editData.code"></Input>
        </Form-item>
        <Form-item
          label="分类"
          prop="fk_type"
        >
          <Select v-model="editData.fk_type">
            <Option
              v-for="item in types"
              :value="item.id"
              :key="item.id"
            >{{ item.name }}</Option>
          </Select>
        </Form-item>
        <Form-item
          label="单位"
          prop="unit"
        >
          <Select
            v-model="editData.unit"
            filterable
          >
            <Option value="件">件</Option>
            <Option value="盒">盒</Option>
            <Option value="套">套</Option>
            <Option value="包">包</Option>
          </Select>
        </Form-item>
        <Form-item
          label="库存"
          prop="stock"
        >
          <Input
            v-model="editData.stock"
            :number="true"
          >
          <span slot="append">{{editData.unit}}</span>
          </Input>
        </Form-item>
        <Form-item
          label="零售价"
          prop="price"
        >
          <Input
            v-model="editData.price"
            :number="true"
          ></Input>
        </Form-item>
        <Form-item
          label="进价"
          prop="purchasePrice"
        >
          <Input
            v-model="editData.purchasePrice"
            :number="true"
          ></Input>
        </Form-item>
        <Form-item
          label="备注"
          prop="comment"
        >
          <Input
            v-model="editData.comment"
            type="textarea"
          ></Input>
        </Form-item>
      </Form>
    </template>
  </Module>
</template>
<script>
import Module from '@/components/Module'
const title = '商品'
export default {
	data() {
		return {
			title,
			editData: {},
			types: [],
			editRule: {
				name: [
					{ required: true, message: `请输入${title}名称`, trigger: 'blur' },
					{ type: 'string', min: 3, message: `${title}名称不能少于3位`, trigger: 'blur' }
				],
				code: [],
				fk_type: [{ required: true, message: `请选择${title}类型`, trigger: 'blur' }],
				comment: [],
				unit: [{ required: true, message: `请选择${title}单位`, trigger: 'blur' }],
				stock: [
					{ required: true, type: 'integer', min: 0, message: `请输入${title}库存 (>=0)`, trigger: 'blur' }
				],
				price: [
					{
						required: true,
						type: 'number',
						min: 0.01,
						message: `请输入${title}零售价 (>0.01)`,
						trigger: 'blur'
					}
				],
				purchasePrice: [
					{
						required: true,
						type: 'number',
						min: 0.01,
						message: `请输入${title}进价 (>0.01)`,
						trigger: 'blur'
					},
					{
						validator: (rule, value, callback) => {
							value > this.editData.price ? callback(new Error('进价 > 零售价')) : callback()
						},
						trigger: 'blur'
					}
				]
			},
			tableHeader: [
				{
					title: '名称',
					key: 'name'
				},
				{
					title: '编码',
					key: 'code'
				},
				{
					title: '分类',
					key: 'type.name'
				},
				{
					title: '单位',
					key: 'unit'
				},
				{
					title: '库存',
					key: 'stock'
				},
				{
					title: '零售价',
					key: 'price'
				},
				{
					title: '进价',
					key: 'purchasePrice'
				}
			]
		}
	},
	created() {
		this.loadTypes()
	},
	methods: {
		loadTypes() {
			this.$http
				.get('productTypes', {
					params: {
						limit: 1000
					}
				})
				.then(res => {
					this.types = res.data.data.rows
				})
		},
		getDataLabel(data) {
			return data.name
		},
		tableParam() {
			return {}
		},
		beforeEdit(data) {
			this.editData = Object.assign({ unit: '件' }, data)
		},
		onSave(save, reject) {
			this.$refs.editForm.validate(rs => {
				const data = this.editData
				rs
					? save(
							Object.keys(this.editRule).reduce(
								(obj, key) => ((obj[key] = data[key] === null ? undefined : data[key]), obj),
								{}
							),
							data.id
					  )
					: reject()
			})
		},
		onCancelSave() {
			this.editData = {}
			this.$refs.editForm.resetFields()
		},

		beforeDelete(datas) {
			return datas.filter(d => d.id)
		},
		onDelete(cb, datas) {
			cb(datas.map(d => d.id))
		},
		onCancelDelete() {}
	},
	components: {
		Module
	}
}
</script>
