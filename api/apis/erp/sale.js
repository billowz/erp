const defAPI = require('../../api')
const joi = require('joi')

function round(v) {
	return Math.round(v * 100) / 100
}
module.exports = defAPI('SaleOrder', [
	defAPI.ruleSave(
		{
			pay: joi.number().min(0),
			score: joi.number(),
			discountComment: joi.string(),
			payType: joi.string(),
			consumer: joi.string().uuid(),
			items: joi
				.array()
				.min(1)
				.items(
					joi.object({
						id: joi.string().uuid(),
						product: joi
							.string()
							.uuid()
							.required(),
						count: joi
							.number()
							.integer()
							.min(1)
							.required(),
						unitPrice: joi
							.number()
							.min(0)
							.required(),
						totalPrice: joi
							.number()
							.min(0)
							.required(),
						discount: joi
							.number()
							.min(0)
							.max(10)
							.required()
					})
				),
			comment: joi.string(),
			createRequires: 'pay,score,payType,consumer,items'
		},
		{
			modelName: 'SaleOrder',
			name: '销售单',
			rels: {
				consumer: {
					lock: true,
					modelName: 'Consumer',
					fk: 'fk_consumer',
					name: '客户'
				},
				items: {
					modelName: 'SaleOrderItem',
					name: '物品清单',
					fk: 'fk_order',
					many: true,
					casecade: true,
					rels: {
						product: {
							lock: true,
							modelName: 'Product',
							fk: 'fk_product',
							name: '商品'
						}
					},
					saveParam(param, desc, ctx) {
						let stock = null
						const product = desc.getProduct().model,
							item = desc.model

						if (!desc.id) {
							param.purchasePrice = product.purchasePrice
							param.orgUnitPrice = product.unitPrice
							stock = param.count
						} else if (param.count) {
							stock = param.count - item.count
						}
						if (stock) {
							product.stock -= stock
							if (product.stock < 0) throw new Error(`商品 [${product.name}] 库存不足！`)
						}
					},
					save(model, desc, ctx) {
						const product = desc.getProduct().model

						model.discountPrice = round(
							Math.max(model.unitPrice * model.count * (model.discount / 10) - model.totalPrice, 0)
						)

						return product.save({ transaction: ctx.transaction })
					}
				}
			},

			saveParam(param, desc, ctx) {
				const consumer = desc.getConsumer().model

				let score = null
				if (consumer.disableScore) {
					param.score = 0
				} else if (!desc.id) {
					score = param.score
				} else if (param.score >= 0) {
					score = param.score - desc.model.score
				}
				if (score) {
					consumer.score = Math.max(consumer.score + score, 0)
				}
			},

			save(model, desc, ctx) {
				const consumer = desc.getConsumer().model,
					items = desc.getItems()

				model.totalPrice = round(items.reduce((sum, item) => sum + item.model.totalPrice, 0))
				model.orgTotalPrice = round(
					items.reduce((sum, item) => sum + item.model.orgUnitPrice * item.model.count, 0)
				)
				model.totalPurchasePrice = round(
					items.reduce((sum, item) => sum + item.model.purchasePrice * item.model.count, 0)
				)
				model.discountPrice = round(Math.max(model.totalPrice - model.pay, 0))
				model.totalDiscountPrice = Math.max(round(model.orgTotalPrice - model.pay), 0)
				model.profit = round(model.pay - model.totalPurchasePrice)
				if (!consumer.disableScore) {
					return consumer.save({ transaction: ctx.transaction })
				}
			}
		}
	),
	defAPI.list({}, (query, { model, models, sequelize }) =>
		Promise.all([
			model.findAndCountAll(
				Object.assign(
					{
						include: [
							//{ model: models.SaleOrderItem, as: 'items' },
							{ model: models.Consumer, as: 'consumer' },
							{ model: models.User, as: 'user' }
						]
					},
					query
				)
			),
			model.findAll(
				Object.assign(
					{
						attributes: [
							[sequelize.fn('SUM', sequelize.col('pay')), 'pay'],
							[sequelize.fn('SUM', sequelize.col('profit')), 'profit']
						],
						include: [
							//{ model: models.SaleOrderItem, as: 'items' },
							{ attributes: [], model: models.Consumer, as: 'consumer' },
							{ attributes: [], model: models.User, as: 'user' }
						]
					},
					query
				)
			)
		]).then(([records, summary]) => {
			return { count: records.count, rows: records.rows.concat(summary) }
		})
	),
	defAPI.info((id, { model, models }) =>
		model.findById(id, {
			include: [
				{ model: models.SaleOrderItem, as: 'items' },
				{ model: models.Consumer, as: 'consumer' },
				{ model: models.User, as: 'user' }
			]
		})
	),
	defAPI.del(
		(id, { model, sequelize, models }) =>
			sequelize.transaction(transaction =>
				models.SaleOrderItem.destroy({
					where: { fk_order: id },
					transaction
				}).then(() => model.destroy({ where: { id }, transaction }))
			),
		'销售单'
	)
])
