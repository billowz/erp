const defModel = require('../../model')

module.exports = defModel(
	(sequelize, DataTypes) => {
		sequelize.define('SaleOrder', {
			comment: DataTypes.STRING,
			score: {
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 0
			},
			totalPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			orgTotalPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			totalPurchasePrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			totalDiscountPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			discountPrice: {
				// 优惠金额
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 0,
				allowNull: false
			},
			profit: {
				type: DataTypes.FLOAT,
				allowNull: false
			},
			discountComment: DataTypes.STRING,
			pay: {
				// 支付金额
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			payType: {
				type: DataTypes.STRING,
				allowNull: false
			}
		})
		sequelize.define('SaleOrderItem', {
			count: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false
			},
			discount: {
				// 折扣
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 10,
				allowNull: false
			},
			discountPrice: {
				// 优惠金额
				type: DataTypes.FLOAT.UNSIGNED,
				defaultValue: 0,
				allowNull: false
			},
			totalPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			unitPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			orgUnitPrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			},
			purchasePrice: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false
			}
		})
	},
	({ User, Consumer, SaleOrder, SaleOrderItem, Product }) => {
		defModel.oneToMany(Consumer, SaleOrder)
		defModel.oneToMany(User, SaleOrder)
		defModel.oneToMany([SaleOrder, 'order', 'order'], [SaleOrderItem, 'items'])
		defModel.oneToMany(Product, SaleOrderItem)
	}
)
