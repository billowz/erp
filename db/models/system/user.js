const defModel = require('../../model')
const _ = require('lodash')
const Promise = require('bluebird')

module.exports = defModel((sequelize, DataTypes) => {
	Object.assign(
		sequelize.define(
			'User',
			{
				username: {
					type: DataTypes.STRING,
					allowNull: false,
					unique: true
				},
				password: { type: DataTypes.STRING, allowNull: false },
				disabled: { type: DataTypes.BOOLEAN, defaultValue: false },
				admin: { type: DataTypes.BOOLEAN, defaultValue: false },
				lastLogin: { type: DataTypes.DATE }
			},
			{
				defaultScope: {
					attributes: {
						exclude: ['password']
					}
				}
			}
		).prototype,
		{
			hasRole(roleName) {
				return this.getRoles().then(roles => {
					let result = false
					if (roleName && roles && roles.length) {
						_.forEach(roles, role => {
							if (role.get('name') === roleName) {
								result = true
								return false
							}
						})
					}
					return result
				})
			},
			getRolePermissions() {
				const result = {
					roles: [],
					permissions: []
				}
				return this.getRoles().then(roles => {
					roles = roles || []
					const promises = _.map(roles, role => {
						result.roles.push(role.name)
						return role.getPermissions()
					})
					return Promise.all(promises).then(permissions => {
						permissions = _.flatten(permissions || [])
						_.each(permissions, permission => {
							if (!_.includes(result.permissions, permission.name)) {
								result.permissions.push(permission.name)
							}
						})
						return result
					})
				})
			}
		}
	)
})
