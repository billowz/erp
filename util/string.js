const PLURAL_REG = /([a-zA-Z]+)(?:([^aeiou])y|([sxzh])|([aeiou]y)|([^sxzhy]))$/
function pluralHandler(m, v, ies, es, ys, s) {
	return v + (ies ? ies + 'ies' : es ? es + 'es' : (ys || s) + 's')
}
const SINGULAR_REG = /([a-zA-Z]+)(?:([^aeiou])ies|([sxzh])es|([aeiou]y)s|([^sxzhy])s)$/
function singularHandler(m, v, ies, es, ys, s) {
	return v + (ies ? ies + 'y' : es || ys || s)
}
function replacer(reg, handler) {
	return str => str.replace(reg, handler)
}
module.exports = {
	plural: replacer(PLURAL_REG, pluralHandler),
	singular: replacer(SINGULAR_REG, singularHandler)
}
