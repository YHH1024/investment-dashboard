import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Modal, Select, InputNumber, Input, message, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined } from '@ant-design/icons'
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../api'

export default function AlertCenter() {
  const [alerts, setAlerts] = useState({ active: [], triggered: [] })
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ code: '', name: '', type: 'fund', condition: 'above', target_value: 0, action_type: 'notify' })

  const fetchData = () => {
    setLoading(true)
    getAlerts().then(res => {
      setAlerts(res.data || { active: [], triggered: [] })
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!newAlert.code || !newAlert.name || !newAlert.target_value) {
      message.warning('请填写完整信息')
      return
    }
    await createAlert(newAlert)
    message.success('预警已创建')
    setAddOpen(false)
    setNewAlert({ code: '', name: '', type: 'fund', condition: 'above', target_value: 0, action_type: 'notify' })
    fetchData()
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除?',
      onOk: async () => {
        await deleteAlert(id)
        message.success('已删除')
        fetchData()
      },
    })
  }

  const conditionText = { above: '高于', below: '低于', change_pct: '涨跌幅超过' }
  const actionText = { notify: '通知提醒', buy: '自动买入', sell: '自动卖出' }
  const actionColor = { notify: 'blue', buy: 'green', sell: 'red' }

  const activeColumns = [
    { title: '代码', dataIndex: 'code', width: 90 },
    { title: '名称', dataIndex: 'name', width: 200 },
    { title: '类型', dataIndex: 'type', width: 70, render: v => <Tag>{v === 'fund' ? '基金' : '股票'}</Tag> },
    {
      title: '触发条件',
      width: 180,
      render: (_, r) => (
        <span>
          {conditionText[r.condition]} <strong>{r.target_value}</strong>
          {r.condition === 'change_pct' ? '%' : ''}
        </span>
      ),
    },
    {
      title: '执行动作',
      dataIndex: 'action_type',
      width: 100,
      render: v => <Tag color={actionColor[v]}>{actionText[v]}</Tag>,
    },
    { title: '创建日期', dataIndex: 'created_at', width: 100 },
    {
      title: '操作',
      width: 100,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  const triggeredColumns = [
    { title: '代码', dataIndex: 'code', width: 90 },
    { title: '名称', dataIndex: 'name', width: 200 },
    {
      title: '触发条件',
      width: 180,
      render: (_, r) => (
        <span>
          {conditionText[r.condition]} <strong>{r.target_value}</strong>
        </span>
      ),
    },
    {
      title: '执行动作',
      dataIndex: 'action_type',
      width: 100,
      render: v => <Tag color={actionColor[v]}>{actionText[v]}</Tag>,
    },
    { title: '触发时间', dataIndex: 'triggered_at', width: 100 },
    {
      title: '状态',
      width: 80,
      render: () => <Tag color="default">已触发</Tag>,
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title">提醒中心</div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <div className="stat-card">
            <div className="label">活跃预警</div>
            <div className="value" style={{ color: '#E87A30' }}>{alerts.active.length}</div>
          </div>
        </Col>
        <Col span={8}>
          <div className="stat-card">
            <div className="label">已触发</div>
            <div className="value">{alerts.triggered.length}</div>
          </div>
        </Col>
        <Col span={8}>
          <div className="stat-card">
            <div className="label">总计</div>
            <div className="value">{alerts.active.length + alerts.triggered.length}</div>
          </div>
        </Col>
      </Row>

      {/* Active alerts */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>活跃预警</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)} style={{ background: '#E87A30', borderColor: '#E87A30' }}>
            创建预警
          </Button>
        </div>
        <Table dataSource={alerts.active} columns={activeColumns} rowKey="id" loading={loading} pagination={false} size="middle" />
      </div>

      {/* Triggered history */}
      <div className="content-card">
        <div className="card-title">触发历史</div>
        <Table dataSource={alerts.triggered} columns={triggeredColumns} rowKey="id" loading={loading} pagination={false} size="middle" />
      </div>

      {/* Create modal */}
      <Modal
        title="创建预警"
        open={addOpen}
        onOk={handleCreate}
        onCancel={() => setAddOpen(false)}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ style: { background: '#E87A30', borderColor: '#E87A30' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>代码</div>
              <Input value={newAlert.code} onChange={e => setNewAlert({ ...newAlert, code: e.target.value })} placeholder="000311" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>名称</div>
              <Input value={newAlert.name} onChange={e => setNewAlert({ ...newAlert, name: e.target.value })} placeholder="基金名称" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>类型</div>
              <Select value={newAlert.type} onChange={v => setNewAlert({ ...newAlert, type: v })} style={{ width: '100%' }} options={[{ value: 'fund', label: '基金' }, { value: 'stock', label: '股票' }]} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>触发条件</div>
              <Select value={newAlert.condition} onChange={v => setNewAlert({ ...newAlert, condition: v })} style={{ width: '100%' }} options={[{ value: 'above', label: '高于' }, { value: 'below', label: '低于' }, { value: 'change_pct', label: '涨跌幅超过' }]} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>目标值</div>
              <InputNumber value={newAlert.target_value} onChange={v => setNewAlert({ ...newAlert, target_value: v })} style={{ width: '100%' }} min={0} step={0.01} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>执行动作</div>
              <Select value={newAlert.action_type} onChange={v => setNewAlert({ ...newAlert, action_type: v })} style={{ width: '100%' }} options={[{ value: 'notify', label: '通知提醒' }, { value: 'buy', label: '自动买入' }, { value: 'sell', label: '自动卖出' }]} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}