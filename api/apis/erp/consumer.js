const defAPI = require('../../api')
const joi = require('joi')

module.exports = defAPI('Consumer', [
	defAPI.save(
		{
			name: joi.string().min(3),
			comment: joi.string(),
			card: joi.string(),
			phone: joi.string(),
			weixin: joi.string(),
			discount: joi
				.number()
				.min(6)
				.max(10),
			score: joi
				.number()
				.min(0)
				.default(0),
			disableScore: joi.boolean(),
			createRequires: 'name,discount,score,disableScore'
		},
		(data, { model }) => model.create(data),
		(id, data, { model }) => model.update(data, { where: { id } })
	),
	defAPI.list({}, (query, { model }) => model.findAndCountAll(query)),
	defAPI.info((id, { model }) => model.findById(id)),
	defAPI.del((id, { model }) => model.destroy({ where: { id } }))
])
