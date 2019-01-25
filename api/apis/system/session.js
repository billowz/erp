const defAPI = require('../../api')
const joi = require('joi')
const pw = require('credential')()
const { resolveOn } = require('../../../util/util')
const authMiddleware = require('../../../middleware/auth')

module.exports = defAPI(null, 'sessions', [
	{
		process(values, { req }) {
			return req.session.user ? [req.session.user] : []
		}
	},
	{
		path: 'post:/',
		body: {
			username: joi
				.string()
				.min(3)
				.required(),
			password: joi
				.string()
				.min(6)
				.required()
		},
		process([{ username, password }], { models, req }) {
			return models.User.findOne({
				where: { username },
				attributes: { include: ['id', 'password'] }
			})
				.then(user => resolveOn(user, user, '用户不存在！'))
				.then(user =>
					pw
						.verify(user.password, password)
						.then(result => resolveOn(result, user, '用户名或密码错误，登录失败！'))
				)
				.then(user =>
					user.getRolePermissions().then(({ roles = [], permissions = [] }) =>
						Promise.resolve(
							(req.session.user = {
								id: user.id,
								username: user.username,
								roles,
								permissions
							})
						)
					)
				)
		}
	},
	{
		path: 'delete:/',
		middlewares: [authMiddleware.login],
		process(values, { req }) {
			req.session.destroy()
		}
	},
	{
		path: 'post:/update-password',
		body: {
			oldPassword: joi
				.string()
				.min(6)
				.required(),
			newPassword: joi
				.string()
				.min(6)
				.required(),
			newPasswordRepeat: joi
				.string()
				.min(6)
				.required()
		},
		middlewares: [authMiddleware.login],
		process([{ oldPassword, newPassword, newPasswordRepeat }], { models, req }) {
			if (newPassword !== newPasswordRepeat) {
				return romise.reject('两个新密码不一致！')
			}
			return models.User.findById(req.user.id, { attributes: { include: ['password'] } })
				.then(user =>
					resolveOn(user, user, () => {
						req.session.destroy()
						return '用户不存在！'
					})
				)
				.then(user =>
					pw.verify(user.password, oldPassword).then(result => resolveOn(result, user, '旧密码错误！'))
				)
				.then(user =>
					pw.hash(newPassword).then(hash =>
						user.update({
							password: hash
						})
					)
				)
		}
	}
])
