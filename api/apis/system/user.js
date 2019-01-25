const defAPI = require('../../api')
const joi = require('joi')
const pw = require('credential')()
const _ = require('lodash')

module.exports = defAPI('User', [
	defAPI.save(
		{
			username: joi
				.string()
				.min(3)
				.required(),
			password: joi.string().min(6),
			disabled: joi.boolean().default(false),
			roles: joi.array().default([])
		},
		(data, { model }) =>
			pw.hash(data.password || '123456').then(password => model.create(_.assign(data, { password }))),
		(id, data, { model }) => {
			const pro = data.password
				? pw.hash(data.password).then(password => Promise.resolve(_.assign(data, { password })))
				: (delete data.password, Promise.resolve(data))
			return pro.then(data => model.update(data, { where: { id } }))
		}
	),
	defAPI.list({}, (query, { model, models }) =>
		model.findAndCountAll(_.assign({ include: [{ model: models.Role, as: 'roles' }], query, distinct: true }))
	),
	defAPI.info((id, { model }) => model.findById(id, { include: [{ model: models.Role, as: 'roles' }] })),
	defAPI.del((id, { model }) => model.destroy({ where: { id } })),
	{
		path: '/:id/roles',
		params: {
			id: joi
				.string()
				.uuid()
				.required()
		},
		process: ([{ id }], { models }) =>
			models.Role.findAll({
				where: {
					'$users.id$': id
				}
			})
	}
])
