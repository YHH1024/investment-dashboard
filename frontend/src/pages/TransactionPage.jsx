import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Row, Col, Card, Tag, Statistic } from 'antd'
import { PlusOutlined, DeleteOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import api from '../api'

export default function TransactionPage() {
  const [txs, setTxs] = useState([])
  const [risk, setRisk] = useState(null)
  const [rescue, setRescue] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showRescue, setShowRescue] = useState(false)
  const [form] = Form.useForm()
  const [rescueForm] = Form.useForm()

  const fetchTxs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transactions/')
      setTxs(Array.isArray(res?.data) ? res.data : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchTxs() }, [])

  const handleAdd = async (values) => {
    try {
      await api.post('/transactions/', values)
      message.success('交易记录已添加')
      setShowAdd(false)
      form.resetFields()
      fetchTxs()
    } catch { message.error('添加失败') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`)
      message.success('已删除')
      fetchTxs()
    } catch { message.error('删除失败') }
  }

  const fetchRisk = async (code) => {
    try {
      const res = await api.get(`/transactions/risk/${code}`)
      setRisk(res?.data)
    } catch { setRisk(null) }
  }

  const handleRescue = async (values) => {
    try {
      const res = await api.get(`/transactions/rescue/${values.code}`, {
        params: { cost_price: values.cost_price, shares: values.shares }
      })
      setRescue(res?.data)
    } catch { setRescue(null) }
  }

  const columns = [
    { title: '日期', dataIndex: 'date', width: 100 },
    { title: '代码', dataIndex: 'code', width: 80 },
    { title: '名称', dataIndex: 'name', width: 150 },
    { title: '类型', dataIndex: 'type', width: 80,
      render: v => <Tag color={v === '买入' ? '#E87A30' : v === '卖出' ? '#52c41a' : '#1890ff'}>{v}</Tag>
    },
    { title: '金额', dataIndex: 'amount', width: 100, render: v => `¥${v?.toLocaleString()}` },
    { title: '价格', dataIndex: 'price', width: 80, render: v => v?.toFixed(4) },
    { title: '份额', dataIndex: 'shares', width: 80 },
    { title: '操作', width: 80,
      render: (_, r) => (
        <div>
          <Button type="link" size="small" onClick={() => fetchRisk(r.code)}>风险</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </div>
      )
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>交易记录</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setShowAdd(true)} style={{ background: '#E87A30', borderColor: '#E87A30' }}>
            添加交易
          </Button>
          <Button icon={<MedicineBoxOutlined />} onClick={() => setShowRescue(true)}>
            解套策略
          </Button>
        </div>
      </div>

      {/* Risk Metrics */}
      {risk && !risk.error && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}><Statistic title="年化收益" value={risk.annual_return} suffix="%" valueStyle={{ color: risk.annual_return >= 0 ? '#E87A30' : '#52c41a' }} /></Col>
            <Col span={4}><Statistic title="年化波动" value={risk.annual_volatility} suffix="%" /></Col>
            <Col span={4}><Statistic title="夏普比率" value={risk.sharpe_ratio} valueStyle={{ color: risk.sharpe_ratio > 1 ? '#52c41a' : '#E87A30' }} /></Col>
            <Col span={4}><Statistic title="最大回撤" value={risk.max_drawdown} suffix="%" valueStyle={{ color: '#52c41a' }} /></Col>
            <Col span={4}><Statistic title="胜率" value={risk.win_rate} suffix="%" /></Col>
            <Col span={4}><Statistic title="风险等级" value={risk.risk_level} valueStyle={{ color: risk.risk_level === '高' ? '#52c41a' : '#E87A30' }} /></Col>
          </Row>
        </Card>
      )}

      {/* Transaction Table */}
      <Table columns={columns} dataSource={txs} loading={loading} rowKey="id" size="small" pagination={{ pageSize: 20 }} />

      {/* Add Transaction Modal */}
      <Modal title="添加交易记录" open={showAdd} onCancel={() => setShowAdd(false)} onOk={() => form.submit()} okButtonProps={{ style: { background: '#E87A30', borderColor: '#E87A30' } }}>
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="基金/股票代码" rules={[{ required: true }]}>
                <Input placeholder="如 000311" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="名称">
                <Input placeholder="自动填充" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={[{ value: '买入' }, { value: '卖出' }, { value: '分红' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="价格" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="金额（元）" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="note" label="备注">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Rescue Strategy Modal */}
      <Modal title="被套解套策略" open={showRescue} onCancel={() => setShowRescue(false)} footer={null} width={700}>
        <Form form={rescueForm} onFinish={handleRescue} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="code" rules={[{ required: true }]}>
            <Input placeholder="基金/股票代码" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="cost_price" rules={[{ required: true }]}>
            <InputNumber placeholder="成本价" step={0.01} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="shares" rules={[{ required: true }]}>
            <InputNumber placeholder="持有份额" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ background: '#E87A30', borderColor: '#E87A30' }}>
              生成策略
            </Button>
          </Form.Item>
        </Form>

        {rescue && !rescue.error && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}><Statistic title="当前价格" value={rescue.current_price} precision={4} /></Col>
              <Col span={6}><Statistic title="成本价" value={rescue.cost_price} precision={4} /></Col>
              <Col span={6}><Statistic title="亏损比例" value={rescue.loss_pct} suffix="%" valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="亏损金额" value={rescue.loss_amount} prefix="¥" precision={0} valueStyle={{ color: '#52c41a' }} /></Col>
            </Row>

            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>解套方案</div>
            {rescue.strategies?.map((s, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8 }}>
                <Row gutter={16} align="middle">
                  <Col span={4}>
                    <Tag color={s.risk === '低' ? 'green' : s.risk === '中' ? 'orange' : 'red'}>{s.risk}风险</Tag>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{s.name}</div>
                  </Col>
                  <Col span={8}>{s.description}</Col>
                  <Col span={4}>{s.estimated_days ? `约${s.estimated_days}天` : '-'}</Col>
                  <Col span={8} style={{ fontSize: 13, color: '#666' }}>{s.action}</Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}