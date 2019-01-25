<template>
  <Table
    ref="module"
    :title="title"
    api="saleOrders"
    :header="tableHeader"
    :editData="edit"
    :editorLoad="editorLoad"
    :onEdit="onEdit"
    :onSave="onSave"
    :onEditEnd="onEditEnd"
  >

    <template slot="editor">

      <Form
        ref="editForm"
        :model="editData"
        :rules="editRule"
        :label-width="80"
        class="scroll"
        style="height: 450px;overflow-y: auto; padding:10px;"
      >
        <Form-item
          label="客户"
          prop="consumer"
        >
          <Select
            v-model="editData.consumer"
            placeholder="请选择客户"
            @on-change="changeConsumer"
            :disabled="!!editData.id"
          >
            <Option
              v-for="item in consumers"
              :value="item.id"
              :key="item.id"
            >{{ item.name +(item.phone ? ' (' + item.phone + ')' : '')}}</Option>
          </Select>
        </Form-item>

        <Row>
          <Col span="11">
          <Form-item
            label="折扣"
            prop="discount"
          >
            <Input
              v-model="editData.discount"
              :number="true"
              @on-change="updateDiscount"
            >
            <span slot="append">折</span>
            </Input>
          </Form-item>
          </Col>
          <Col span="11">
          <Form-item label="折扣价">
            <Input
              disabled
              :value="calcPayPrice()"
            >
            <span slot="prepend">￥</span>
            </Input>
          </Form-item>
          </Col>
        </Row>

        <Row>
          <Col span="11">
          <Form-item
            label="总金额"
            prop="price"
          >
            <Input
              v-model="editData.price"
              disabled
            >
            <span slot="prepend">￥</span></Input>
          </Form-item>
          </Col>
          <Col span="11">
          <Form-item
            label="优惠金额"
            prop="discountPrice"
          >
            <Input
              v-model="editData.discountPrice"
              :number="true"
              @on-change="updateDiscount"
              :disabled="!!editData.id"
            >
            <span slot="prepend">￥</span>
            </Input>
          </Form-item>
          </Col>
        </Row>

        <Row>
          <Col span="11">
          <Form-item
            label="支付金额"
            prop="pay"
          >
            <Input
              v-model="editData.pay"
              :number="true"
              @on-change="updatePay"
            >
            <span slot="prepend">￥</span>
            <span slot="append">{{editData.payType}}</span>
            </Input>
          </Form-item>

          </Col>
          <Col span="11">
          <Form-item
            label="支付方式"
            prop="payType"
          >
            <Select
              v-model="editData.payType"
              filterable
            >
              <Option value="现金">现金</Option>
              <Option value="微信">微信</Option>
              <Option value="支付宝">支付宝</Option>
            </Select>
          </Form-item>
          </Col>
        </Row>

        <Form-item
          label="积分"
          prop="score"
        >
          <Input
            v-model="editData.score"
            :number="true"
            :disabled="!!editData.id"
          >
          </Input>
        </Form-item>
        <!--
        <Form-item
          label="优惠说明"
          prop="discountComment"
        >
          <Input
            v-model="editData.discountComment"
            type="textarea"
          ></Input>
        </Form-item> -->

        <Form-item
          label="备注"
          prop="comment"
        >
          <Input
            v-model="editData.comment"
            type="textarea"
          ></Input>
        </Form-item>

        <Row>
          <Col span="22"><b>商品清单</b> (<b>{{itemSize}}</b>)</col>
          <Col span="2">
          <Button
            type="text"
            icon="plus"
            @click="addItem()"
          ></Button>
          </Col>
        </Row>
        <Row
          v-for="(item,key,index) in editData.items"
          :key="index"
          style="margin-top:5px"
        >
          <Col span="1">
          <Icon
            type="checkmark"
            :style="'color:'+(item.product && item.count?'green':'#eee')"
          ></Icon>
          </Col>
          <Col
            span="8"
            style="padding:0 5px;"
          >
          <Select
            v-model="item.product"
            placeholder="请选择商品"
            @on-change="changeProduct(item)"
          >
            <Option
              v-for="product in products"
              :value="product.id"
              :key="product.id"
            >{{ product.name}} (￥{{product.price}})</Option>
          </Select>
          </Col>

          <Col
            span="4"
            style="padding-right:5px;"
          >
          <Input
            v-model="item.price"
            :number="true"
            @on-change="updateItem(item)"
          >
          <span slot="prepend">￥</span>
          </Input>
          </Col>

          <Col
            span="4"
            style="padding-right:5px;"
          >
          <Input
            v-model="item.count"
            :number="true"
            @on-change="updateItem(item)"
          >
          <span slot="prepend">#</span>
          </Input>
          </Col>

          <Col
            span="5"
            style="padding-right:5px;"
          >
          <Input
            disabled
            v-model="item.totalPrice"
          >
          <span slot="prepend">￥</span>
          </Input>
          </Col>

          <Col span="2">
          <Button
            type="text"
            icon="minus"
            style="color:#c40000"
            @click="removeItem(index)"
          ></Button>
          </Col>
        </Row>

      </Form>
    </template>
  </Table>
