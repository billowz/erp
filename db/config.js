require('dotenv').config()

const dbConfig = {
	pool: { maxConnections: 5, maxIdleTime: 30 },
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	host: process.env.DB_HOST,
	dialect: 'mysql',
	define: {
		charset: 'utf8',
		dialectOptions: {
			collate: 'utf8_general_ci'
		}
	}
}

const config = {
	development: dbConfig,
	test: dbConfig,
	production: dbConfig
}

module.exports = config
