import { useState, useEffect } from 'react'
import { Row, Col, Tag, Card, Progress, Spin } from 'antd'
import { getNews, getNewsAccuracy } from '../api'

export default function NewsMonitor() {
  const [news, setNews] = useState([])
  const [accuracy, setAccuracy] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getNews(), getNewsAccuracy()])
      .then(([nRes, aRes]) => {
        setNews(nRes.data || [])
        setAccuracy(aRes.data || {})
      })
      .finally(() => setLoading(false))
  }, [])

  const impactColor = { positive: 'orange', negative: 'red', neutral: 'default' }
  const impactText = { positive: '利好', negative: '利空', neutral: '中性' }
  const impactIcon = { positive: '↑', negative: '↓', neutral: '-' }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div className="page-container">
      <div className="page-title">新闻监控</div>

      {/* Accuracy stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">总预测次数</div>
            <div className="value">{accuracy.total_predictions || 0}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">预测准确率</div>
            <div className="value" style={{ color: '#E87A30' }}>{accuracy.accuracy_rate || 0}%</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">利好准确率</div>
            <div className="value" style={{ color: '#52c41a' }}>{accuracy.positive_accuracy || 0}%</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">利空准确率</div>
            <div className="value" style={{ color: '#ff4d4f' }}>{accuracy.negative_accuracy || 0}%</div>
          </div>
        </Col>
      </Row>

      {/* News feed */}
      <div className="content-card">
        <div className="card-title">新闻动态</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {news.map(n => (
            <div key={n.id} style={{
              padding: 16,
              background: '#FAFAFA',
              borderRadius: 8,
              borderLeft: `3px solid ${n.impact === 'positive' ? '#E87A30' : n.impact === 'negative' ? '#ff4d4f' : '#d9d9d9'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 6 }}>
                    <span style={{ marginRight: 8, color: n.impact === 'positive' ? '#E87A30' : n.impact === 'negative' ? '#ff4d4f' : '#999', fontWeight: 700 }}>
                      {impactIcon[n.impact]}
                    </span>
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1A1A1A', textDecoration: 'none' }}>
                        {n.title}
                      </a>
                    ) : n.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{n.reason}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={impactColor[n.impact]}>{impactText[n.impact]}</Tag>
                    {n.affected?.map(code => (
                      <Tag key={code} color="blue">{code}</Tag>
                    ))}
                    <span style={{ fontSize: 12, color: '#999' }}>{n.date}</span>
                    {n.url && (
                      <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#E87A30', marginLeft: 8 }}>
                        查看详情 →
                      </a>
                    )}
                  </div>
                </div>

                {/* Verification */}
                {n.verified && (
                  <div style={{
                    padding: '8px 12px',
                    background: n.predicted_impact === n.actual_impact ? '#F6FFED' : '#FFF1F0',
                    borderRadius: 6,
                    marginLeft: 16,
                    minWidth: 100,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>次日验证</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.predicted_impact === n.actual_impact ? '#52c41a' : '#ff4d4f' }}>
                      {n.predicted_impact === n.actual_impact ? '预测准确' : '预测偏差'}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      预测: {impactText[n.predicted_impact]} / 实际: {impactText[n.actual_impact] || '-'}
                    </div>
                  </div>
                )}
                {!n.verified && (
                  <div style={{
                    padding: '8px 12px',
                    background: '#F5F5F5',
                    borderRadius: 6,
                    marginLeft: 16,
                    minWidth: 100,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>次日验证</div>
                    <div style={{ fontSize: 13, color: '#999' }}>待验证</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}