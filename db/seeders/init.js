require('dotenv').config()

const Promise = require('bluebird')
const credential = require('credential')
const pw = credential()
const chalk = require('chalk')

const { sequelize, User, Role, Permission, ProductType, Consumer } = require('../models')
const adminPwd = process.env.ADMIN_SEED_PASSWORD || 'password'
const testPwd = process.env.TEST_SEED_PASSWORD || 'password'

module.exports = {
	up: function() {
		if (adminPwd.length < 6) throw new Error('Invalid admin password')
		if (testPwd.length < 6) throw new Error('Invalid test password')
		return sequelize.transaction(transaction =>
			Promise.all([pw.hash(adminPwd), pw.hash(testPwd)])
				.then(pwds => {
					console.log(chalk.green(`init default users: admin/${adminPwd}/${pwds[0]}, test/${testPwd}`))
					return Promise.all([
						User.create(
							{
								username: 'admin',
								password: pwds[0]
							},
							{ transaction }
						),
						User.create(
							{
								username: 'test',
								password: pwds[1]
							},
							{ transaction }
						)
					])
				})
				.then(([admin, test]) => {
					console.log(chalk.green(`init default rules`))
					return Promise.all([
						Role.create(
							{
								name: 'admin',
								comment: '管理员'
							},
							{ transaction }
						),
						Role.create(
							{
								name: 'member',
								comment: '普通用户'
							},
							{ transaction }
						)
					]).then(([radmin, member]) => {
						console.log(chalk.green(`init default user rules`))
						return Promise.all([
							admin.setRoles([radmin, member], { transaction }),
							test.setRoles([member], { transaction })
						]).then(() => {
							return Promise.resolve([radmin, member])
						})
					})
				})
				.then(([radmin, member]) => {
					console.log(chalk.green(`create default permissions`))
					return Promise.all(
						[].map(data => {
							return Permission.create(data, { transaction })
						})
					).then(permissions => {
						console.log(chalk.green(`init default rule permissions`))
						return Promise.all(
							member.setPermissions(permissions, { transaction }),
							radmin.setPermissions(permissions, { transaction })
						)
					})
				})
				.then(() => {
					console.log(chalk.green(`init default product type`))
					return ProductType.create(
						{
							name: '默认分类',
							comment: '默认分类'
						},
						{ transaction }
					)
				})
				.then(() => {
					console.log(chalk.green(`init default consumer`))
					return Consumer.create(
						{
							name: '匿名客户',
							discount: 10,
							disableScore: true,
							comment: '匿名客户'
						},
						{ transaction }
					)
				})
		)
	},

	down: function(queryInterface) {
		return queryInterface
			.bulkDelete('tb_user', null, {})
			.then(() => {
				return queryInterface.bulkDelete('tb_role', null, {})
			})
			.then(() => {
				return queryInterface.bulkDelete('tb_permission', null, {})
			})
			.then(() => {
				return queryInterface.bulkDelete('rel_user_role', null, {})
			})
			.then(() => {
				return queryInterface.bulkDelete('rel_role_permission', null, {})
			})
			.then(() => {
				return queryInterface.bulkDelete('tb_product_type', null, {})
			})
			.then(() => {
				return queryInterface.bulkDelete('tb_consumer', null, {})
			})
	}
}
