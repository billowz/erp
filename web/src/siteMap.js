import Dashboard from '@/components/Dashboard'
import Consumer from '@/components/consumer/Consumer'
import User from '@/components/system/User'
import Role from '@/components/system/Role'
import Permission from '@/components/system/Permission'
import Product from '@/components/product/Product'
import ProductType from '@/components/product/ProductType'
import SaleOrder from '@/components/sale/SaleOrder'

const map = [
	{
		name: 'Dashboard',
		path: 'dashboard',
		comp: Dashboard,
		icon: 'monitor'
	},
	{
		name: '客户管理',
		children: [
			{
				path: 'consumer/consumer',
				name: '客户管理',
				comp: Consumer
			}
		]
	},
	{
		name: '销售管理',
		children: [
			{
				path: 'sale/saleorder',
				name: '销售',
				comp: SaleOrder
			}
		]
	},
	{
		name: '商品管理',
		children: [
			{
				path: 'product/product',
				name: '商品管理',
				comp: Product
			},
			{
				path: 'product/productType',
				name: '商品分类管理',
				comp: ProductType
			}
		]
	},
	{
		name: '系统管理',
		icon: 'settings',
		children: [
			{
				path: 'system/user',
				name: '用户管理',
				comp: User
			},
			{
				path: 'system/role',
				name: '角色管理',
				comp: Role
			},
			{
				path: 'system/permission',
				name: '权限管理',
				comp: Permission
			}
		]
	}
]

const routes = []
const routeMap = {}
map.forEach(node =>
	parseRoutes(node, null, node => {
		routes.push(node)
		routeMap[node.path] = node
	})
)

export function getSiteMap() {
	return Promise.resolve(map)
}

export function getRoutes() {
	return Promise.resolve(routes)
}

export function getRoute(path) {
	return Promise.resolve(routeMap[path.replace(/^([^/])/, '/$1')])
}

function parseRoutes(node, parent, cb) {
	node.parent = parent
	node.namePath = parent ? parent.namePath.concat(node.name) : [node.name]
	if (node.children) {
		node.children.forEach(n => parseRoutes(n, node, cb))
		console.log('load groupmenu: ', node)
	} else if (!node.path) {
		console.warn('require path on SiteMap:', node)
		node.children = []
	} else if (!node.comp) {
		console.warn('require compontent on SiteMap:', node)
		node.children = []
	} else {
		console.log('load router: ', node)
		node.path = node.path.replace(/^([^/])/, '/$1')
		cb(node)
	}
}
