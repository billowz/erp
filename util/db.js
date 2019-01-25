const Sequelize = require('sequelize')
const _ = require('lodash')
const { makeMap, resolveOn, assignWithOut } = require('./util')
const dbUtil = {
	checkID(Model, id, name) {
		return Model.findById(id).then(m => resolveOn(m, m, notExist(name)))
	},
	getModelMap(Model, where) {
		return Model.findAll({
			where
		}).then(coll => makeMap(coll, 'id'))
	},
	getModelMapByIds(Model, ids) {
		return dbUtil.getModelMap(Model, {
			id: { [Sequelize.Op.in]: ids }
		})
	},
	getModelsMapByIds(Model, ids, name) {
		return dbUtil
			.getModelMapByIds(Model, ids)
			.then(map => Promise.resolve(ids.map(id => resolveOn(map[id], map[id], notExist(name)))))
	},
	save(data, { model, models, sequelize }, desc) {
		const checks = []
		_.each(desc.rels, (val, def) => {
			const Model = model[def.modelName]
			if(!Model) throw new Error('')
			if(!def.casecade){

			}
		})
	}
}
module.exports = dbUtil

create(data, ctx, {
	rels: {
		fk_consumer: {
			modelName: 'Consumer',
			casecade: false
		},
		items: {
			rels: { fk_product: {
				modelName:'Product'
			}},
			casecade: true
		}
	}
})
