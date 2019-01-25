const _ = require('lodash')
function assignBy(target, source, cb) {
	target = target || {}
	_.each(source, (v, k) => {
		if (cb(v, k)) target[k] = v
	})
	return target
}
function makeArray(data, def) {
	if (typeof data === 'string') {
		return data.split(/\s*,\s*/)
	} else if (Array.isArray(data)) {
		return data
	} else if (data !== null && data !== undefined) {
		return [data]
	}
	return def
}

module.exports = {
	makeArray,
	makeMap(datas, key) {
		const getKey = typeof key === 'string' ? data => data[key] : key
		return datas.reduce((map, data, index) => ((map[getKey(data, index, map)] = data), map), {})
	},
	assignBy,
	assignWith(target, source, props) {
		props = makeArray(props)
		return assignBy(target, source, (v, k) => props.indexOf(k) !== -1)
	},
	assignWithOut(target, source, props) {
		props = makeArray(props)
		return assignBy(target, source, (v, k) => props.indexOf(k) === -1)
	},
	resolveOn(condition, data, error) {
		if (typeof condition === 'function') {
			condition = condition()
			if (typeof condition.then === 'function') {
				if (data) {
					condition = condition.then(d => {
						return Promise.resolve(typeof data === 'function' ? data(d) : data)
					})
				}
				if (error) {
					condition = condition.catch(e => {
						return Promise.resolve(typeof error === 'function' ? error(e) : error)
					})
				}
				return condition
			}
		}
		if (condition) return Promise.resolve(typeof data === 'function' ? data() : data)
		return Promise.reject(typeof error === 'function' ? error() : error)
	}
}
