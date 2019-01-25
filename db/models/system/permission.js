const defModel = require('../../model')

module.exports = defModel(
	(sequelize, DataTypes) => {
		sequelize.define('Permission', {
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			comment: DataTypes.STRING
		})
	},
	({ Role, Permission }) => {
		defModel.manyToMany(Role, Permission)
	}
)
