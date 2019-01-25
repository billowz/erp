const defAPI = require('../../api')
const joi = require('joi')
const _ = require('lodash')

module.exports = defAPI('Role', [
	defAPI.save(
		{
			name: joi
				.string()
				.min(3)
				.required(),
			comment: joi
				.string()
				.min(2)
				.required(),
			permissions: joi.array().default([])
		},
		(data, { model }) => model.create(data),
		(id, data, { model }) => model.update(data, { where: { id } })
	),
	defAPI.list({}, (query, { model, models }) =>
		model.findAndCountAll(
			_.assign({ include: [{ model: models.Permission, as: 'permissions' }], distinct: true }, query)
		)
	),
	defAPI.info((id, { model }) => model.findById(id, { include: [{ model: models.Permission, as: 'permissions' }] })),
	defAPI.del((id, { model }) => model.destroy({ where: { id } })),
	{
		path: '/:id/permissions',
		params: {
			id: joi
				.string()
				.uuid()
				.required()
		},
		process: ([{ id }], { models }) =>
			models.Permission.findAll({
				where: {
					'$roles.id$': id
				}
			})
	}
])
