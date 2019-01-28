const express = require('express'),
	_ = require('lodash'),
	chalk = require('chalk'),
	models = require('../db/models'),
	Sequelize = require('sequelize'),
	BaseJoi = require('joi'),
	Extension = require('joi-date-extensions'),
	joi = BaseJoi.extend(Extension)
const { plural } = require('../util/string')
const { makeArray, makeMap, resolveOn, assignWithOut } = require('../util/util')
const { notExist } = require('../util/err')

const methodColor = {
	post: chalk.yellow,
	get: chalk.green,
	put: chalk.blue,
	delete: chalk.red,
	patch: chalk.grey
}

function defAPI(modelName, name, apis) {
	const router = express.Router()
	if (arguments.length === 2) {
		apis = name
		name = plural(_.camelCase(modelName))
	}

	if (!modelName && !name) throw new Error('require model name or router name')

	const model = modelName && models[modelName]

	console.info(`define API-Module[${chalk.green(`${name}(${modelName})`)}]: `)

	router.module = name

	parseApis(apis)

	function parseApis(apis) {
		apis.forEach(api => {
			if (Array.isArray(api)) return parseApis(api)

			const { params, query, body } = api
			const path = makeArray(api.path, ['/']),
				validators = []

			reqValidator('params', params)
			reqValidator('query', query)
			reqValidator('body', body)

			path.forEach(path => {
				let method = 'get'
				path = path.replace(/^(get|post|put|delete|patch):/i, (m, g) => {
					method = g.toLowerCase()
					return ''
				})
				if (!/^\//.test(path)) throw new Error('path is not start with /')

				console.info(
					`\tdefine API:`,
					methodColor[method](`${_.padEnd(`[${method}]`, 8)}`),
					chalk.green(name + path),
					validators
						.map(v => `\n\t\t${chalk.blue(_.padStart(v.type + ':', 7))} ${chalk.green(_.keys(v.schema))}`)
						.join('')
				)
				const apiHandle = (req, res) => {
					return Promise.all(validators.map(v => v(req)))
						.then(values => {
							console.info(
								`request API:`,
								methodColor[method](`${_.padStart(`[${method}]`, 10)}`),
								chalk.green(name + path),
								chalk.green(req.baseUrl + req.url),
								validators
									.map(
										(v, i) =>
											`\n\t${chalk.blue(_.padStart(v.type + ':', 7))} ${chalk.green(
												JSON.stringify(values[i])
											)}`
									)
									.join('')
							)

							return api.process(values, {
								model,
								models,
								sequelize: models.sequelize,
								Sequelize: models.Sequelize,
								req,
								res,
								values,
								toJSON() {
									return undefined
								}
							})
						})
						.then(data => {
							return res.reply(data)
						})
						.catch(err => {
							return res.replyError(err)
						})
				}
				Object.assign(apiHandle, {
					middlewares: api.middlewares,
					method,
					path,
					model,
					module: name,
					validators
				})
				router[method](path, api.middlewares || [], apiHandle)
			})

			function reqValidator(type, schema) {
				if (schema) {
					const cb = req => validate(req[type] || {}, schema)
					cb.type = type
					cb.schema = schema
					validators.push(cb)
				}
			}
			function validate(obj, schema) {
				return new Promise((resolve, reject) => {
					const { error, value } = joi.validate(
						_.reduce(obj, (t, v, k) => (v !== undefined && v != null && (t[k] = v), t), {}),
						schema
					)
					if (error) reject(error)
					else resolve(value)
				})
			}
		})
	}

	return router
}

module.exports = defAPI
function parseOrder({ key, order }) {
	const arr = key.split('.')
	arr.push(order.toUpperCase())
	return arr
}
const Op = Sequelize.Op
const conditionOPs = {
	eq: Op.eq,
	ne: Op.ne,
	gte: Op.gte,
	gt: Op.gt,
	lte: Op.lte,
	lt: Op.lt,
	not: Op.not,
	like: Op.like,
	notLike: Op.notLike,
	iLike: Op.iLike,
	notILike: Op.notILike,
	between: Op.between,
	notBetween: Op.notBetween
}
Object.assign(defAPI, {
	methodColor,
	pageParam: {
		offset: joi
			.number()
			.integer()
			.min(0)
			.default(0),
		limit: joi
			.number()
			.integer()
			.min(1)
			.max(1000)
			.default(10),
		sort: joi.array().items(
			joi.object({
				key: joi.string().required(),
				order: joi.string().required()
			})
		),
		condition: joi.array().items(
			joi.object({
				key: joi.string().required(),
				op: joi.string().required(),
				value: joi
					.alternatives()
					.try(
						joi
							.array()
							.items(
								joi.date().format('YYYY-MM-DD'),
								joi.date().format('YYYY-MM-DD HH:mm:ss'),
								joi.string(),
								joi.number()
							),
						joi.date().format('YYYY-MM-DD'),
						joi.date().format('YYYY-MM-DD HH:mm:ss'),
						joi.string(),
						joi.number()
					)
					.required()
			})
		)
	},
	list(params, query) {
		return {
			path: 'get:/',
			query: Object.assign({}, defAPI.pageParam, params),
			process([params], ctx) {
				const sort = params.sort
				delete params.sort
				if (sort) {
					params.order = sort.map(s => parseOrder(s))
				}
				const condition = params.condition
				delete params.condition
				if (condition) {
					const where = {}
					condition.forEach(c => {
						const op = conditionOPs[c.op]
						const key = /\./.test(c.key) ? `$${c.key}$` : c.key
						if (!op) throw new Error('Invalid Condition')
						where[key] = { [op]: /like/i.test(c.op) ? `%${c.value}%` : c.value }
					})
					params.where = where
				}
				console.log(params)
				return query(params, ctx)
			}
		}
	},
	info(get) {
		return {
			path: 'get:/:id',
			params: {
				id: joi
					.string()
					.uuid()
					.required()
			},
			process([{ id }], ctx) {
				return get(id, ctx)
			}
		}
	},
	save(body, create, update) {
		body = parseSaveBodySchema(body)
		return [defAPI.create(body, create), defAPI.update(body, update)]
	},
	create(body, create) {
		return {
			path: 'post:/',
			body,
			process([params], ctx) {
				return create(params, ctx)
			}
		}
	},
	update(body, update) {
		return {
			path: 'put:/:id',
			params: {
				id: joi
					.string()
					.uuid()
					.required()
			},
			body,
			process([{ id }, params], ctx) {
				return update(id, params, ctx)
			}
		}
	},
	del(del) {
		return [
			{
				path: 'delete:/:id',
				params: {
					id: joi
						.string()
						.uuid()
						.required()
				},
				process([{ id }], ctx) {
					return del([id], ctx)
				}
			},
			{
				path: 'delete:/',
				body: {
					ids: joi
						.array()
						.min(1)
						.required()
						.items(
							joi
								.string()
								.uuid()
								.required()
						)
				},
				process([{ ids }], ctx) {
					return del(ids, ctx)
				}
			}
		]
	},
	getModelMap(Model, where, transaction, lock) {
		return Model.findAll({
			where,
			lock: lock ? transaction.LOCK.UPDATE : undefined,
			transaction
		}).then(coll => makeMap(coll, 'id'))
	},
	getModelMapByIds(Model, ids, transaction, lock) {
		return defAPI.getModelMap(
			Model,
			{
				id: { [Sequelize.Op.in]: ids }
			},
			transaction,
			lock
		)
	},
	delModelByIds(Model, ids, transaction) {
		return Model.destroy({
			where: {
				id: { [Sequelize.Op.in]: ids }
			},
			transaction
		})
	},
	ruleSave(body, rule) {
		body = parseSaveBodySchema(body)
		return [
			defAPI.create(body, (body, ctx) => {
				return ruleSave(rule, null, body, ctx)
			}),
			defAPI.update(body, (id, body, ctx) => {
				return ruleSave(rule, id, body, ctx)
			})
		]
	}
})

function ruleSave(rule, id, param, ctx) {
	const context = new SaveContext(rule, id, param, ctx)
	return context.save()
}

class Model {
	constructor(rule, id, param, ctx, path, parent) {
		path = path || []
		this.id = id
		this.rule = rule
		this.param = param
		this.ctx = ctx
		this.path = path
		this.parent = parent
		this.rels = {}
		this.mRels = []
		this.caseCadeRels = [[], []]

		if (param) {
			_.each(rule.rels, (rule, key) => {
				const rpath = path.concat(key)
				const { many, casecade } = rule
				const paramKey = rule.paramKey || key,
					rparam = param[paramKey]

				delete param[paramKey]

				if (casecade) rule.lock = true

				let rel
				if (!many) {
					const fk = rule.fk || key
					if (rparam === false) {
						param[fk] = null
						if (casecade) this.caseCadeRels[0].push({ fk })
					} else if (rparam) {
						if (casecade) {
							const id = rparam.id
							delete rparam.id
							rel = new Model(rule, id, rparam, ctx, rpath, this)
							this.caseCadeRels[0].push({
								rule,
								fk,
								rel
							})
						} else {
							rel = new Model(rule, rparam, null, ctx, rpath, this)
							param[fk] = rparam
						}
					}
				} else if (rparam) {
					const relation = typeof many === 'string' ? many : key
					if (casecade) {
						rel = rparam
							.filter(param => !!param)
							.map(param => {
								const id = param.id
								delete param.id
								return new Model(rule, id, param, ctx, rpath, this)
							})
					} else {
						rel = rparam.filter(id => !!id).map(id => new Model(rule, id, null, ctx, rpath, this))
					}
					this.__addManyRel(rel, relation, rule, rpath)
				}

				this.rels[key] = rel
				this[`get${_.upperFirst(key.replace(/fk_/, ''))}`] = (function(key) {
					return function() {
						return this.rels[key]
					}
				})(key)
			})
		}
		ctx.context.addModel(this, param, rule.lock)
	}
	__addManyRel(models, relation, rule, path) {
		const rel = {
			models,
			dels: [],
			relation,
			rule,
			path,
			setter: `set${_.upperFirst(relation)}`,
			getter: `get${_.upperFirst(relation)}`
		}
		this.mRels.push(rel)
		if (rule.casecade) this.caseCadeRels[1].push(rel)
		return rel
	}
	onLoadModel(model) {
		if (!model) {
			const { rule } = this
			throw notExist(rule.name || rule.modelName)
		}
		this.model = model
		if (this.id) {
			this.caseCadeRels[0].map((fk, rule, rel) => {
				if (model[fk] && (!rel || rel.id !== model[fk])) {
					this.ctx.context.delModel(rule.modelName, [model[fk]])
				}
			})
			return Promise.all(
				this.caseCadeRels[1].map(rel => {
					return model[rel.getter]({
						lock: rel.rule.lock ? this.ctx.transaction.LOCK.UPDATE : undefined,
						transaction: this.ctx.transaction
					}).then(exists => {
						console.log(
							chalk.green(
								`loaded${rel.rule.lock ? '[locked]' : ''} exist relation[${rel.path.join(
									'.'
								)}]: ${exists.map(m => m.id).join(', ')}`
							)
						)
						const map = rel.models.reduce((map, m) => (m.id && (map[m.id] = m), map), {})
						return this.ctx.context.delModel(
							rel.rule.modelName,
							exists.filter(m => !map[m.id]).map(m => m.id)
						)
					})
				})
			)
		}
	}
	margeParam() {
		let { model, rule, param, ctx } = this

		this.caseCadeRels[0].map((fk, rule, rel) => {
			if (rel) param[fk] = rel.model.id
			else delete param[fk]
		})

		if (rule.saveParam) param = rule.saveParam(param, this, ctx) || param

		if (this.id) {
			if (rule.updateParam) param = rule.updateParam(param, this, ctx) || param
		} else if (rule.createParam) {
			param = rule.createParam(param, this, ctx) || param
		}

		console.log(chalk.green(`save ${this.rule.modelName}${this.id ? `[${this.id}]` : ''} with param: `), param)

		Object.assign(model, param)
	}
	beforeSave() {
		const { model, rule, param, ctx } = this

		let p = Promise.resolve(rule.save && rule.save(model, this, ctx))

		if (this.id) {
			return p.then(() => Promise.resolve(rule.update && rule.update(model, this, ctx)))
		}
		return p.then(() => Promise.resolve(rule.create && rule.create(model, this, ctx)))
	}
	save() {
		console.log(chalk.green(`save ${this.rule.modelName}: ${this.model.id}`))

		return this.model.save({ transaction: this.ctx.transaction })
	}
	saveRels() {
		return Promise.all(
			this.mRels.map(rel => {
				console.log(
					chalk.green(`update relation[${rel.path.join('.')}] by ${this.rule.modelName}.${rel.setter}
	${this.model.id}: ${rel.models.map(m => m.model.id).join(', ')}`)
				)

				return this.model[rel.setter](rel.models.map(m => m.model), { transaction: this.ctx.transaction })
			})
		)
	}
}

class SaveContext {
	constructor(rule, id, param, ctx) {
		this.idLoaders = {}
		this.loadPromises = []
		this.saves = []
		this.dels = {}
		this.ctx = Object.assign({ context: this }, ctx)
		rule.lock = true
		this.model = new Model(rule, id, param, this.ctx)
	}
	save() {
		const { saves, dels, ctx } = this
		return ctx.sequelize.transaction(transaction => {
			ctx.transaction = transaction
			return this.load()
				.then(() => {
					saves.forEach(m => m.margeParam())

					return Promise.all(saves.map(m => m.beforeSave()))
						.then(() =>
							Promise.all(
								_.map(dels, (ids, modelName) => {
									console.log(chalk.green(`delete models[${modelName}]: ${ids.join(', ')}`))

									return defAPI.delModelByIds(getModel(modelName, ctx), ids, transaction)
								}).concat(saves.map(m => m.save()))
							)
						)
						.then(() => Promise.all(saves.map(m => m.saveRels())))
				})
				.then(() => {
					ctx.transaction = null
					return ctx
				})
		})
	}
	delModel(modelName, ids) {
		if (ids.length) {
			const { dels } = this
			const _ids = dels[modelName] || (dels[modelName] = [])
			_ids.push.apply(_ids, ids)
		}
	}
	addModel(model, save, lock) {
		this.addIdLoader(model.rule.modelName, model.id, model.onLoadModel, model, lock)
		if (save) {
			this.saves.push(model)
		}
	}
	addIdLoader(modelName, id, cb, scope, lock) {
		const { idLoaders } = this
		if (id) {
			// console.log(chalk.green(`add model loader[${modelName}]: ${id}`))

			const idMap = idLoaders[modelName] || (idLoaders[modelName] = {}),
				list = idMap[id] || (idMap[id] = [])

			if (lock) idMap.lock = lock

			list.push({ cb, scope })
		} else {
			const m = getModel(modelName, this.ctx).build()
			// console.log(chalk.green(`create model[${modelName}]: ${m.id}`))

			const ret = cb.call(scope, m, scope)
			if (ret && typeof ret.then === 'function') this.loadPromises.push(ret)
		}
	}
	load() {
		const { ctx } = this
		return Promise.all(
			_.map(this.idLoaders, (idMap, modelName) => {
				const lock = idMap.lock
				delete idMap.lock
				const ids = Object.keys(idMap)

				// console.log(chalk.green(`query models[${modelName}]: ${ids.join(', ')}`))

				return defAPI
					.getModelMapByIds(getModel(modelName, ctx), ids, ctx.transaction, lock)
					.then(modelMap => {
						console.log(
							chalk.green(
								`loaded${lock ? '[locked]' : ''} exist models[${modelName}]: ${ids
									.filter(id => modelMap[id])
									.join(', ')}`
							)
						)

						const miss = ids.filter(id => !modelMap[id])
						if (miss.length) console.log(chalk.red(`miss exist models[${modelName}]: ${miss.join(', ')}`))

						const promises = []
						ids.forEach(id => {
							idMap[id].forEach(({ cb, scope }) => {
								const ret = cb.call(scope, modelMap[id], scope)
								if (ret && typeof ret.then === 'function') promises.push(ret)
							})
						})
						return Promise.all(promises)
					})
					.catch(e => {
						console.error(
							chalk.green(
								`query${lock ? '[locked]' : ''} models[${modelName}] with error: ${ids.join(', ')}`
							),
							e
						)
						throw e
					})
			}).concat(this.loadPromises)
		)
	}
}
function getModel(modelName, ctx) {
	const Model = ctx.models[modelName]
	if (!Model) throw new Error(`Model[${modelName}] is undefined`)
	return Model
}

function parseSaveBodySchema(schema) {
	const createRequires = makeArray(schema.createRequires)
	createRequires && createRequires.forEach(key => (schema[key] = schema[key].required()))
	delete schema.createRequires
	return schema
}
