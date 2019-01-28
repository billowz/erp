const chalk = require('chalk')
const _ = require('lodash')
const { plural } = require('../util/string')

function defModel(model, associate) {
	return function(sequelize, DataTypes) {
		const define = sequelize.define,
			models = []

		sequelize.define = function(name, attrs, options) {
			attrs.id = attrs.id || {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV1,
				primaryKey: true
			}
			options = Object.assign(
				{
					tableName: 'tb_' + _.snakeCase(name),
					attributes: {
						exclude: ['deletedAt']
					},
					freezeTableName: true,
					timestamps: true,
					paranoid: false,
					charset: 'utf8'
				},
				options
			)

			const model = define.call(sequelize, name, attrs, options)
			models.push(model)

			console.log('define Model:', chalk.green(`${model.name} (${model.tableName})`))
			return model
		}
		model(sequelize, DataTypes)
		sequelize.define = define
		return [models, associate]
	}
}
defModel.oneToMany = (one, many, options = { onDelete: 'NO ACTION' }) => {
	const [One, oneOpts] = parseRelModel(one, false, true)
	const [Many, manyOpts] = parseRelModel(many, true)

	console.log(
		'define Associate:',
		chalk.green(
			`${One.name}.${manyOpts.as} <- 1:[${Many.tableName}](${oneOpts.foreignKey}):N -> ${Many.name}.${oneOpts.as}`
		)
	)

	Many.belongsTo(One, Object.assign({}, options, oneOpts))
	One.hasMany(Many, Object.assign({}, options, manyOpts, { foreignKey: oneOpts.foreignKey }))
}

defModel.manyToMany = (many1, many2, through, options) => {
	const [Many1, many1Opts] = parseRelModel(many1, true, true)
	const [Many2, many2Opts] = parseRelModel(many2, true, true)

	if (typeof through !== 'string') {
		options = through || {}
	} else {
		options = Object.assign({ through }, options)
	}

	options.through = options.through || `rel_${_.snakeCase(Many1.name)}_${_.snakeCase(Many2.name)}`

	console.log(
		'define Associate:',
		chalk.green(
			`${Many1.name}.${many1Opts.as} <- N:(${many1Opts.foreignKey})[${options.through}](${
				many2Opts.foreignKey
			}):N -> ${Many2.name}.${many2Opts.as}`
		)
	)
	Many1.belongsToMany(Many2, Object.assign({}, options, many2Opts, { foreignKey: many1Opts.foreignKey }))
	Many2.belongsToMany(Many1, Object.assign({}, options, many1Opts, { foreignKey: many2Opts.foreignKey }))
}

module.exports = defModel

function relAs(Model, many) {
	name = _.lowerFirst(Model.name)
	return many ? plural(name) : name
}

function relFK(Model, many) {
	return _.snakeCase(Model.name)
}

function parseRelModel(target, many, fk) {
	let Model, options
	if (Array.isArray(target)) {
		Model = target[0]
		options = {
			as: target[1],
			foreignKey: target[2]
		}
	} else if (typeof target !== 'object') {
		Model = target
		options = {}
	} else {
		Model = target.model
		options = target
		delete target.model
	}
	options.as = options.as || relAs(Model, many)
	options.foreignKey = fk && 'fk_' + (options.foreignKey || relFK(Model, many))
	return [Model, options]
}
