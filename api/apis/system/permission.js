const defAPI = require('../../api')
const joi = require('joi')
const _ = require('lodash')

module.exports = defAPI('Permission', [
	defAPI.list({}, (query, { model, models }) => model.findAndCountAll(query)),
	defAPI.info((id, { model }) => model.findById(id))
])
