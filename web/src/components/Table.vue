<template>
  <div class="admin-user-view">
    <Card dis-hover>
      <Row
        type="flex"
        justify="center"
        class="table-action-section"
      >
        <Col span="23"><b>{{title}}列表</b></col>
        <Col
          span="1"
          style="text-align: right;"
        >
        <Button
          type="text"
          size="large"
          icon="md-add"
          shape="circle"
          @click="edit()"
        ></Button>
        </Col>
      </Row>

      <Row span="22">
        <slot name="tableTool"></slot>
      </Row>

      <Table
        v-if="filter"
        border
        :data="filterRow"
        :columns="filterColumns"
        :loading="loading"
        :size="size"
        :row-class-name="filterRowClass"
        stripe
        @on-sort-change="doSort"
      >
      </Table>
      <Table
        border
        :show-header="!filter"
        :data="data"
        :columns="columns"
        :loading="loading"
        :size="size"
        stripe
        @on-sort-change="doSort"
      >
      </Table>

      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page
            show-total
            :total="totalRows"
            :page-size="pageSize"
            @on-change="setPage"
          ></Page>
        </div>
      </div>
    </Card>

    <Editor
      :title="title"
      :api="api"
      :width="editorWidth"
      :load="editorLoad"
      :label="label"
      :data="editData"
      :onSave="onSave"
      :onClose="closeEditor"
    >
      <slot name="editor"></slot>
    </Editor>

    <Modal
      v-model="deleterModal"
      :title="deleterTitle"
      :width="deleterWidth"
      @on-ok="doDelete()"
      @on-cancel="onCloseDeleteConfirm()"
    >
      <div style="text-align:center; font-size:14px">
        <p>{{title}}：
          <span
            v-for="(label,index) in deleteLabels"
            :key="index"
          >
            {{label}}
          </span>
        </p>
        <p>将被删除且无法恢复，是否继续？</p>
      </div>
    </Modal>

  </div>
</template>

<script>
import Editor from '@/components/Editor'
import _ from 'lodash'
import moment from 'moment'

