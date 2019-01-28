const defModel = require('../../model')

module.exports = defModel(
	(sequelize, DataTypes) => {
		sequelize.define('Consumer', {
			name: {
				type: DataTypes.STRING,
				allowNull: false
			},
			card: DataTypes.STRING,
			phone: DataTypes.STRING,
			weixin: DataTypes.STRING,
			discount: {
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 10
			},
			birthday: {
				type: DataTypes.DATE
			},
			score: {
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 0
			},
			disableScore: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
			comment: DataTypes.STRING,
			lastConsume: { type: DataTypes.DATE }
		})
	},
	({}) => {}
)
