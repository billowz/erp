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
        style="padding:10px;"
      >
        <Form-item
          label="客户"
          prop="consumer"
        >
          <Select
            filterable
            v-model="editData.consumer"
            placeholder="请选择客户"
            @on-change="onChangeConsumer"
            :disabled="!!editData.id"
          >
            <Option
              v-for="item in consumers"
              :value="item.id"
              :key="item.id"
              :label="item.name +(item.phone ? ' (' + item.phone + ')' : '')"
            >
              <Row>
                <Col span="11">
                {{item.name}}
                </Col>
                <Col
                  span="11"
                  style="text-align:right;"
                >
                {{item.phone}}
                </Col>
              </Row>
            </Option>
          </Select>
        </Form-item>

        <Row v-if="editOrderConsumer">
          <Col span="11">
          <Form-item
            label="会员卡"
            prop="consumerCard"
          >
            {{editOrderConsumer.card}}
          </Form-item>
          </Col>
          <Col span="11">
          <Form-item
            label="会员折扣"
            prop="consumerDiscount"
          >
            {{editOrderConsumer.discount }} 折
          </Form-item>
          </Col>
        </Row>

        <Row>
          <Col span="11">
          <Form-item
            label="总价"
            prop="totalPrice"
          >
            <InputNumber
              v-model="editData.totalPrice"
              disabled
            >
              <span slot="prepend">￥</span></InputNumber>
          </Form-item>
          </Col>
          <Col span="11">
          <Form-item
            label="优惠金额"
            prop="discountPrice"
          >
            <InputNumber
              v-model="editData.discountPrice"
              :min="0"
              @on-change="change(editData,'discountPrice', updatePay)"
              :disabled="!!editData.id"
            >
              <span slot="prepend">￥</span>
            </InputNumber>
          </Form-item>
          </Col>
        </Row>

        <Row>
          <Col span="11">
          <Form-item
            label="支付金额"
            prop="pay"
          >
            <InputNumber
              v-model="editData.pay"
              :min="0"
              @on-change="change(editData,'pay', onChangePay)"
            >
              <span slot="prepend">￥</span>
              <span slot="append">{{editData.payType}}</span>
            </InputNumber>
          </Form-item>

          </Col>
          <Col span="11">
          <Form-item
            label="支付方式"
            prop="payType"
          >
            <Select
              filterable
              v-model="editData.payType"
              filterable
            >
              <Option value="现金">现金</Option>
              <Option value="微信">微信</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="银行卡">银行卡</Option>
            </Select>
          </Form-item>
          </Col>
        </Row>

        <Row v-if="editOrderConsumer && !editOrderConsumer.disableScore">
          <Col span="11">
          <Form-item
            label="积分"
            prop="score"
          >
            <InputNumber
              v-model="editData.score"
              :min="0"
              :precision="0"
              @on-change="change(editData,'score')"
            >
            </InputNumber>
          </Form-item>
          </Col>
          <Col span="11">
          <Form-item
            label="当前积分"
            prop="currScore"
          >
            <span style="color:green;">{{ editOrderConsumer.score }}</span>
            <span v-if="editData.score != editData.orgScore">
              <span style="color:green;">{{ editData.score > editData.orgScore?'+':'-' }}</span>
              <span style="color:red;">{{ Math.abs(editData.score - editData.orgScore) }}</span>
            </span>
          </Form-item>
          </Col>
        </Row>

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
            icon="md-add"
            shape="circle"
            size="large"
            @click="addItem()"
          ></Button>
          </Col>
        </Row>
        <Row>
          <Col span="7">
          商品
          </Col>
          <Col span="3">
          单价
          </Col>
          <Col span="3">
          数量
          </Col>
          <Col span="3">
          折扣
          </Col>
          <Col span="3">
          优惠
          </Col>
          <Col span="3">
          总价
          </Col>
          <Col span="2">

          </Col>
        </Row>
        <Row
          v-for="(item,index) in editData.items"
          :key="index"
          style="margin-top:5px"
          :style="{color: item.product && item.count?'green':'#999'}"
        >
          <Col span="7">
          <Select
            filterable
            v-model="item.product"
            placeholder="请选择商品"
            @on-change="changeProduct(item)"
          >
            <Option
              v-for="product in products"
              :value="product.id"
              :key="product.id"
              :label="`${product.name} (#${product.stock}) (￥${product.unitPrice})`"
              v-if="item.product === product.id || !selProducts[product.id]"
            >
              <Row style="color:#000;line-height: 100%;">
                <Col span="16">{{ product.name}}</Col>
                <Col span="4"># <span style="color:green;">{{product.stock}}</span></Col>
                <Col span="4">￥ <span style="color:green;">{{product.unitPrice}}</span></Col>
              </Row>
            </Option>
          </Select>
          </Col>

          <Col span="3">
          <InputNumber
            v-model="item.unitPrice"
            :min="0"
            @on-change="change(item, 'unitPrice')"
          >
            <span slot="prepend">￥</span>
          </InputNumber>
          </Col>

          <Col span="3">
          <InputNumber
            v-model="item.count"
            :min="0"
            :max="Math.max(productMap[item.product] ? productMap[item.product].stock : 0, item.orgCount||0)"
            :precision="0"
            @on-change="change(item, 'count', onChangeItemPrice)"
          >
            <span slot="prepend">#</span>
          </InputNumber>
          </Col>

          <Col span="3">
          <InputNumber
            v-model="item.discount"
            :min="0"
            :max="10"
            :step="0.1"
            @on-change="change(item, 'discount', onChangeItemPrice)"
          >
            <span slot="prepend">折</span>
          </InputNumber>
          </Col>
          <Col span="3">
          <InputNumber
            v-model="item.discountPrice"
            :min="0"
            @on-change="change(item, 'discountPrice', updateItemTotalPrice)"
          >
            <span slot="prepend">￥</span>
          </InputNumber>
          </Col>
          <Col span="3">
          <InputNumber
            v-model="item.totalPrice"
            :min="0"
            @on-change="change(item, 'totalPrice', onChangeItemTotalPrice)"
          >
            <span slot="prepend">￥</span>
          </InputNumber>
          </Col>

          <Col span="2">
          <Button
            type="text"
            shape="circle"
            icon="md-remove"
            size="large"
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
			selProducts: {},
			editRule: {
				consumer: [{ required: true, message: `请选择客户`, trigger: 'blur' }],
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
				discountComment: [],
				items: []
			},
			tableHeader: [
				{
					title: '客户',
					key: 'consumer.name'
				},
				{
					title: '客户电话',
					key: 'consumer.phone',
					align: 'right'
				},
				{
					title: '会员卡号',
					key: 'consumer.card',
					align: 'right'
				},
				{
					title: '原价',
					key: 'orgTotalPrice'
				},
				{
					title: '总价',
					key: 'totalPrice',
					type: 'number'
				},
				{
					title: '支付金额',
					key: 'pay',
					type: 'number'
				},
				{
					title: '优惠总金额',
					key: 'totalDiscountPrice',
					type: 'number'
				},
				{
					title: '积分',
					key: 'score',
					type: 'number'
				},
				{
					title: '支付方式',
					key: 'payType'
				},
				{
					title: '利润',
					key: 'profit',
					type: 'number'
				}
			]
		}
	},
	computed: {
		itemSize() {
			return (this.editData.items || []).filter(item => item.product && item.count).length
		},
		editOrderConsumer() {
			const id = this.editData.consumer
			return id && this.consumerMap[id]
		}
	},
	created() {
		this.loadRels()
	},
	methods: {
		onEdit(data) {
			this.setEdit(
				Object.assign(
					{
						totalPrice: 0,
						pay: 0,
						score: 0,
						discountPrice: 0,
						payType: '现金',
						changed: !!data.id || {}
					},
					data,
					{
						orgScore: data.score || 0,
						consumer: data.fk_consumer,
						items: data.items
							? data.items.map(item =>
									Object.assign({}, item, {
										product: item.fk_product,
										orgCount: item.count,
										changed: !!item.id || {}
									})
							  )
							: []
					}
				)
			)
			this.updateSelProducts()
			!this.editData.id && this.addItem()
		},
		change(data, name) {
			if (data.changed !== true) data.changed[name] = true
			for (var i = 2; i < arguments.length; i++) arguments[i].call(this, data)
		},
		isChanged(data, name) {
			return data.changed === true || data.changed[name]
		},
		setUnchanged(data, name, value, cb) {
			if (!this.isChanged(data, name)) {
				if (typeof value === 'function') value.call(this, data)
				else data[name] = value
			} else {
				cb && cb.call(this, data)
			}
		},
		addChange(data, name) {
			data.changed[name] = true
		},
		onChangeConsumer() {
			const data = this.editData
			const consumer = this.editOrderConsumer
			consumer &&
				data.items.forEach(item => {
					this.onChangeItemPrice(item)
					this.setUnchanged(item, 'discount', () => {
						item.discount = consumer.discount
						this.onChangeItemPrice(item)
					})
				})
		},
		onChangeTotalPrice() {
			const data = this.editData

			data.orgTotalPrice = money(
				data.items.reduce((total, item) => total + (item.product ? item.orgTotalPrice * item.count : 0), 0)
			)
			data.totalPrice = money(data.items.reduce((total, item) => total + (item.product ? item.totalPrice : 0), 0))

			this.setUnchanged(data, 'pay', this.updatePay, this.onChangePay)
		},
		updatePay() {
			const data = this.editData
			data.pay = Math.max(money(data.totalPrice - data.discountPrice), 0)
			this.onChangePay()
		},
		onChangePay() {
			const data = this.editData
			data.discountPrice = Math.max(money(data.totalPrice - data.pay), 0)
			this.setUnchanged(data, 'score', data.pay)
		},
		addItem() {
			const consumer = this.editOrderConsumer
			this.editData.items.push({
				orgUnitPrice: 0,
				count: 0,
				unitPrice: 0,
				discount: consumer ? consumer.discount : 10,
				discountPrice: 0,
				totalPrice: 0,
				changed: {}
			})
		},
		removeItem(index) {
			this.editData.items.splice(index, 1)
			this.updateSelProducts()
			this.onChangeTotalPrice()
		},
		changeProduct(item) {
			const product = this.productMap[item.product]
			item.orgUnitPrice = product.unitPrice
			item.count = Math.min(product.stock, item.count || 1)
			this.setUnchanged(item, 'unitPrice', product.unitPrice)

			this.onChangeItemPrice(item)

			this.updateSelProducts()
		},
		itemTotalPrice(item) {
			return item.unitPrice * item.count * (item.discount / 10)
		},
		updateItemTotalPrice(item) {
			item.totalPrice = Math.max(money(this.itemTotalPrice(item) - item.discountPrice), 0)
			this.onChangeItemTotalPrice(item)
		},
		updateItemDiscountPrice(item) {
			item.discountPrice = Math.max(money(this.itemTotalPrice(item) - item.totalPrice), 0)
		},
		onChangeItemTotalPrice(item) {
			this.updateItemDiscountPrice(item)
			this.onChangeTotalPrice()
		},
		onChangeItemPrice(item) {
			this.setUnchanged(item, 'totalPrice', this.updateItemTotalPrice, this.updateItemDiscountPrice)
		},
		updateSelProducts() {
			this.selProducts = this.editData.items.reduce(
				(map, item) => (item.product && (map[item.product] = true), map),
				{}
			)
		},
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
		editorLoad(data) {
			this.loadRels()
			this.onEdit(data)
		},
		onSave(data) {
			return new Promise((resolve, reject) => {
				this.$refs.editForm.validate(rs => {
					if (rs) {
						const data = this.editData
						const items = data.items
							.filter(item => item.product && item.count)
							.map(item => ({
								id: item.id,
								product: item.product,
								count: item.count,
								discount: item.discount,
								unitPrice: item.unitPrice,
								totalPrice: item.totalPrice
							}))
						items.length
							? resolve(
									Object.assign(
										Object.keys(this.editRule).reduce(
											(obj, key) => (
												(obj[key] = data[key] === null ? undefined : data[key]), obj
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
