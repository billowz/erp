module.exports = {
	login(req, res, next) {
		if (req.session.user && req.session.user.id) {
			req.user = req.session.user
			next()
		} else {
			next({ message: '请先登录！', status: 401 })
		}
	}
}
