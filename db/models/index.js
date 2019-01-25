const path = require('path')
const Sequelize = require('sequelize')
const read = require('fs-readdir-recursive')
const basename = path.basename(module.filename)
const env = process.env.NODE_ENV || 'development'
const config = require(__dirname + '/../config.js')[env]
const chalk = require('chalk')

const sequelize = config.use_env_variable
	? new Sequelize(process.env[config.use_env_variable])
	: new Sequelize(config.database, config.username, config.password, config)

read(__dirname)
	.filter(f => f !== basename && /\.js$/.test(f))
	.map(f => path.join(__dirname, f))
	.map(f => {
		console.log('load model from', chalk.green(f))
		return [f, sequelize['import'](f)[1]]
	})
	.forEach(d => {
		if (d[1]) {
			console.log('load associates from', chalk.green(d[0]))
			d[1](sequelize.models, sequelize)
		}
	})

console.log(chalk.green('sync database'))

sequelize.sync({ force: false })

module.exports = Object.assign({ sequelize, Sequelize }, sequelize.models)