</template>
<script>
import Table from '@/components/Table'
const title = '销售单'
function money(m) {
	return Math.round(m * 100) / 100
}
export default {
	data() {
		return {
			title,
			edit: null,
			editData: {},
			consumers: [],
			consumerMap: {},
			products: [],
			productMap: {},
			editRule: {
				consumer: [{ required: true, message: `请选择客户`, trigger: 'blur' }],
				discount: [
					{
						required: true,
						type: 'number',
						min: 6,
						max: 10,
						message: `商品折扣: 6 折 ~ 10 折`,
						trigger: 'blur'
					}
				],
				discountPrice: [
					{
						required: true,
						type: 'number',
						min: 0,
						message: `请输入优惠金额`,
						trigger: 'blur'
					}
				],
				discountComment: [],
				comment: [],
				score: [
					{
						required: true,
						type: 'number',
						min: 0,
						message: `请输入积分`,
						trigger: 'blur'
					}
				],
				price: [
					{
						required: true,
						type: 'number',
						min: 0,
						message: `金额异常`,
						trigger: 'blur'
					}
				],
				pay: [
					{
						required: true,
						type: 'number',
						min: 0,
						message: `请输入支付金额`,
						trigger: 'blur'
					}
				],
				payType: [{ required: true, message: `请选择支付方式`, trigger: 'blur' }],
				items: []
			},
			tableHeader: [
				{
					title: '客户',
					key: 'consumer.name',
					render: (h, params) => h('span', `${params.row.consumer.name}`)
				},
				{
					title: '客户电话',
					key: 'consumer.phone'
				},
				{
					title: '会员卡号',
					key: 'consumer.card'
				},
				{
					title: '总金额',
					key: 'price'
				},
				{
					title: '积分',
					key: 'score'
				},
				{
					title: '支付金额',
					key: 'pay'
				},
				{
					title: '优惠金额',
					key: 'discountPrice'
				},
				{
					title: '支付方式',
					key: 'payType'
				},
				{
					title: '折扣',
					key: 'discount'
				}
			]
		}
	},
	computed: {
		itemSize() {
			return (this.editData.items || []).filter(item => item.product && item.count).length
		}
	},
	created() {
		this.loadRels()
	},
	methods: {
		loadRels() {
			this.$http
				.get('consumers', {
					params: {
						limit: 1000
					}
				})
				.then(res => {
					this.consumers = res.data.data.rows
					this.consumerMap = this.consumers.reduce((map, c) => ((map[c.id] = c), map), {})
				})
			this.$http
				.get('products', {
					params: {
						limit: 1000
					}
				})
				.then(res => {
					this.products = res.data.data.rows
					this.productMap = this.products.reduce((map, c) => ((map[c.id] = c), map), {})
				})
		},
		changeConsumer() {
			const consumer = this.consumerMap[this.editData.consumer]
			if (consumer) {
				const data = this.editData
				data.discount = consumer.discount
				this.updateDiscount()
				if (!data.id) data.score = consumer.disableScore ? 0 : data.price
			}
		},
		updatePay() {
			const data = this.editData

			data.discountPrice = Math.max(money(this.calcPayPrice() - data.pay), 0)
		},
		updateDiscount() {
			const data = this.editData

			if (data.id) {
				this.updatePay()
			} else {
				data.pay = Math.max(money(this.calcPayPrice() - data.discountPrice), 0)
			}
		},
		updatePrice() {
			const data = this.editData

			data.price = money(
				data.items.reduce((total, item) => (item.product ? total + item.price * item.count : total), 0)
			)
			this.updateDiscount()
			if (!data.id && data.consumer && !data.consumer.disableScore) data.score = data.price
		},
		calcPayPrice() {
			const data = this.editData
			return money(data.price * (data.discount / 10))
		},
		addItem() {
			this.editData.items.push({
				product: undefined,
				price: 0,
				count: 1,
				totalPrice: '-'
			})
		},
		removeItem(index) {
			this.editData.items.splice(index, 1)
			this.updatePrice()
		},
		changeProduct(item) {
			const product = this.productMap[item.product]
			if (product) {
				item.price = product.price
				this.updateItem(item)
			} else {
				item.product = undefined
			}
		},
		updateItem(item) {
			item.price = Math.max(item.price, 0)
			item.count = item.count < 0 || !isFinite(item.count) ? 1 : item.count
			item.totalPrice = item.product ? money(item.price * item.count) : '-'
			this.updatePrice()
		},
		onEdit(data) {
			this.setEdit(
				Object.assign({ price: 0, pay: 0, discount: 10, score: 0, discountPrice: 0, payType: '现金' }, data, {
					consumer: data.fk_consumer,
					items: data.items
						? data.items.map(item =>
								Object.assign({}, item, {
									product: item.fk_product,
									totalPrice: money(item.price * item.count)
								})
						  )
						: []
				})
			)
			!this.editData.id && this.addItem()
		},
		editorLoad(data) {
			this.onEdit(data)
		},
		onSave(data) {
			return new Promise((resolve, reject) => {
				this.$refs.editForm.validate(rs => {
					if (rs) {
						const data = this.editData
						const items = data.items
							.filter(item => item.product && item.count)
							.map(item => ({ product: item.product, count: item.count, price: item.price }))
						items.length
							? resolve(
									Object.assign(
										Object.keys(this.editRule).reduce(
											(obj, key) => (
												key !== 'price' &&
													(obj[key] = data[key] === null ? undefined : data[key]),
												obj
											),
											{ id: data.id }
										),
										{ items }
									)
							  )
							: reject('请确认商品清单')
					} else {
						reject()
					}
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
