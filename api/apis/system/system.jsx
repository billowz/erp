'use strict'

const express = require('express')
const router = express.Router()

const util = require('../../../util')
const userController = require('../../../controller/admin/user')
const roleController = require('../../../controller/admin/role')
const permissionController = require('../../../controller/admin/permission')
const authMiddleware = require('../../../middleware/auth')


util.restRoute('/admin/users', router, userController)
util.restRoute('/admin/roles', router, roleController)
util.restRoute('/admin/permissions', router, permissionController)

util.buildRoute(
	[
		{ path: '/admin/users/:id/roles', method: 'get', target: 'fetchRoles' },
		{ path: '/admin/users/:id/roles', method: 'put', target: 'updateRoles' }
	],
	router,
	userController
)

util.buildRoute(
	[
		{ path: '/admin/roles/:id/permissions', method: 'get', target: 'fetchPermissions' },
		{ path: '/admin/roles/:id/permissions', method: 'put', target: 'updatePermissions' }
	],
	router,
	roleController
)

module.exports = router
