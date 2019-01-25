const defModel = require('../../model')

module.exports = defModel(
	(sequelize, DataTypes) => {
		var role = sequelize.define('Role', {
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			comment: DataTypes.STRING
		})
	},
	({ Role, User }) => {
		defModel.manyToMany(User, Role)
	}
)
