module.exports = {
	notExist(name) {
		return new Error(`${name}不存在或已被删除！`)
	}
}
