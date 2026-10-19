import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Select, Row, Col, Button, Tag, message, InputNumber, Space } from 'antd'
import { EyeOutlined, StarOutlined } from '@ant-design/icons'
import { getTopFunds, addWatch } from '../api'

export default function FundScreener() {
  const navigate = useNavigate()
  const [funds, setFunds] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('1y_return')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopFunds().then(res => {
      setFunds(res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filteredFunds = funds
    .filter(f => typeFilter === 'all' || f.type === typeFilter)
    .sort((a, b) => (b[periodFilter] || 0) - (a[periodFilter] || 0))

  const handleAddWatch = async (fund) => {
    try {
      await addWatch({
        code: fund.code,
        name: fund.name,
        type: 'fund',
        entry_price: fund.nav,
        current_price: fund.nav,
        predicted_price: fund.nav * 1.1,
      })
      message.success(`已将 ${fund.name} 加入观察池`)
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '排名',
      width: 60,
      render: (_, __, i) => <span style={{ fontWeight: 600, color: i < 3 ? '#E87A30' : '#666' }}>{i + 1}</span>,
    },
    { title: '代码', dataIndex: 'code', width: 90 },
    {
      title: '名称',
      dataIndex: 'name',
      width: 250,
      render: (v, r) => (
        <a onClick={() => navigate(`/fund/${r.code}`)} style={{ color: '#1A1A1A' }}>{v}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: v => <Tag color={v === '混合型' ? 'orange' : v === '指数型' ? 'blue' : 'green'}>{v}</Tag>,
    },
    { title: '净值', dataIndex: 'nav', width: 90, render: v => v?.toFixed(4), sorter: (a, b) => a.nav - b.nav },
    {
      title: '近1年',
      dataIndex: '1y_return',
      width: 100,
      render: v => <span style={{ color: v >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>{v >= 0 ? '+' : ''}{v}%</span>,
      sorter: (a, b) => a['1y_return'] - b['1y_return'],
      defaultSortOrder: 'descend',
    },
    {
      title: '近3年',
      dataIndex: '3y_return',
      width: 100,
      render: v => <span style={{ color: v >= 0 ? '#E87A30' : '#52c41a' }}>{v >= 0 ? '+' : ''}{v}%</span>,
      sorter: (a, b) => a['3y_return'] - b['3y_return'],
    },
    { title: '费率', dataIndex: 'fee', width: 70, render: v => `${v}%`, sorter: (a, b) => a.fee - b.fee },
    { title: '规模(亿)', dataIndex: 'size', width: 90, render: v => v?.toFixed(1), sorter: (a, b) => a.size - b.size },
    {
      title: '操作',
      width: 120,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/fund/${r.code}`)}>分析</Button>
          <Button type="link" size="small" icon={<StarOutlined />} onClick={() => handleAddWatch(r)}>观察</Button>
        </Space>
      ),
    },
  ]

  // AI recommended
  const aiRecommended = funds.filter(f => f['1y_return'] > 15 && f['3y_return'] > 35).slice(0, 5)

  return (
    <div className="page-container">
      <div className="page-title">基金筛选</div>

      {/* AI Recommendations */}
      <div className="content-card">
        <div className="card-title">AI推荐基金</div>
        <Row gutter={[12, 12]}>
          {aiRecommended.map(f => (
            <Col span={Math.floor(24 / aiRecommended.length)} key={f.code}>
              <div
                style={{ padding: 16, background: '#FFF7E6', borderRadius: 8, border: '1px solid #FFE4B5', cursor: 'pointer' }}
                onClick={() => navigate(`/fund/${f.code}`)}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{f.code}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#E87A30', marginTop: 8 }}>+{f['1y_return']}%</div>
                <div style={{ fontSize: 12, color: '#999' }}>近1年收益</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Filters */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>基金排行</div>
          <Space>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部类型' },
                { value: '混合型', label: '混合型' },
                { value: '股票型', label: '股票型' },
                { value: '指数型', label: '指数型' },
              ]}
            />
            <Select
              value={periodFilter}
              onChange={setPeriodFilter}
              style={{ width: 120 }}
              options={[
                { value: '1y_return', label: '近1年收益' },
                { value: '3y_return', label: '近3年收益' },
                { value: 'nav', label: '净值' },
                { value: 'fee', label: '费率' },
                { value: 'size', label: '规模' },
              ]}
            />
          </Space>
        </div>
        <Table
          dataSource={filteredFunds}
          columns={columns}
          rowKey="code"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </div>
    </div>
  )
}