export default {
	props: {
		api: { type: String, required: true },
		tableApi: { type: String },

		title: { type: String, required: true },
		size: { type: String, default: 'large' },

		header: { type: Array, required: true },
		pageSize: { type: Number, default: 10 },
		filter: { type: Boolean, default: true },
		defaultCondition: { type: Object },
		defaultSort: { type: Object, default: () => ({ key: 'createdAt', order: 'desc' }) },

		label: { type: Function, default: data => data.name },

		actions: { type: Array, default: () => ['edit', 'delete'] },

		editorWidth: { type: Number, default: 600 },
		editorLoad: { type: Function },
		editData: { type: Object },
		onEdit: { type: Function },
		onSave: { type: Function, save: data => data },
		onEditEnd: { type: Function, default: () => {} },

		deleterWidth: { type: Number, default: 500 },
		onDelete: { type: Function, default: data => data }
	},

	data() {
		const columns = this.parseColumns(this.header),
			condition = this.defaultCondition || {}
		columns.forEach(col => {
			if (!(col.key in condition)) condition[col.key] = undefined
		})
		return {
			loading: false,
			columns,
			filterColumns: this.parseFilterColumns(columns),
			condition,
			sort: this.defaultSort,
			data: [],
			currentPage: 1,
			totalRows: 0,
			filterRow: [Object.assign({}, condition)],

			deleterTitle: '',
			deleterModal: false,
			deleteLabels: [],
			deleteDatas: []
		}
	},

	created() {
		this.setPage(1)
	},

	methods: {
		edit(index) {
			const data = (index >= 0 && Object.assign({}, this.data[index])) || {}
			this.onEdit(data)
		},

		closeEditor(saved) {
			if (saved) this.refresh()
			this.onEditEnd(saved)
		},

		setPage(page) {
			const { sort, condition, pageSize } = this

			// console.log(`loading table[${this.title}] page: ${page}, sort`, sort, 'condition', condition)

			this.currentPage = page
			this.loading = true

			this.filterRow = [Object.assign({}, condition)]
			this.$http
				.get(this.tableApi || this.api, {
					params: {
						offset: ((page || 1) - 1) * pageSize,
						limit: pageSize,
						sort: sort ? [sort] : [],
						condition: Object.keys(condition)
							.map(k => condition[k])
							.filter(con => con && con.value !== undefined && con.value !== null)
					}
				})
				.then(res => {
					const data = res.data.data
					this.totalRows = data.count
					this.data = data.rows

					console.log(
						`loaded table[${this.title}] page: ${page}`,
						this.data,
						'sort',
						sort,
						'condition',
						condition
					)
					// console.log(this.data.map(d => d.consumer.name).join(', '))
				})
				.finally(() => {
					this.loading = false
				})
		},

		refresh() {
			this.setPage(this.currentPage || 1)
		},

		doSort({ key, order }) {
			this.sort = order !== 'normal' && { key, order }
			this.refresh()
		},

		filterRowClass() {
			return 'filter-row'
		},

		delete(idxs) {
			if (!Array.isArray(idxs)) idxs = [idxs]
			const datas = idxs.map(index => this.data[index]).filter(d => d && d.id)
			this.setDelDatas((datas.length && this.onDelete(datas)) || datas)
		},

		doDelete() {
			const { deleteDatas } = this
			if (deleteDatas.length) {
				console.log(`${this.deleterTitle}: `, deleteDatas)

				this.$http.delete(this.api, { body: { ids: deleteDatas.map(d => d.id) } }).then(() => {
					this.$Message.success('删除成功!')
					this.refresh()
				})
			}
			this.setDelDatas([])
		},
		onCloseDeleteConfirm() {
			this.setDelDatas([])
		},
		setDelDatas(datas) {
			this.deleteDatas = datas
			this.deleteLabels = datas.map(d => this.label(d))
			this.deleterTitle = _.truncate(`删除${this.title} (${this.deleteLabels.join(', ')})`, {
				length: 24,
				separator: /,? +/
			})
			this.deleterModal = !!datas.length
		},

		parseColumns(columns) {
			const defaultActions = {
				edit: (h, params) =>
					h(
						'Button',
						{
							props: {
								type: 'primary',
								size: 'small'
							},
							style: {
								marginRight: '5px'
							},
							on: {
								click: () => {
									this.edit(params.index)
								}
							}
						},
						'编辑'
					),
				delete: (h, params) =>
					h(
						'Button',
						{
							props: {
								type: 'error',
								size: 'small'
							},
							on: {
								click: () => {
									this.delete(params.index)
								}
							}
						},
						'删除'
					)
			}
			const actions = this.actions.map(a => {
				if (typeof a === 'function') return a
				if (!defaultActions[a]) throw new Error('unkown action: ' + a)
				return defaultActions[a]
			})
			const defaultFormats = {
				string: {
					align: 'left'
				},
				number: {
					align: 'right',
					fmt(h, val, params) {
						const digits = params.column.digits
						return val === 0 || val ? val.toFixed(digits === 0 ? 0 : digits || 2) : ''
					}
				},
				date: {
					align: 'right',
					fmt(h, val, params) {
						return val && moment(val).format(params.column.format || 'YYYY-MM-DD')
					}
				}
			}
			return columns
				.concat([
					{
						title: '创建时间',
						key: 'createdAt',
						type: 'date'
					},
					actions.length && {
						title: '操作',
						key: 'actions',
						filter: false,
						sortable: false,
						align: 'center',
						render: (h, params) => {
							// console.log(params.row.consumer.name)
							if (params.row.id) return h('div', actions.map(a => a(h, params)))
						}
					}
				])
				.filter(d => !!d)
				.map(d => {
					if (!d.render) {
						let fmt = d.fmt || d.type || 'string'

						if (fmt && typeof fmt !== 'function') {
							fmt = defaultFormats[fmt]
							if (!fmt) throw new Error(`Invalid Format: ${d.fmt}`)
							d.align = d.align || fmt.align
							fmt = fmt.fmt
						}
						const path = d.key.split('.')
						d.render = (h, params) => {
							let o = params.row
							for (let i = 0, l = path.length; i < l; i++) {
								if (o) o = o[path[i]]
								else break
							}
							return h('div', fmt ? fmt(h, o, params) : o)
						}
					}

          d.sortable = d.sortable !== false
          delete d.sortType
					return d
				})
		},
		parseFilterColumns(columns) {
			const typeFilters = {
				string: (h, params) =>
					h('Input', {
						props: {
							placeholder: params.column.title,
							icon: 'ios-search',
							value: getFilterValue(params)
						},
						on: {
							input: val => {
								updateFilter(params, 'like', val)
							},
							'on-click': () => this.refresh(),
							'on-enter': () => this.refresh()
						}
					}),
				number: (h, params) =>
					h('Input', {
						props: {
							placeholder: 'eg. 0 ~ 100',
							icon: 'ios-search',
							value: getFilterValue(params, v => (v.join && v.join(' ~ ')) || v)
						},
						on: {
							input: val => {
								val = val.split('~')
								val[0] = Number.parseFloat(val[0])
								val[0] = isFinite(val[0]) ? val[0] : null
								if (val.length === 1) {
									updateFilter(params, 'eq', val[0])
								} else {
									val.length = 2
									val[1] = Number.parseFloat(val[1])
									val[1] = isFinite(val[1]) ? val[1] : null
									updateFilter(params, 'between', val)
								}
							},
							'on-click': () => this.refresh(),
							'on-enter': () => this.refresh()
						}
					}),
				date: (h, params) =>
					h('DatePicker', {
						props: {
							placeholder: params.column.title,
							type: 'daterange',
							value: getFilterValue(params),
							placement: params.column.filterPlace || 'bottom-end',
							'split-panels': true,
							size: 'large'
						},
						on: {
							'on-change': val => {
								var s = val[0] || null,
									e = val[1] || null
								if (s && e && s === e) {
									e = moment(e, 'YYYY-MM-DD')
										.add(1, 'day')
										.format()
								}
								updateFilter(params, 'between', [s, e])
								this.refresh()
							}
						}
					})
			}

			function getFilterValue(params, f) {
				const c = params.row[params.column.key]
				if (c) {
					let val = c.value
					if (val !== undefined && val !== null) {
						var op = c.op
						if (/lt/.test(op)) {
							val = [null, val]
						} else if (/gt/.test(op)) {
							val = [val, null]
						}
						return f ? f(val, op) : val
					}
				}
			}

			const updateFilter = (params, op, val) => {
				const col = params.column,
					key = col.key
				if (Array.isArray(val)) {
					if (val[0] === null && val[1] === null) {
						op = 'eq'
						val = null
					} else if (val[0] === null) {
						op = 'lte'
						val = val[1]
					} else if (val[1] === null) {
						op = 'gte'
						val = val[0]
					} else {
						if (val[0] > val[1]) {
							const m = val[1]
							val[1] = val[0]
							val[0] = m
						}
						op = 'between'
						val.length = 2
					}
				}
				this.condition[key] = {
					key,
					op,
					value: val === '' || val === null ? undefined : val
				}
			}

			return columns.map(col => {
				let filter = col.filter
				col = Object.assign({}, col)
				if (filter !== false) {
					filter = typeof filter === 'string' ? filter : col.type || 'string'
					col.render = typeFilters[filter]
					if (!col.render) throw new Error(`Invalid Filter Type: ${filter}`)
					col.filter = filter
				} else {
					col.render = () => {}
				}

				//col.sortable = col.sortable !== false
				if (col.key === this.defaultSort.key) {
					if (!col.sortable) throw new Error(`column ${col.key} is not sortable`)
					col.sortType = this.defaultSort.order
				}
				return col
			})
		}
	},
	components: {
		Editor
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.table-action-section {
	border-bottom: 1px solid #e9eaec;
	height: 25px;
	margin-bottom: 12px;
}
</style>

<style>
.filter-row td {
	height: 40px;
}
.filter-row .ivu-table-cell {
	padding: 5px 3px;
}
</style>
