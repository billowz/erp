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
        v-if="tableShowFilter"
        border
        :data="tableFilters"
        :columns="tableFilterDefine"
        :loading="tableLoading"
        :size="tableSize"
        :row-class-name="tableFilterRowClassName"
        stripe
      >
      </Table>
      <Table
        border
        :show-header="!tableShowFilter"
        :data="tableData"
        :columns="tableDefine"
        :loading="tableLoading"
        :size="tableSize"
        stripe
        @on-sort-change="sortTable"
      >
      </Table>

      <div style="margin: 10px;overflow: hidden">
        <div style="float: right;">
          <Page
            show-total
            :total="tableRows"
            :page-size="tablePageSize"
            @on-change="setTablePage"
          ></Page>
        </div>
      </div>
    </Card>

    <Modal
      v-model="editModal"
      :title="editorTitle"
      :width="editorWidth"
      :loading="editing"
      :scrollable="true"
      @on-ok="save()"
      @on-cancel="onCancelSave()"
    >
      <slot name="editForm"></slot>
    </Modal>

    <Modal
      v-model="deleteConfirmModal"
      :title="deleteConfirmTitle"
      :width="deleteConfirmWidth"
      @on-ok="doDelete()"
      @on-cancel="onCancelDelete()"
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
export default {
	props: {
		tableDefaultCondition: { type: Object },
		tableDefaultSort: { type: Object, default: () => ({ key: 'createdAt', order: 'desc' }) },
		title: { type: String, required: true },
		tableAPI: { type: String, required: true },
		tableHeader: { type: Array, required: true },
		tablePageSize: { type: Number, default: 10 },
		tableParam: { type: Function, default: () => {} },
		tableShowFilter: { type: Boolean, default: true },

		getDataLabel: { type: Function, default: data => data.name },

		editorWidth: { type: Number, default: 500 },
		deleteConfirmWidth: { type: Number, default: 300 },

		beforeEdit: { type: Function },
		onSave: { type: Function },
		onCancelSave: { type: Function, default: () => {} },

		beforeDelete: { type: Function },
		onDelete: { type: Function },
		onCancelDelete: { type: Function, default: () => {} }
	},
	data() {
		const columns = this.tableHeader
			.concat([
				{
					title: '创建时间',
					key: 'createdAt',
					render: (h, params) => h('span', moment(params.row.createdAt).format('YYYY-MM-DD HH:mm:ss'))
				},
				{
					title: '更新时间',
					key: 'updatedAt',
					render: (h, params) => h('span', moment(params.row.updatedAt).format('YYYY-MM-DD HH:mm:ss'))
				},
				{
					title: '操作',
					key: 'actions',
					filter: false,
					render: (h, params) => {
						if (params.row.id)
							return h('div', [
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
							])
					}
				}
			])
			.map(d => {
				d.align = d.align || 'center'
				d.sortable = d.sortable !== false
				if (d.key === this.tableDefaultSort.key) {
					if (!d.sortable) throw new Error(`column ${d.key} is not sortable`)
					d.sortType = this.tableDefaultSort.order
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

		return {
			tableData: [],
			tableRows: 0,
			tableSize: 'large',
			tableCondition: this.tableDefaultCondition || {},
			tableSort: this.tableDefaultSort,
			tableDefine: columns,
			tableFilterDefine: columns.map(col => {
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
						delete this.tableCondition[col.key]
					} else {
						this.tableCondition[col.key] = { key: col.key, op: col.filterOp || op, value }
					}
					this.refresh()
				}
				return col
			}),
			tableFilters: [{}],
			currentTablePage: 1,
			editorTitle: '',
			editing: true,
			editModal: false,
			deleteConfirmTitle: '',
			deleteConfirmModal: false,
			tableLoading: false,
			deleteLabels: [],
			deleteDatas: []
		}
	},
	created() {
		this.setTablePage(1)
	},
	methods: {
		setTablePage(page) {
			const { tableSort, tableCondition, tablePageSize } = this
			this.currentTablePage = page
			//console.log(`loading table[${this.title}] page: ${page}, sort`, tableSort, 'condition', tableCondition)
			this.tableLoading = true
			this.$http
				.get(this.tableAPI, {
					params: Object.assign(
						{
							offset: ((page || 1) - 1) * tablePageSize,
							limit: tablePageSize,
							sort: tableSort ? [tableSort] : [],
							condition: Object.keys(tableCondition).map(k => tableCondition[k])
						},
						this.tableParam()
					)
				})
				.then(res => {
					const data = res.data.data
					this.tableData = data.rows
					this.tableRows = data.count

					console.log(
						`loaded table[${this.title}] page: ${page}, sort`,
						tableSort,
						'condition',
						tableCondition
					)
				})
				.finally(() => {
					this.tableLoading = false
				})
		},
		refresh() {
			this.setTablePage(this.currentTablePage || 1)
		},
		sortTable({ key, order }) {
			this.tableSort = order !== 'normal' && { key, order }
			this.refresh()
		},
		filterTable() {
			console.log('filter', arguments)
		},
		tableFilterRowClassName() {
			return 'filter-row'
		},
		edit(index) {
			const data = (index >= 0 && this.tableData[index]) || undefined
			this.beforeEdit(data || {})
			if (data) {
				const label = this.getDataLabel(data)
				this.editorTitle = `修改${this.title}`
				if (label && typeof label === 'string') this.editorTitle += `(${label})`
			} else {
				this.editorTitle = `创建${this.title}`
			}
			this.editModal = true
		},
		save() {
			this.onSave(
				(body, id, options = {}) => {
					if (body) {
						console.log(`${this.editorTitle}: `, id, body)

						this.$http[options.method || (id ? 'put' : 'post')](
							options.url || `${this.tableAPI}/${id || ''}`,
							body,
							options
						)
							.then(() => {
								this.editModal = false
								this.$Message.success('保存成功!')
								this.onCancelSave(true)
								this.refresh()
							})
							.catch(() => {
								this.resetEditing()
							})
					} else {
						this.resetEditing()
					}
				},
				err => {
					err && this.$Message.error(err)
					this.resetEditing()
				}
			)
		},
		resetEditing() {
			this.editing = false
			this.$nextTick(() => (this.editing = true))
		},
		delete(idxs) {
			if (!Array.isArray(idxs)) idxs = [idxs]
			if (idxs) {
				let datas = idxs.map(index => this.tableData[index]).filter(d => !!d)
				this.deleteDatas = datas = (datas.length && this.beforeDelete(datas)) || datas
				if (datas.length) {
					this.deleteLabels = datas.map(d => this.getDataLabel(d))

					this.deleteConfirmTitle = _.truncate(`删除${this.title} (${this.deleteLabels.join(', ')})`, {
						length: 24,
						separator: /,? +/
					})
					this.deleteConfirmModal = true
				}
			}
		},
		doDelete() {
			if (this.deleteDatas.length)
				this.onDelete((ids, options = {}) => {
					this.onCancelDelete(true)
					if (ids && ids.length) {
						this.$http
							.delete(
								options.url || `${this.tableAPI}/`,
								Object.assign(options, { body: Object.assign(options.body || {}, { ids }) })
							)
							.then(() => {
								this.$Message.success('删除成功!')
								this.refresh()
							})
					}
				}, this.deleteDatas)
			this.deleteConfirmModal = false
		}
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
