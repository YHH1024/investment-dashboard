import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area, ComposedChart,
} from 'recharts'
import { Tag } from 'antd'

const COLORS = {
  actual: '#2563EB',
  optimistic: '#E87A30',
  base: '#F59E0B',
  pessimistic: '#94A3B8',
  buy: '#52c41a',
  stopLoss: '#ff4d4f',
  takeProfit: '#722ed1',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const items = payload.filter(p => p.value != null)
  if (!items.length) return null
  const firstItem = items[0]
  const date = firstItem.payload.date || label
  return (
    <div style={{
      background: 'rgba(26,26,26,0.95)',
      borderRadius: 8,
      padding: '12px 16px',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      minWidth: 180,
    }}>
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>{date}</div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: item.color || '#fff', fontSize: 13 }}>{item.name}</span>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {typeof item.value === 'number' ? item.value.toFixed(4) : item.value}
          </span>
        </div>
      ))}
      {firstItem.payload.news && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #444' }}>
          <div style={{ color: '#E87A30', fontSize: 12, fontWeight: 600 }}>
            {firstItem.payload.news.direction === 'up' ? '↑' : '↓'} {firstItem.payload.news.title}
          </div>
        </div>
      )}
    </div>
  )
}



export default function TrendChart({
  actualData = [],
  predictionData = {},
  news = [],
  priceLevels = {},
  height = 420,
  title = '',
}) {
  const [period, setPeriod] = useState('1y')
  const periods = [
    { key: '1m', label: '1月' },
    { key: '3m', label: '3月' },
    { key: '6m', label: '6月' },
    { key: '1y', label: '1年' },
    { key: '3y', label: '3年' },
  ]

  const filteredActual = useMemo(() => {
    const daysMap = { '1m': 30, '3m': 90, '6m': 180, '1y': 365, '3y': 1095 }
    const days = daysMap[period] || 365
    return actualData.slice(-days)
  }, [actualData, period])

  const mergedData = useMemo(() => {
    const result = []
    const actualMap = {}
    filteredActual.forEach(d => { actualMap[d.date] = d })

    // Add actual data points
    filteredActual.forEach(d => {
      result.push({
        date: d.date,
        actual: d.price,
        optimistic: null,
        base: null,
        pessimistic: null,
        news: null,
      })
    })

    // Add prediction points
    const lastDate = filteredActual.length ? filteredActual[filteredActual.length - 1].date : ''
    const scenarios = ['乐观', '基准', '悲观']
    const keyMap = { '乐观': 'optimistic', '基准': 'base', '悲观': 'pessimistic' }

    scenarios.forEach(scenario => {
      const predData = predictionData[scenario] || []
      predData.forEach(p => {
        const existing = result.find(r => r.date === p.date)
        if (existing) {
          existing[keyMap[scenario]] = p.price
        } else {
          result.push({
            date: p.date,
            actual: null,
            optimistic: scenario === '乐观' ? p.price : null,
            base: scenario === '基准' ? p.price : null,
            pessimistic: scenario === '悲观' ? p.price : null,
            news: null,
          })
        }
      })
    })

    // Mark news dates
    if (news && news.length) {
      news.forEach(n => {
        const match = result.find(r => r.date === n.date)
        if (match) {
          match.news = {
            title: n.title,
            direction: n.impact === 'positive' ? 'up' : n.impact === 'negative' ? 'down' : 'flat',
            impact: n.impact,
          }
        }
      })
    }

    result.sort((a, b) => a.date.localeCompare(b.date))
    return result
  }, [filteredActual, predictionData, news])

  // News sidebar items
  const recentNews = (news || []).slice(0, 5)

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Chart area */}
      <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '16px 16px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>{title}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  background: period === p.key ? '#E87A30' : '#F5F5F5',
                  color: period === p.key ? '#fff' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#999' }}
              tickFormatter={v => v.slice(5)}
              axisLine={{ stroke: '#E8E8E8' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#999' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={v => v.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={32}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const nameMap = {
                  actual: '实际走势',
                  optimistic: '乐观预测',
                  base: '基准预测',
                  pessimistic: '悲观预测',
                }
                return nameMap[value] || value
              }}
            />

            {/* Price levels */}
            {priceLevels.buyPrice && (
              <ReferenceLine
                y={priceLevels.buyPrice}
                stroke={COLORS.buy}
                strokeDasharray="6 3"
                label={{ value: `买入 ${priceLevels.buyPrice}`, position: 'right', fontSize: 10, fill: COLORS.buy }}
              />
            )}
            {priceLevels.stopLoss && (
              <ReferenceLine
                y={priceLevels.stopLoss}
                stroke={COLORS.stopLoss}
                strokeDasharray="6 3"
                label={{ value: `止损 ${priceLevels.stopLoss}`, position: 'right', fontSize: 10, fill: COLORS.stopLoss }}
              />
            )}
            {priceLevels.takeProfit && (
              <ReferenceLine
                y={priceLevels.takeProfit}
                stroke={COLORS.takeProfit}
                strokeDasharray="6 3"
                label={{ value: `止盈 ${priceLevels.takeProfit}`, position: 'right', fontSize: 10, fill: COLORS.takeProfit }}
              />
            )}

            {/* Actual line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={COLORS.actual}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.actual, stroke: '#fff', strokeWidth: 2 }}
              name="actual"
              connectNulls={false}
            />

            {/* Prediction lines */}
            <Line
              type="monotone"
              dataKey="optimistic"
              stroke={COLORS.optimistic}
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.optimistic, stroke: '#fff', strokeWidth: 2 }}
              name="optimistic"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="base"
              stroke={COLORS.base}
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.base, stroke: '#fff', strokeWidth: 2 }}
              name="base"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="pessimistic"
              stroke={COLORS.pessimistic}
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.pessimistic, stroke: '#fff', strokeWidth: 2 }}
              name="pessimistic"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* News sidebar */}
      <div style={{
        width: 280,
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          关键新闻
        </div>
        {recentNews.length === 0 && (
          <div style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 40 }}>暂无相关新闻</div>
        )}
        {recentNews.map((n, idx) => (
          <div key={idx} style={{
            padding: '10px 0',
            borderBottom: idx < recentNews.length - 1 ? '1px solid #f5f5f5' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                borderRadius: 4,
                background: n.impact === 'positive' ? '#FFF7E6' : n.impact === 'negative' ? '#FFF1F0' : '#F5F5F5',
                color: n.impact === 'positive' ? '#E87A30' : n.impact === 'negative' ? '#ff4d4f' : '#999',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '20px',
              }}>
                {n.impact === 'positive' ? '↑' : n.impact === 'negative' ? '↓' : '-'}
              </span>
              <span style={{ fontSize: 11, color: '#999' }}>{n.date}</span>
            </div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5, marginBottom: 4 }}>{n.title}</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Tag
                color={n.impact === 'positive' ? 'orange' : n.impact === 'negative' ? 'red' : 'default'}
                style={{ fontSize: 11, margin: 0 }}
              >
                {n.impact === 'positive' ? '利好' : n.impact === 'negative' ? '利空' : '中性'}
              </Tag>
              {n.verified && (
                <span style={{
                  fontSize: 11,
                  color: n.predicted_impact === n.actual_impact ? '#52c41a' : '#ff4d4f',
                }}>
                  {n.predicted_impact === n.actual_impact ? '预测准确' : '预测偏差'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

