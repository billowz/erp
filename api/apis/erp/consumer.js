const defAPI = require('../../api')
const BaseJoi = require('joi'),
	Extension = require('joi-date-extensions'),
	joi = BaseJoi.extend(Extension)

module.exports = defAPI('Consumer', [
	defAPI.save(
		{
			name: joi.string().min(2),
			comment: joi.string(),
			card: joi.string(),
			phone: joi.string(),
			weixin: joi.string(),
			birthday: joi.date().format('YYYY-MM-DD'),
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
	defAPI.del((id, { model }) => model.destroy({ where: { id } }), '客户')
])
