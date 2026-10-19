import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Row, Col, Statistic, Tag, Space, message, Modal, InputNumber, Switch, Select } from 'antd'
import { PlusOutlined, LineChartOutlined, EditOutlined, BellOutlined, DeleteOutlined } from '@ant-design/icons'
import { getHoldings, deleteHolding, getAlerts } from '../api'
import AddHoldingModal from '../components/AddHoldingModal'

export default function PortfolioOverview() {
  const navigate = useNavigate()
  const [holdings, setHoldings] = useState([])
  const [summary, setSummary] = useState({})
  const [alerts, setAlerts] = useState({ active: [], triggered: [] })
  const [addOpen, setAddOpen] = useState(false)
  const [addType, setAddType] = useState('fund')
  const [editItem, setEditItem] = useState(null)
  const [editShares, setEditShares] = useState(0)
  const [editCost, setEditCost] = useState(0)
  const [editDcaEnabled, setEditDcaEnabled] = useState(false)
  const [editDcaFrequency, setEditDcaFrequency] = useState('daily')
  const [editDcaAmount, setEditDcaAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hRes, aRes] = await Promise.all([getHoldings(), getAlerts()])
      setHoldings(hRes.data.holdings || [])
      setSummary(hRes.data.summary || {})
      setAlerts(aRes.data || { active: [], triggered: [] })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openEdit = (item) => {
    setEditItem(item)
    setEditShares(Math.round(item.shares * 100) / 100)
    setEditCost(Math.round(item.cost_price * 10000) / 10000)
    setEditDcaEnabled(item.dca_enabled || false)
    setEditDcaFrequency(item.dca_frequency || 'daily')
    setEditDcaAmount(item.dca_amount || 0)
  }

  const handleEditSave = async () => {
    if (!editItem) return
    try {
      const { updateHolding } = await import('../api')
      await updateHolding(editItem.id, {
        shares: editShares,
        cost_price: editCost,
        dca_enabled: editDcaEnabled,
        dca_frequency: editDcaEnabled ? editDcaFrequency : null,
        dca_amount: editDcaEnabled ? editDcaAmount : 0,
      })
      message.success('修改成功')
      setEditItem(null)
      fetchData()
    } catch {
      message.error('修改失败')
    }
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除?',
      onOk: async () => {
        await deleteHolding(id)
        message.success('已删除')
        fetchData()
      },
    })
  }

  const fundHoldings = holdings.filter(h => h.type === 'fund')
  const stockHoldings = holdings.filter(h => h.type === 'stock')

  const actionsColumn = {
    title: '操作',
    key: 'actions',
    width: 240,
    render: (_, r) => (
      <Space size="small">
        <Button type="link" size="small" icon={<LineChartOutlined />}
          onClick={() => navigate(r.type === 'fund' ? `/fund/${r.code}` : `/stock/${r.code}`)}>
          分析
        </Button>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
        <Button type="link" size="small" icon={<BellOutlined />}>预警</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>删除</Button>
      </Space>
    ),
  }

  const baseColumns = [
    { title: '代码', dataIndex: 'code', key: 'code', width: 90 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '现价/净值', dataIndex: 'current_price', key: 'current_price', width: 90, render: v => v?.toFixed(4) },
  ]

  const fundColumns = [
    ...baseColumns,
    { title: '持仓金额', dataIndex: 'holding_amount', key: 'holding_amount', width: 100, render: v => v ? `¥${v?.toLocaleString()}` : '-' },
    { title: '持仓天数', dataIndex: 'holding_days', key: 'holding_days', width: 80, render: v => v ? `${v}天` : '-' },
    {
      title: '定投',
      key: 'dca',
      width: 140,
      render: (_, r) => {
        if (!r.dca_amount) return <span style={{ color: '#ccc' }}>-</span>
        const freqMap = { daily: '每日', weekly: '每周', biweekly: '双周', monthly: '每月' }
        return (
          <div>
            <div style={{ fontSize: 12, color: '#E87A30', fontWeight: 600 }}>¥{r.dca_amount?.toLocaleString()}/{freqMap[r.dca_frequency] || r.dca_frequency}</div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {r.dca_frequency === 'daily' && `月约¥${(r.dca_amount * 22).toLocaleString()}`}
              {r.dca_frequency === 'weekly' && `月约¥${(r.dca_amount * 4).toLocaleString()}`}
              {r.dca_frequency === 'biweekly' && `月约¥${(r.dca_amount * 2).toLocaleString()}`}
              {r.dca_frequency === 'monthly' && ''}
            </div>
          </div>
        )
      },
    },
    {
      title: '收益率',
      key: 'return',
      width: 100,
      render: (_, r) => {
        if (!r.holding_amount || !r.current_price) return '-'
        const buyNav = r.holding_amount / (r.shares || 1)
        const pnlPct = ((r.current_price - buyNav) / buyNav * 100)
        return <span style={{ color: pnlPct >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>
          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
        </span>
      },
    },
    actionsColumn,
  ]

  const stockColumns = [
    ...baseColumns,
    { title: '成本价', dataIndex: 'cost_price', key: 'cost_price', width: 90, render: v => v?.toFixed(2) },
    { title: '持仓市值', dataIndex: 'current_total', key: 'current_total', width: 110, render: v => `¥${v?.toLocaleString()}` },
    {
      title: '盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      width: 110,
      render: (v, r) => (
        <span style={{ color: v >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}{v?.toFixed(2)} ({r.pnl_pct >= 0 ? '+' : ''}{r.pnl_pct}%)
        </span>
      ),
    },
    actionsColumn,
  ]





  return (
    <div className="page-container">
      <div className="page-title">持仓总览</div>

      {/* Summary cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">总资产</div>
            <div className="value">¥{summary.total_assets?.toLocaleString()}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">今日盈亏</div>
            <div className="value" style={{ color: (summary.daily_pnl || 0) >= 0 ? '#E87A30' : '#52c41a' }}>
              {summary.daily_pnl >= 0 ? '+' : ''}¥{summary.daily_pnl?.toLocaleString()}
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">累计盈亏</div>
            <div className="value" style={{ color: (summary.total_pnl || 0) >= 0 ? '#E87A30' : '#52c41a' }}>
              {summary.total_pnl >= 0 ? '+' : ''}¥{summary.total_pnl?.toLocaleString()}
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">累计收益率</div>
            <div className="value" style={{ color: (summary.total_pnl_pct || 0) >= 0 ? '#E87A30' : '#52c41a' }}>
              {summary.total_pnl_pct >= 0 ? '+' : ''}{summary.total_pnl_pct}%
            </div>
          </div>
        </Col>
      </Row>

      {/* DCA summary */}
      {summary.dca_count > 0 && (
        <div className="content-card" style={{ marginBottom: 16, background: '#FFF7E6', border: '1px solid #FFE4B5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#888' }}>定投中</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#E87A30' }}>{summary.dca_count} 只</div>
            </div>
            <div style={{ width: 1, height: 40, background: '#FFE4B5' }} />
            <div>
              <div style={{ fontSize: 13, color: '#888' }}>每月定投</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#E87A30' }}>¥{summary.monthly_dca?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Fund holdings */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>基金持仓</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setAddType('fund'); setAddOpen(true) }}
            style={{ background: '#E87A30', borderColor: '#E87A30' }}
          >
            添加基金
          </Button>
        </div>
        <Table
          dataSource={fundHoldings}
          columns={fundColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      {/* Stock holdings */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>股票持仓</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setAddType('stock'); setAddOpen(true) }}
            style={{ background: '#E87A30', borderColor: '#E87A30' }}
          >
            添加股票
          </Button>
        </div>
        <Table
          dataSource={stockHoldings}
          columns={stockColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      {/* Today's alerts */}
      <div className="content-card">
        <div className="card-title">今日预警</div>
        {alerts.active.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无活跃预警</div>
        ) : (
          <Row gutter={[12, 12]}>
            {alerts.active.map(a => (
              <Col span={8} key={a.id}>
                <div style={{ padding: 12, background: '#FFF7E6', borderRadius: 8, border: '1px solid #FFE4B5' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {a.condition === 'above' ? '高于' : a.condition === 'below' ? '低于' : '涨跌'} {a.target_value}
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>
                      {a.action_type === 'notify' ? '通知' : a.action_type === 'buy' ? '买入' : '卖出'}
                    </Tag>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <AddHoldingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={fetchData}
      />

      {/* Edit holding modal */}
      <Modal
        title={`编辑持仓 - ${editItem?.name || ''}`}
        open={!!editItem}
        onOk={handleEditSave}
        onCancel={() => setEditItem(null)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ style: { background: '#E87A30', borderColor: '#E87A30' } }}
        width={480}
      >
        {editItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>份额/股数</div>
                <InputNumber value={editShares} onChange={setEditShares} style={{ width: '100%' }} min={0} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>成本价</div>
                <InputNumber value={editCost} onChange={setEditCost} style={{ width: '100%' }} min={0} step={0.01} />
              </div>
            </div>
            {editItem.type === 'fund' && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editDcaEnabled ? 12 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>定投设置</div>
                  <Switch checked={editDcaEnabled} onChange={setEditDcaEnabled} style={{ background: editDcaEnabled ? '#E87A30' : undefined }} />
                </div>
                {editDcaEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#FFF7E6', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 6, fontSize: 12, color: '#666' }}>频率</div>
                        <Select value={editDcaFrequency} onChange={setEditDcaFrequency} style={{ width: '100%' }} options={[
                          { value: 'daily', label: '每日' },
                          { value: 'weekly', label: '每周' },
                          { value: 'biweekly', label: '每两周' },
                          { value: 'monthly', label: '每月' },
                        ]} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 6, fontSize: 12, color: '#666' }}>金额（元）</div>
                        <InputNumber value={editDcaAmount} onChange={setEditDcaAmount} style={{ width: '100%' }} min={0} step={100} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#999', background: '#f9f9f9', padding: '8px 12px', borderRadius: 6 }}>
              修改后持仓市值：¥{(editShares * editCost).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}