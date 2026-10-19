import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, message, Modal, Progress } from 'antd'
import { SwapOutlined, DeleteOutlined, LineChartOutlined } from '@ant-design/icons'
import { getWatchlist, convertToHolding, removeWatch } from '../api'

export default function WatchList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    getWatchlist().then(res => {
      setItems(res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleConvert = async (id) => {
    try {
      await convertToHolding(id)
      message.success('已转为持仓')
      fetchData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleRemove = (id) => {
    Modal.confirm({
      title: '确认移除?',
      onOk: async () => {
        await removeWatch(id)
        message.success('已移除')
        fetchData()
      },
    })
  }

  const statusColor = { observing: 'processing', verified: 'success', expired: 'default' }
  const statusText = { observing: '观察中', verified: '已验证', expired: '已过期' }

  const columns = [
    { title: '代码', dataIndex: 'code', width: 90 },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
      render: (v, r) => (
        <a onClick={() => navigate(r.type === 'fund' ? `/fund/${r.code}` : `/stock/${r.code}`)} style={{ color: '#1A1A1A' }}>{v}</a>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 70, render: v => <Tag>{v === 'fund' ? '基金' : '股票'}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: v => <Tag color={statusColor[v]}>{statusText[v]}</Tag>,
    },
    { title: '入池价', dataIndex: 'entry_price', width: 90, render: v => v?.toFixed(4) },
    { title: '当前价', dataIndex: 'current_price', width: 90, render: v => v?.toFixed(4) },
    {
      title: '涨跌',
      width: 90,
      render: (_, r) => {
        if (!r.entry_price || !r.current_price) return '-'
        const change = ((r.current_price / r.entry_price - 1) * 100).toFixed(2)
        return <span style={{ color: change >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>{change >= 0 ? '+' : ''}{change}%</span>
      },
    },
    { title: '30天预测', dataIndex: 'predicted_price', width: 90, render: v => v?.toFixed(4) },
    {
      title: '预测准确度',
      dataIndex: 'accuracy',
      width: 120,
      render: v => v != null ? (
        <div>
          <Progress percent={Math.min(v, 100)} size="small" strokeColor={v >= 70 ? '#52c41a' : v >= 40 ? '#E87A30' : '#ff4d4f'} />
          <span style={{ fontSize: 11, color: '#999' }}>{v}%</span>
        </div>
      ) : <span style={{ color: '#999', fontSize: 12 }}>待验证</span>,
    },
    { title: '加入日期', dataIndex: 'added_at', width: 100 },
    {
      title: '操作',
      width: 160,
      render: (_, r) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<LineChartOutlined />}
            onClick={() => navigate(r.type === 'fund' ? `/fund/${r.code}` : `/stock/${r.code}`)}
          >
            分析
          </Button>
          {r.status === 'observing' && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleConvert(r.id)}>
              转持仓
            </Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemove(r.id)}>
            移除
          </Button>
        </Space>
      ),
    },
  ]

  const observing = items.filter(i => i.status === 'observing').length
  const verified = items.filter(i => i.status === 'verified').length

  return (
    <div className="page-container">
      <div className="page-title">观察池</div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="label">观察中</div>
          <div className="value" style={{ color: '#E87A30' }}>{observing}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="label">已验证</div>
          <div className="value" style={{ color: '#52c41a' }}>{verified}</div>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="label">总计</div>
          <div className="value">{items.length}</div>
        </div>
      </div>

      <div className="content-card">
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>
    </div>
  )
}