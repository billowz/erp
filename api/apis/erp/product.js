const defAPI = require('../../api')
const joi = require('joi')

module.exports = defAPI('Product', [
	defAPI.ruleSave(
		{
			name: joi.string().min(3),
			comment: joi.string(),
			code: joi.string(),
			unit: joi.string(),
			stock: joi.number().integer(),
			minStock: joi.number().integer(),
			price: joi.number(),
			purchasePrice: joi.number(),
			fk_type: joi.string().uuid(),
			createRequires: `name,stock,minStock,price,purchasePrice,fk_type`
		},
		{
			modelName: 'Product',
			name: '商品',
			rels: {
				fk_type: {
					modelName: 'ProductType',
					name: '商品分类'
				}
			}
		}
	),
	defAPI.list({}, (query, { model, models }) =>
		model
			.findAndCountAll(
				Object.assign(
					{
						include: [{ model: models.ProductType, as: 'type' }]
					},
					query
				)
			)
			.then(rs => {
				return Promise.resolve(rs)
			})
	),
	defAPI.info((id, { model, models }) =>
		model.findById(id, {
			include: [{ model: models.ProductType, as: 'type' }]
		})
	),
	defAPI.del((id, { model }) => model.destroy({ where: { id } }))
])
