const _ = require('lodash')
const api = require('../api/api')
const chalk = require('chalk')

module.exports = {
	reply(req, res, next) {
		res.reply = data => reply(data, req, res)
		res.replyError = err => replyError(err, req, res)

		next()
	},
	notFound(req, res) {
		replyError({ status: 404, message: 'not found' }, req, res)
	},
	error(err, req, res, next) {
		replyError({ status: 500, errors: err }, req, res)
	}
}

function reply(data, req, res) {
	if (data && typeof data.then === 'function') {
		replyPromise(data, req, res)
	} else {
		replyObj(data, req, res)
	}
}

function replyObj(data, req, res) {
	const method = req.method.toLowerCase()
	console.info(api.methodColor[method](`${_.padEnd(`[${method}]`, 8)}`), chalk.green(req.baseUrl + req.url))
	res.json({
		code: 0,
		message: 'success',
		data
	})
}

function replyPromise(promise, req, res) {
	promise
		.then(result => {
			replyObj(result, req, res)
		})
		.catch(err => {
			replyError(err, req, res)
		})
}

function replyError(err = {}, req, res) {
	if (typeof err === 'string') err = { message: err }
	let message = err.message
	// process joi error
	if (err.details && err.details.length) {
		message = _.map(err.details, detail => detail.message).join(';')
	} else if (err.errors && err.errors.length) {
		message = err.errors[0].message
	}
	const method = req.method.toLowerCase(),
		e = err instanceof Error ? err.stack : (err.errors && err.errors[0]) || ''

	console.error(
		api.methodColor[method](`${_.padEnd(`[${method}]`, 8)}`),
		chalk.green(req.baseUrl + req.url),
		chalk.red(err.status || 400),
		chalk.red(message),
		(e && '\n') || '',
		e
	)

	res.status(err.status || 400).json({
		code: err.code || 1,
		message: message || 'Unknown error'
	})
}
