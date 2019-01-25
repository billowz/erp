const defAPI = require('../../api')
const joi = require('joi')

module.exports = defAPI('ProductType', [
	defAPI.save(
		{
			name: joi.string().min(3),
			comment: joi.string(),
			createRequires: 'name'
		},
		(data, { model }) => model.create(data),
		(id, data, { model }) => model.update(data, { where: { id } })
	),
	defAPI.list({}, (query, { model }) => model.findAndCountAll(query)),
	defAPI.info((id, { model }) => model.findById(id)),
	defAPI.del((id, { model }) => model.destroy({ where: { id } }))
])
