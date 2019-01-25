require('dotenv').config()

const express = require('express')
const baseMiddleware = require('./middleware/base')
const api = require('./api/api')
const _ = require('lodash')
const chalk = require('chalk')

const app = express()
const port = process.env.SERVER_PORT || 3000
const apiPath = process.env.API_PATH + '/' + process.env.API_VERSION

app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.headers.origin)
	res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	res.header('Access-Control-Allow-Credentials', 'true')
	if ('OPTIONS' === req.method) {
		res.send(200)
	} else {
		next()
	}
})

if (process.env.NODE_ENV !== 'production') app.use(require('morgan')('dev'))

app.use(
	require('express-session')({
		secret: 'erp',
		resave: false,
		saveUninitialized: false
	})
)

app.use(express.static('web/dist'))

app.use(require('body-parser').json())

app.use(baseMiddleware.reply)

require('./api/apis').forEach(router => {
	app.use(apiPath + '/' + router.module, router)

	console.log(chalk.yellow(`bind API-Module[${router.module}]:`))

	_.each(router.stack, function(stack) {
		_.each(stack.route && stack.route.stack, function(r) {
			const handle = r.handle
			if (handle.module) {
				const method = r.method.toLowerCase()
				console.info(
					api.methodColor[method](`${_.padStart(`[${method}]`, 10)}`),
					chalk.green(apiPath + '/' + router.module + stack.route.path),
					handle.validators
						.map(v => `\n\t${chalk.blue(_.padStart(v.type + ':', 7))} ${chalk.green(_.keys(v.schema))}`)
						.join('')
				)
			}
		})
	})
})

app.use(baseMiddleware.notFound)
app.use(baseMiddleware.error)

app.listen(port, () => {
	console.log(`Server listening at - ${apiPath} : ${port}`)
})
module.exports = app
