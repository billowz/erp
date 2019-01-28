const defModel = require('../../model')

module.exports = defModel(
	(sequelize, DataTypes) => {
		sequelize.define('ProductType', {
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			comment: DataTypes.STRING
		})
		sequelize.define('Product', {
			name: {
				type: DataTypes.STRING,
				allowNull: false
			},
			comment: DataTypes.STRING,
			code: {
				type: DataTypes.STRING
			},
			unit: {
				type: DataTypes.STRING,
				allowNull: false
			},
			stock: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0
			},
			minStock: {
				type: DataTypes.INTEGER.UNSIGNED,
				defaultValue: 0
			},
			price: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			purchasePrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			}
		})
	},
	({ Product, ProductType }) => {
		defModel.oneToMany([ProductType, 'type', 'type'], Product)
	}
)
