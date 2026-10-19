import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, Button, Spin, message, Row, Col, Progress, Table } from 'antd'
import { SearchOutlined, EyeOutlined, BellOutlined } from '@ant-design/icons'
import api from '../api'

// Chart component with drag-to-zoom
const FundChart = ({ data, preds, period = '1y' }) => {
  const [viewRange, setViewRange] = useState({ left: 0, right: 1 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const chartRef = useRef(null)

  if (!data || data.length < 2) return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>暂无走势数据</div>

  const prices = data.map(d => d.price)
  const lastPrice = prices[prices.length - 1]
  const predDays = 30

  // Prediction targets
  const predTargets = {}
  for (const [k, v] of Object.entries(preds || {})) {
    if (Array.isArray(v) && v.length > 0) predTargets[k] = v[v.length - 1]?.price || lastPrice
    else if (typeof v === 'number') predTargets[k] = v
    else predTargets[k] = lastPrice * (k === '乐观' ? 1.08 : k === '基准' ? 1.03 : 0.92)
  }

  // Smooth curves
  const genCurve = (target) => {
    const arr = []
    for (let i = 1; i <= predDays; i++) {
      const t = i / predDays
      const ease = t * t * (3 - 2 * t)
      arr.push(lastPrice + (target - lastPrice) * ease)
    }
    return arr
  }
  const predCurves = { '乐观': genCurve(predTargets['乐观']), '基准': genCurve(predTargets['基准']), '悲观': genCurve(predTargets['悲观']) }

  // Apply zoom range
  const startIdx = Math.floor(viewRange.left * (prices.length - 1))
  const endIdx = Math.ceil(viewRange.right * (prices.length - 1))
  const visiblePrices = prices.slice(startIdx, endIdx + 1)
  const visibleData = data.slice(startIdx, endIdx + 1)

  const allP = [...visiblePrices, ...Object.values(predCurves).flat()]
  const mn = Math.min(...allP) * 0.995
  const mx = Math.max(...allP) * 1.005
  const rng = mx - mn || 1

  const PAD = { T: 30, B: 50, L: 70, R: 100 }
  const W = 900, H = 400
  const cW = W - PAD.L - PAD.R, cH = H - PAD.T - PAD.B
  const totalVisible = visiblePrices.length + predDays
  const toX = i => PAD.L + (i / totalVisible) * cW
  const toY = v => PAD.T + cH - ((v - mn) / rng) * cH

  // Time labels
  // Dynamic time labels based on data density
  const visibleCount = visiblePrices.length
  const labelCount = Math.min(8, Math.max(3, Math.floor(visibleCount / 5)))
  const step = Math.max(1, Math.floor(visibleCount / labelCount))
  const histLabels = []
  for (let i = 0; i < visibleCount; i += step) {
    const realIdx = startIdx + i
    const date = data[realIdx]?.date || ''
    // Show MM-DD format for daily data
    const label = date.length > 5 ? date.slice(5) : date
    histLabels.push({ x: toX(i), label })
  }

  const predLabels = [7, 15, 30].filter(d => d <= predDays).map(d => ({ x: toX(visiblePrices.length + d), label: `+${d}天` }))
  const pSteps = 6
  const priceLabels = Array.from({ length: pSteps + 1 }, (_, i) => {
    const v = mn + (rng / pSteps) * i
    return { y: toY(v), label: v.toFixed(2) }
  })

  const predStyles = [
    { key: '乐观', color: '#E87A30', width: 3, dash: '10,4', label: '乐观' },
    { key: '基准', color: '#F59E0B', width: 2.5, dash: '6,4', label: '基准' },
    { key: '悲观', color: '#94A3B8', width: 2, dash: '3,5', label: '悲观' },
  ]

  const smoothPath = (pts) => {
    if (pts.length < 2) return ''
    let d = `M ${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i-1][0] + (pts[i][0] - pts[i-1][0]) * 0.5
      const cp2x = pts[i][0] - (pts[i][0] - pts[i-1][0]) * 0.5
      d += ` C ${cp1x},${pts[i-1][1]} ${cp2x},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`
    }
    return d
  }

  // Mouse handlers for drag-to-zoom
  const getChartX = (clientX) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left - PAD.L) / cW))
  }

  const handleMouseDown = (e) => {
    const x = getChartX(e.clientX)
    setDragging(true)
    setDragStart(x)
    setDragEnd(x)
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    setDragEnd(getChartX(e.clientX))
  }

  const handleMouseUp = () => {
    if (!dragging || !dragStart || !dragEnd) {
      setDragging(false)
      return
    }
    const left = Math.min(dragStart, dragEnd)
    const right = Math.max(dragStart, dragEnd)
    const range = right - left
    if (range > 0.02) { // minimum 2% selection
      const newLeft = viewRange.left + left * (viewRange.right - viewRange.left)
      const newRight = viewRange.left + right * (viewRange.right - viewRange.left)
      setViewRange({ left: newLeft, right: newRight })
    }
    setDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const zoomOut = () => setViewRange({ left: 0, right: 1 })

  const isZoomed = viewRange.left > 0.01 || viewRange.right < 0.99

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#999' }}>
          {isZoomed ? '拖拽选择区域放大 · ' : '拖拽选择区域放大 · 点击"重置"恢复'} 
          当前显示: {Math.round((viewRange.right - viewRange.left) * 100)}% 
        </div>
        {isZoomed && (
          <button onClick={zoomOut} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E87A30', background: '#fff', color: '#E87A30', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            重置缩放
          </button>
        )}
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ overflow: 'hidden', borderRadius: 8, cursor: dragging ? 'col-resize' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          {/* Background */}
          <rect x={toX(visiblePrices.length)} y={PAD.T} width={W - PAD.R - toX(visiblePrices.length)} height={cH} fill="#FFF8F0" opacity={0.5} />

          {/* Grid */}
          {priceLabels.map((p, i) => <line key={`g${i}`} x1={PAD.L} y1={p.y} x2={W - PAD.R} y2={p.y} stroke="#f0f0f0" strokeWidth={1} />)}

          {/* Y labels */}
          {priceLabels.map((p, i) => <text key={`yl${i}`} x={PAD.L - 12} y={p.y + 4} textAnchor="end" fontSize={12} fill="#666" fontWeight={500}>{p.label}</text>)}

          {/* X labels */}
          {histLabels.map((t, i) => <text key={`xl${i}`} x={t.x} y={H - 15} textAnchor="middle" fontSize={11} fill="#999">{t.label}</text>)}
          {predLabels.map((t, i) => <text key={`pl${i}`} x={t.x} y={H - 15} textAnchor="middle" fontSize={11} fill="#E87A30" fontWeight={500}>{t.label}</text>)}

          {/* Divider with current date */}
          <line x1={toX(visiblePrices.length)} y1={PAD.T} x2={toX(visiblePrices.length)} y2={H - PAD.B} stroke="#E87A30" strokeWidth={1.5} strokeDasharray="6,3" opacity={0.6} />
          <text x={toX(visiblePrices.length)} y={PAD.T - 8} textAnchor="middle" fontSize={12} fill="#E87A30" fontWeight={600}>
            {new Date().toISOString().slice(5, 10)} 今日
          </text>

          {/* Actual line */}
          <path d={smoothPath(visiblePrices.map((p, i) => [toX(i), toY(p)]))} fill="none" stroke="#2563EB" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

          {/* Prediction curves */}
          {predStyles.map(s => {
            const curve = predCurves[s.key]
            if (!curve) return null
            const pts = curve.map((p, i) => [toX(visiblePrices.length + i + 1), toY(p)])
            const last = pts[pts.length - 1]
            return (
              <g key={s.key}>
                <path d={smoothPath(pts)} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last[0]} cy={last[1]} r={5} fill={s.color} stroke="#fff" strokeWidth={2} />
                <text x={W - PAD.R + 8} y={last[1] + 4} fontSize={12} fill={s.color} fontWeight={700}>{s.label}</text>
                <text x={W - PAD.R + 8} y={last[1] + 18} fontSize={11} fill={s.color}>{curve[curve.length-1].toFixed(2)}</text>
              </g>
            )
          })}

          {/* Last actual point */}
          <circle cx={toX(visiblePrices.length - 1)} cy={toY(visiblePrices[visiblePrices.length - 1])} r={6} fill="#2563EB" stroke="#fff" strokeWidth={3} />
          <text x={toX(visiblePrices.length - 1) + 10} y={toY(visiblePrices[visiblePrices.length - 1]) - 12} fontSize={14} fill="#2563EB" fontWeight={700}>{visiblePrices[visiblePrices.length - 1].toFixed(4)}</text>
          <text x={toX(visiblePrices.length - 1) + 10} y={toY(visiblePrices[visiblePrices.length - 1]) + 4} fontSize={11} fill="#999">当前净值</text>

          {/* Drag selection overlay */}
          {dragging && dragStart != null && dragEnd != null && (
            <rect
              x={Math.min(dragStart, dragEnd) * cW + PAD.L}
              y={PAD.T}
              width={Math.abs(dragEnd - dragStart) * cW}
              height={cH}
              fill="#E87A30"
              opacity={0.1}
              stroke="#E87A30"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: '#2563EB' }}>━━ 实际走势</span>
        <span style={{ fontSize: 12, color: '#E87A30' }}>━━ 乐观</span>
        <span style={{ fontSize: 12, color: '#F59E0B' }}>━━ 基准</span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>━━ 悲观</span>
      </div>
    </div>
  )
}

export default function FundAnalysis() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(urlCode || '000311')
  const [fund, setFund] = useState(null)
  const [history, setHistory] = useState([])
  const [predictions, setPredictions] = useState({})
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [period, setPeriod] = useState('1m')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async (fundCode, p) => {
    setLoading(true)
    try {
      const per = p || period
      const [fRes, hRes, pRes, nRes] = await Promise.all([
        api.get(`/funds/${fundCode}`).catch(() => ({ data: null })),
        api.get(`/funds/${fundCode}/history`, { params: { period: per } }).catch(() => ({ data: [] })),
        api.get(`/funds/${fundCode}/predictions`).catch(() => ({ data: {} })),
        api.get('/news/', { params: { code: fundCode } }).catch(() => ({ data: [] })),
      ])
      if (fRes?.data) setFund(fRes.data)
      setHistory(Array.isArray(hRes?.data) ? hRes.data : [])
      setPredictions(pRes?.data && typeof pRes.data === 'object' ? pRes.data : {})
      setNews(Array.isArray(nRes?.data) ? nRes.data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const c = urlCode || '000311'
    setCode(c)
    fetchData(c, period)
  }, [urlCode, period])

  const handleSearch = () => { if (code) { navigate(`/fund/${code}`); fetchData(code) } }

  const addToWatchlist = async () => {
    if (!fund) return
    try {
      await api.post('/watchlist/', {
        code: fund.code,
        name: fund.name,
        type: 'fund',
        current_price: fund.nav,
        target_price: fund.predictions?.['乐观']?.[0]?.price || fund.nav * 1.1,
        note: '从基金分析页添加'
      })
      message.success('已加入观察池')
    } catch (e) {
      message.error('添加失败')
    }
  }

  const handleAiAnalysis = async () => {
    if (!code) return
    setAiLoading(true)
    try {
      const res = await api.get(`/funds/${code}?ai=true`, { timeout: 20000 })
      if (res?.data) {
        setFund(res.data)
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
        message.error('AI分析失败: ' + (e.message || '未知错误'))
      }
    } finally {
      setAiLoading(false)
    }
  }

  const fmt = (d) => {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }

  const perfData = fund ? [
    { key: '1m', period: '近1月', fund: fund.performance?.['1m'], benchmark: fund.benchmark?.['1m'] },
    { key: '3m', period: '近3月', fund: fund.performance?.['3m'], benchmark: fund.benchmark?.['3m'] },
    { key: '6m', period: '近6月', fund: fund.performance?.['6m'], benchmark: fund.benchmark?.['6m'] },
    { key: '1y', period: '近1年', fund: fund.performance?.['1y'], benchmark: fund.benchmark?.['1y'] },
    { key: '3y', period: '近3年', fund: fund.performance?.['3y'], benchmark: fund.benchmark?.['3y'] },
  ] : []

  const perfCols = [
    { title: '周期', dataIndex: 'period', width: 80 },
    { title: '本基金', dataIndex: 'fund', render: v => <span style={{ color: v >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>{v >= 0 ? '+' : ''}{v}%</span> },
    { title: '基准', dataIndex: 'benchmark', render: v => `${v}%` },
    { title: '超额', key: 'a', render: (_, r) => { const a = (r.fund - r.benchmark).toFixed(1); return <span style={{ color: a >= 0 ? '#E87A30' : '#52c41a', fontWeight: 600 }}>{a >= 0 ? '+' : ''}{a}%</span> } },
  ]

  const holdCols = [
    { title: '#', render: (_, __, i) => i + 1, width: 50 },
    { title: '股票', dataIndex: 'name' },
    { title: '占比', dataIndex: 'pct', width: 80, render: v => <span style={{ fontWeight: 600 }}>{v}%</span> },
    { title: '', render: (_, r) => <Progress percent={r.pct * 10} showInfo={false} strokeColor="#E87A30" size="small" /> },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>基金分析</h1>
        <div style={{ fontSize: 14, color: '#888', fontFamily: 'monospace' }}>{fmt(currentTime)}</div>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="输入基金代码" style={{ width: 300 }} onPressEnter={handleSearch} />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: '#E87A30', borderColor: '#E87A30' }}>查询</Button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
      : fund ? (
        <>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Row gutter={24} align="middle">
              <Col>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{fund.name}</div>
                <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{fund.code} | {fund.type} | {fund.company}</div>
              </Col>
              <Col>
                <div style={{ fontSize: 36, fontWeight: 700 }}>{fund.nav?.toFixed(4)}</div>
                <div style={{ fontSize: 14, color: fund.daily_return >= 0 ? '#E87A30' : '#52c41a' }}>{fund.daily_return >= 0 ? '+' : ''}{fund.daily_return}%</div>
              </Col>
              <Col>
                <div style={{ fontSize: 12, color: '#999' }}>实时更新</div>
                <div style={{ fontSize: 12, color: '#E87A30', fontWeight: 600 }}>{fmt(currentTime)}</div>
              </Col>
              <Col flex="auto" />
              <Col>
                <Button icon={<EyeOutlined />} onClick={addToWatchlist} style={{ marginRight: 8 }}>加入观察池</Button>
                <Button icon={<BellOutlined />} style={{ marginRight: 8 }}>设置预警</Button>
                <Button type="primary" loading={aiLoading} onClick={handleAiAnalysis} style={{ background: '#E87A30', borderColor: '#E87A30' }}>
                  {aiLoading ? 'AI分析中...' : 'AI分析'}
                </Button>
              </Col>
            </Row>
          </div>

          {/* Chart */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{fund.name} 走势与预测</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1d', '5d', '1m', '3m', '6m', '1y', '3y'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    background: period === p ? '#E87A30' : '#f0f0f0', color: period === p ? '#fff' : '#666', transition: 'all 0.2s',
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <FundChart data={history} preds={predictions} period={period} />
          </div>

          <Row gutter={16}>
            <Col span={16}>
              {/* 30-day prediction */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>30天走势预测</div>
                <Row gutter={16}>
                  {['乐观', '基准', '悲观'].map(s => {
                    const arr = predictions[s]
                    if (!arr || !arr.length) return null
                    const last = arr[arr.length - 1]?.price
                    if (!last) return null
                    const ch = ((last / fund.nav - 1) * 100).toFixed(2)
                    const color = s === '乐观' ? '#E87A30' : s === '基准' ? '#1A1A1A' : '#999'
                    const bg = s === '乐观' ? '#fff7e6' : s === '基准' ? '#f6ffed' : '#f5f5f5'
                    return (
                      <Col span={8} key={s}>
                        <div style={{ textAlign: 'center', padding: 16, background: bg, borderRadius: 8 }}>
                          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{s}</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color }}>{last.toFixed(4)}</div>
                          <div style={{ fontSize: 13, color: ch >= 0 ? '#E87A30' : '#52c41a', marginTop: 4 }}>{ch >= 0 ? '+' : ''}{ch}%</div>
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              </div>

              {/* AI Analysis */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>AI分析结论</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333' }}>{fund.ai_analysis}</div>
                {fund.analysis?.key_factors?.map((f, i) => (
                  <div key={i} style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{f.factor}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E87A30' }}>{f.score}分</span>
                    </div>
                    <Progress percent={f.score} showInfo={false} strokeColor="#E87A30" size="small" />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{f.detail}</div>
                  </div>
                ))}
              </div>

              {/* Performance */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>业绩对比</div>
                <Table columns={perfCols} dataSource={perfData} pagination={false} size="small" />
              </div>

              {/* Holdings */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>前十大持仓</div>
                <Table columns={holdCols} dataSource={fund.top10_holdings?.map((h, i) => ({ ...h, key: i }))} pagination={false} size="small" />
              </div>
            </Col>

            <Col span={8}>
              {/* Fund info */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>基金信息</div>
                {[
                  { l: '基金经理', v: fund.manager },
                  { l: '基金公司', v: fund.company },
                  { l: '成立日期', v: fund.establish_date },
                  { l: '基金规模', v: `${fund.size}亿` },
                  { l: '费率', v: `${fund.fee_rate}%` },
                  { l: '累计收益', v: `${fund.total_return}%` },
                ].map(i => (
                  <div key={i.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ color: '#888', fontSize: 13 }}>{i.l}</span>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{i.v}</span>
                  </div>
                ))}
              </div>

              {/* Prediction summary */}
              <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>预测汇总</div>
                {['乐观', '基准', '悲观'].map(s => {
                  const arr = predictions[s]
                  if (!arr || !arr.length) return null
                  const last = arr[arr.length - 1]?.price
                  if (!last) return null
                  const ch = ((last / fund.nav - 1) * 100).toFixed(2)
                  return (
                    <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#888' }}>{s}</span>
                      <span style={{ fontWeight: 600 }}>{last.toFixed(4)}</span>
                      <span style={{ color: ch >= 0 ? '#E87A30' : '#52c41a', fontSize: 13 }}>{ch >= 0 ? '+' : ''}{ch}%</span>
                    </div>
                  )
                })}
              </div>
            </Col>
          </Row>
        </>
      ) : <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>输入基金代码并点击查询</div>}
    </div>
  )
}
