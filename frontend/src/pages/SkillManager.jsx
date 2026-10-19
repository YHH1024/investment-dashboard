import { useState, useEffect } from 'react'
import { Card, Row, Col, Switch, Tag, Table, Button, Descriptions, Collapse, message, Modal, Input } from 'antd'
import { SettingOutlined, HistoryOutlined, EditOutlined } from '@ant-design/icons'
import { getSkills, toggleSkill, toggleSubSkill } from '../api'

export default function SkillManager() {
  const [skills, setSkills] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)

  const fetchData = () => {
    setLoading(true)
    getSkills().then(res => {
      setSkills(res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleToggleSkill = async (name) => {
    await toggleSkill(name)
    message.success('已更新')
    fetchData()
  }

  const handleToggleSubSkill = async (skillName, subName) => {
    await toggleSubSkill(skillName, subName)
    fetchData()
  }

  const statusColor = { installed: 'green', available: 'blue' }
  const statusText = { installed: '已安装', available: '可安装' }

  return (
    <div className="page-container">
      <div className="page-title">技能管理</div>

      <Row gutter={16}>
        {/* Skills list */}
        <Col span={8}>
          <div className="content-card">
            <div className="card-title">已安装技能</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {skills.map(s => (
                <div
                  key={s.name}
                  onClick={() => setSelected(s)}
                  style={{
                    padding: 16,
                    background: selected?.name === s.name ? '#FFF7E6' : '#FAFAFA',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: selected?.name === s.name ? '1px solid #FFE4B5' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.display_name}</span>
                    <Switch
                      checked={s.enabled}
                      onChange={() => handleToggleSkill(s.name)}
                      size="small"
                      style={{ background: s.enabled ? '#E87A30' : undefined }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{s.description}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Tag color={statusColor[s.status]}>{statusText[s.status]}</Tag>
                    <Tag>{s.sub_skills?.length || 0} 子技能</Tag>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Skill detail */}
        <Col span={16}>
          {selected ? (
            <>
              <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="card-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                    {selected.display_name} - 子技能管理
                  </div>
                  <Button icon={<SettingOutlined />} onClick={() => setConfigOpen(true)}>配置</Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.sub_skills?.map(sub => (
                    <div key={sub.name} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#FAFAFA',
                      borderRadius: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{sub.display_name}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{sub.description}</div>
                      </div>
                      <Switch
                        checked={sub.enabled}
                        onChange={() => handleToggleSubSkill(selected.name, sub.name)}
                        size="small"
                        style={{ background: sub.enabled ? '#E87A30' : undefined }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Config */}
              <div className="content-card">
                <div className="card-title">配置信息</div>
                <Descriptions column={2} size="small" bordered>
                  {selected.config && Object.entries(selected.config).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </div>

              {/* Usage history */}
              <div className="content-card">
                <div className="card-title">
                  <HistoryOutlined style={{ marginRight: 8 }} />使用记录
                </div>
                {selected.usage?.length ? (
                  <Table
                    dataSource={selected.usage}
                    rowKey={(r, i) => i}
                    pagination={false}
                    size="small"
                    columns={[
                      { title: '日期', dataIndex: 'date' },
                      { title: '子技能', dataIndex: 'sub_skill' },
                      { title: 'Token数', dataIndex: 'tokens', render: v => v?.toLocaleString() },
                      { title: '费用', dataIndex: 'cost', render: v => `$${v?.toFixed(3)}` },
                    ]}
                    summary={() => {
                      const totalTokens = selected.usage.reduce((s, r) => s + r.tokens, 0)
                      const totalCost = selected.usage.reduce((s, r) => s + r.cost, 0)
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={1} />
                          <Table.Summary.Cell index={2}><strong>{totalTokens.toLocaleString()}</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={3}><strong>${totalCost.toFixed(3)}</strong></Table.Summary.Cell>
                        </Table.Summary.Row>
                      )
                    }}
                  />
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无使用记录</div>
                )}
              </div>
            </>
          ) : (
            <div className="content-card">
              <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>&lt;/&gt;</div>
                <div style={{ fontSize: 14 }}>请从左侧选择一个技能查看详情</div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Config modal */}
      <Modal
        title="技能配置"
        open={configOpen}
        onCancel={() => setConfigOpen(false)}
        onOk={() => { message.success('配置已保存'); setConfigOpen(false) }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ style: { background: '#E87A30', borderColor: '#E87A30' } }}
      >
        {selected?.config && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            {Object.entries(selected.config).map(([key, value]) => (
              <div key={key}>
                <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>{key}</div>
                <Input defaultValue={typeof value === 'object' ? JSON.stringify(value) : String(value)} />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}