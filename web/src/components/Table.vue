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
          size="small"
          icon="plus"
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
            v-for="(label,key,index) in deleteLabels"
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

		editorWidth: { type: Number, default: 500 },
		editorLoad: { type: Function },
		editData: { type: Object },
		onEdit: { type: Function },
		onSave: { type: Function, save: data => data },
		onEditEnd: { type: Function, default: () => {} },

		deleterWidth: { type: Number, default: 500 },
		onDelete: { type: Function, default: data => data }
	},

	data() {
		const columns = this.parseColumns(this.header, {
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
			}),
			condition = this.defaultCondition || {}

		return {
			loading: false,
			columns,
			filterColumns: this.parseFilterColumns(columns),
			condition,
			sort: this.defaultSort,
			data: [],
			currentPage: 1,
			totalRows: 0,
			filterRow: [condition],

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
			const data = (index >= 0 && this.data[index]) || {}
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

			this.$http
				.get(this.tableApi || this.api, {
					params: {
						offset: ((page || 1) - 1) * pageSize,
						limit: pageSize,
						sort: sort ? [sort] : [],
						condition: Object.keys(condition).map(k => condition[k])
					}
				})
				.then(res => {
					const data = res.data.data
					this.data = data.rows
					this.totalRows = data.count

					console.log(`loaded table[${this.title}] page: ${page}, sort`, sort, 'condition', condition)
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

		parseColumns(columns, defaultActions) {
			const actions = this.actions.map(a => {
				if (typeof a === 'function') return a
				if (!defaultActions[a]) throw new Error('unkown action: ' + a)
				return defaultActions[a]
			})
			return columns
				.concat([
					{
						title: '创建时间',
						key: 'createdAt',
						render: (h, params) => h('span', moment(params.row.createdAt).format('YYYY-MM-DD HH:mm:ss'))
					} /*
					{
						title: '更新时间',
						key: 'updatedAt',
						render: (h, params) => h('span', moment(params.row.updatedAt).format('YYYY-MM-DD HH:mm:ss'))
          }, */,
					actions.length && {
						title: '操作',
						key: 'actions',
						filter: false,
						render: (h, params) => {
							if (params.row.id) return h('div', actions.map(a => a(h, params)))
						}
					}
				])
				.filter(d => !!d)
				.map(d => {
					d.align = d.align || 'center'
					d.sortable = d.sortable !== false
					if (d.key === this.defaultSort.key) {
						if (!d.sortable) throw new Error(`column ${d.key} is not sortable`)
						d.sortType = this.defaultSort.order
					}
					if (typeof d.filter !== 'string' && d.filter !== false) d.filter = 'input'
					if (!d.render) {
						const path = d.key.split('.')
						if (path.length > 1) {
							d.render = (h, params) => {
								let o = params.row
								for (let i = 0, l = path.length; i < l; i++) {
									if (o) o = o[path[i]]
									else break
								}
								return h('span', o)
							}
						}
					}
					return d
				})
		},
		parseFilterColumns(columns) {
			return columns.map(col => {
				const filter = col.filter
				col = Object.assign({}, col)
				if (filter === 'select') {
					col.render = h =>
						h('Select', {
							props: {},
							on: {
								'on-change': val => doFilter('eq', val)
							}
						})
				} else if (filter === 'input') {
					col.render = h =>
						h('Input', {
							props: {
								placeholder: col.title,
								icon: 'ios-search-strong'
							},
							on: {
								input: val => {
									col.fvalue = val
									if (!val) doFilter('like', val)
								},
								'on-click': () => doFilter('like', col.fvalue),
								'on-enter': () => doFilter('like', col.fvalue)
							}
						})
				} else {
					col.render = () => {}
				}
				const doFilter = (op, value) => {
					if (!value) {
						delete this.condition[col.key]
					} else {
						this.condition[col.key] = { key: col.key, op: col.filterOp || op, value }
					}
					this.refresh()
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
