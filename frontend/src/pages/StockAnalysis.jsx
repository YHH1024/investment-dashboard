import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, Button, Spin, message, Row, Col, Progress, InputNumber, Tag } from 'antd'
import { SearchOutlined, EyeOutlined, BellOutlined } from '@ant-design/icons'
import api from '../api'

export default function StockAnalysis() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(urlCode || '600036')
  const [stock, setStock] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [rescue, setRescue] = useState(null)
  const [rescueLoading, setRescueLoading] = useState(false)
  const [costPrice, setCostPrice] = useState('')
  const [shares, setShares] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async (stockCode) => {
    setLoading(true)
    setStock(null)
    try {
      const res = await api.get(`/stocks/${stockCode}`)
      if (res && res.data) setStock(res.data)
      else message.error('未找到股票数据')
    } catch (e) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const c = urlCode || '600036'
    setCode(c)
    fetchData(c)
  }, [urlCode])

  const handleSearch = () => { if (code) { navigate(`/stock/${code}`); fetchData(code) } }

  const addToWatchlist = async () => {
    if (!stock) return
    try {
      await api.post('/watchlist/', {
        code: stock.code,
        name: stock.name,
        type: 'stock',
        current_price: stock.price,
        target_price: stock.sell_price || stock.price * 1.1,
        note: '从股票分析页添加'
      })
      message.success('已加入观察池')
    } catch (e) {
      message.error('添加失败')
    }
  }

  const fetchRescue = async () => {
    if (!code || !costPrice || !shares) {
      message.warning('请输入成本价和持有股数')
      return
    }
    setRescueLoading(true)
    try {
      const res = await api.get(`/transactions/rescue/${code}`, {
        params: { cost_price: parseFloat(costPrice), shares: parseFloat(shares) }
      })
      if (res?.data && !res.data.error) {
        setRescue(res.data)
        message.success('解套策略已生成')
      } else {
        message.error(res.data?.error || '生成失败')
      }
    } catch (e) {
      message.error('获取解套策略失败')
    }
    setRescueLoading(false)
  }

  const handleAiAnalysis = async () => {
    if (!code) return
    setAiLoading(true)
    try {
      const res = await api.get(`/stocks/${code}?ai=true`, { timeout: 20000 })
      if (res?.data) {
        setStock(res.data)
        if (res.data.ai_analysis && res.data.ai_analysis.length > 20) {
          message.success('AI分析完成')
        } else {
          message.warning('AI未返回有效分析，请检查API配置')
        }
      }
    } catch (e) {
      if (e.code === 'ECONNABORTED') {
        message.error('AI分析超时，请检查API Key配置')
      } else {
        message.error('AI分析失败')
      }
    }
    setAiLoading(false)
  }

  const fmt = (d) => {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>股票分析</h1>
        <div style={{ fontSize: 14, color: '#888', fontFamily: 'monospace' }}>{fmt(currentTime)}</div>
      </div>
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="输入股票代码" style={{ width: 300 }} onPressEnter={handleSearch} />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: '#E87A30', borderColor: '#E87A30' }}>查询</Button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
      : stock ? (
        <>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Row gutter={24} align="middle">
              <Col>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{stock.name}</div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{stock.code} | {stock.industry}</div>
              </Col>
              <Col>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{stock.price?.toFixed(2)}</div>
                <div style={{ fontSize: 14, color: stock.daily_return >= 0 ? '#E87A30' : '#52c41a' }}>{stock.daily_return >= 0 ? '+' : ''}{stock.daily_return}%</div>
              </Col>
              <Col>
                <div style={{ fontSize: 12, color: '#999' }}>实时更新</div>
                <div style={{ fontSize: 12, color: '#E87A30', fontWeight: 600 }}>{fmt(currentTime)}</div>
              </Col>
              <Col flex="auto" />
              <Col>
                <Button icon={<EyeOutlined />} onClick={addToWatchlist} style={{ marginRight: 8 }}>加入观察池</Button>
                <Button icon={<BellOutlined />}>设置预警</Button>
              </Col>
            </Row>
          </div>

          {/* Chart + Predictions */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{stock.name} 走势与预测</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, minHeight: 250, background: '#fafafa', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: '#1A1A1A' }}>{stock.price?.toFixed(2)}</div>
                  <div style={{ fontSize: 18, color: stock.daily_return >= 0 ? '#E87A30' : '#52c41a', marginTop: 8 }}>{stock.daily_return >= 0 ? '+' : ''}{stock.daily_return}%</div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 12 }}>当前价格</div>
                </div>
              </div>
              <div style={{ width: 280 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>30天预测</div>
                {stock.predictions && [
                  { key: '乐观', price: stock.predictions['乐观'], color: '#E87A30' },
                  { key: '基准', price: stock.predictions['基准'], color: '#1A1A1A' },
                  { key: '悲观', price: stock.predictions['悲观'], color: '#999' },
                ].map(s => {
                  if (!s.price) return null
                  const change = ((s.price / stock.price - 1) * 100).toFixed(2)
                  return (
                    <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#888' }}>{s.key}</span>
                      <span style={{ fontWeight: 600 }}>{s.price.toFixed(2)}</span>
                      <span style={{ color: change >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>{change >= 0 ? '+' : ''}{change}%</span>
                    </div>
                  )
                })}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>关键价位</div>
                  {stock.buy_price && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f6ffed', borderRadius: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#52c41a' }}>买入</span><span style={{ fontWeight: 600, color: '#52c41a' }}>{stock.buy_price}</span>
                  </div>}
                  {stock.sell_price && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#fff7e6', borderRadius: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#E87A30' }}>卖出</span><span style={{ fontWeight: 600, color: '#E87A30' }}>{stock.sell_price}</span>
                  </div>}
                  {stock.stop_loss && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#fff2f0', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, color: '#ff4d4f' }}>止损</span><span style={{ fontWeight: 600, color: '#ff4d4f' }}>{stock.stop_loss}</span>
                  </div>}
                </div>
              </div>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={16}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>估值面板</div>
                <Row gutter={24}>
                  {[{ l: 'PE(TTM)', v: stock.pe, p: stock.pe_percentile }, { l: 'PB', v: stock.pb, p: stock.pb_percentile },
                    { l: '股息率', v: stock.dividend_yield+'%', p: null }, { l: '市值', v: stock.market_cap+'亿', p: null }
                  ].map(i => (
                    <Col span={6} key={i.l}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{i.l}</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{i.v}</div>
                        {i.p != null && <div style={{ marginTop: 8 }}><Progress percent={i.p} size="small" strokeColor="#E87A30" showInfo={false} /><div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>分位: {i.p}%</div></div>}
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>AI分析结论</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>{stock.ai_analysis}</div>
              </div>

              {/* Rescue Strategy */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>解套策略分析</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                  <InputNumber placeholder="成本价" value={costPrice} onChange={setCostPrice} step={0.01} style={{ width: 120 }} />
                  <InputNumber placeholder="持有股数" value={shares} onChange={setShares} style={{ width: 120 }} />
                  <Button type="primary" loading={rescueLoading} onClick={fetchRescue} style={{ background: '#E87A30', borderColor: '#E87A30' }}>
                    生成解套方案
                  </Button>
                </div>
                {rescue && (
                  <div>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={6}>
                        <div style={{ textAlign: 'center', padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: '#999' }}>当前价格</div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{rescue.current_price}</div>
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ textAlign: 'center', padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: '#999' }}>成本价</div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{rescue.cost_price}</div>
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ textAlign: 'center', padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: '#999' }}>亏损比例</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{rescue.loss_pct}%</div>
                        </div>
                      </Col>
                      <Col span={6}>
                        <div style={{ textAlign: 'center', padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: '#999' }}>亏损金额</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>¥{rescue.loss_amount?.toLocaleString()}</div>
                        </div>
                      </Col>
                    </Row>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>解套方案</div>
                    {rescue.strategies?.map((s, i) => (
                      <div key={i} style={{ padding: 12, background: '#FAFAFA', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${s.risk === '低' ? '#52c41a' : s.risk === '中' ? '#E87A30' : '#ff4d4f'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontWeight: 600, marginRight: 8 }}>{s.name}</span>
                            <span style={{ fontSize: 12, color: s.risk === '低' ? '#52c41a' : s.risk === '中' ? '#E87A30' : '#ff4d4f', background: s.risk === '低' ? '#f6ffed' : s.risk === '中' ? '#fff7e6' : '#fff2f0', padding: '2px 8px', borderRadius: 4 }}>{s.risk}风险</span>
                          </div>
                          {s.estimated_days && <span style={{ fontSize: 12, color: '#999' }}>约{s.estimated_days}天</span>}
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{s.description}</div>
                        <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{s.action}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {stock.recovery_plan && <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>解套方案</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>{stock.recovery_plan}</div>
              </div>}
            </Col>
            <Col span={8}>
              {stock.moat && <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>护城河评分</div>
                {Object.entries(stock.moat).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 12, color: '#666' }}>{k}</span><span style={{ fontSize: 12, fontWeight: 600, color: '#E87A30' }}>{v}</span></div>
                    <Progress percent={v} showInfo={false} strokeColor="#E87A30" size="small" />
                  </div>
                ))}
              </div>}
            </Col>
          </Row>
        </>
      ) : <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>输入股票代码并点击查询</div>}
    </div>
  )
}
