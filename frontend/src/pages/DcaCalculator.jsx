import { useState } from 'react'
import { Input, Select, DatePicker, Button, Row, Col, Spin, Descriptions, message } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { calculateDca } from '../api'
import dayjs from 'dayjs'

export default function DcaCalculator() {
  const [code, setCode] = useState('000311')
  const [amount, setAmount] = useState(1000)
  const [frequency, setFrequency] = useState('monthly')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const res = await calculateDca({ code, amount, frequency })
      setResult(res.data)
    } catch {
      message.error('计算失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-title">定投计算器</div>

      {/* Input form */}
      <div className="content-card">
        <div className="card-title">定投参数</div>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>基金代码</div>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="000311" />
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>每期金额(元)</div>
            <Input value={amount} onChange={e => setAmount(Number(e.target.value))} type="number" />
          </Col>
          <Col span={5}>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>定投频率</div>
            <Select
              value={frequency}
              onChange={setFrequency}
              style={{ width: '100%' }}
              options={[
                { value: 'daily', label: '每日' },
                { value: 'weekly', label: '每周' },
                { value: 'monthly', label: '每月' },
              ]}
            />
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={handleCalculate}
              loading={loading}
              style={{ background: '#E87A30', borderColor: '#E87A30', marginTop: 22 }}
            >
              开始计算
            </Button>
          </Col>
        </Row>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>}

      {result && !loading && (
        <>
          {/* Summary */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">总投入</div>
                <div className="value" style={{ fontSize: 20 }}>¥{result.summary?.total_invested?.toLocaleString()}</div>
              </div>
            </Col>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">最终市值</div>
                <div className="value" style={{ fontSize: 20 }}>¥{result.summary?.final_value?.toLocaleString()}</div>
              </div>
            </Col>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">累计收益率</div>
                <div className="value" style={{ fontSize: 20, color: result.summary?.total_return >= 0 ? '#E87A30' : '#52c41a' }}>
                  {result.summary?.total_return >= 0 ? '+' : ''}{result.summary?.total_return}%
                </div>
              </div>
            </Col>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">总份额</div>
                <div className="value" style={{ fontSize: 20 }}>{result.summary?.total_shares?.toFixed(2)}</div>
              </div>
            </Col>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">平均成本</div>
                <div className="value" style={{ fontSize: 20 }}>{result.summary?.avg_cost?.toFixed(4)}</div>
              </div>
            </Col>
            <Col span={4}>
              <div className="stat-card">
                <div className="label">回测区间</div>
                <div className="value" style={{ fontSize: 14 }}>{result.summary?.period}</div>
              </div>
            </Col>
          </Row>

          {/* Backtest chart */}
          <div className="content-card">
            <div className="card-title">回测收益曲线</div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={result.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#999' }} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip
                  contentStyle={{ background: 'rgba(26,26,26,0.95)', borderRadius: 8, border: 'none' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(v) => [`¥${v?.toLocaleString()}`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="invested" stroke="#94A3B8" strokeWidth={2} dot={false} name="累计投入" />
                <Line type="monotone" dataKey="value" stroke="#E87A30" strokeWidth={2} dot={false} name="当前市值" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forward simulation */}
          <div className="content-card">
            <div className="card-title">未来3年模拟预测</div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={(() => {
                  const base = result.forward_simulation?.['基准'] || []
                  const opt = result.forward_simulation?.['乐观'] || []
                  const pes = result.forward_simulation?.['悲观'] || []
                  return base.map((b, i) => ({
                    month: `第${b.month}月`,
                    基准投入: b.invested,
                    基准市值: b.value,
                    乐观市值: opt[i]?.value,
                    悲观市值: pes[i]?.value,
                  }))
                })()}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#999' }} />
                <YAxis tick={{ fontSize: 11, fill: '#999' }} tickFormatter={v => (v / 10000).toFixed(0) + 'w'} />
                <Tooltip
                  contentStyle={{ background: 'rgba(26,26,26,0.95)', borderRadius: 8, border: 'none' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(v) => [`¥${v?.toLocaleString()}`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="基准投入" stroke="#94A3B8" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                <Line type="monotone" dataKey="乐观市值" stroke="#E87A30" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="基准市值" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="悲观市值" stroke="#94A3B8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="content-card">
          <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>$</div>
            <div style={{ fontSize: 14 }}>请输入参数后点击"开始计算"</div>
          </div>
        </div>
      )}
    </div>
  )
}