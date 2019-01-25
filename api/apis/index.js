const path = require('path')
const read = require('fs-readdir-recursive')
const basename = path.basename(module.filename)
const chalk = require('chalk')
const modules = {}
module.exports = read(__dirname)
	.filter(f => f !== basename && /\.js$/.test(f))
	.map(f => path.join(__dirname, f))
	.reduce((routers, f) => {
		console.log('load apis from', chalk.green(f))
		let router = require(f)
		if (!Array.isArray(router)) router = [router]
		router.forEach(r => {
			if (modules[r.module]) throw new Error('Multi API-Module: ' + r.module)
			routers.push(r)
			modules[r.module] = true
		})
		return routers
	}, [])
