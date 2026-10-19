import { useState, useEffect } from 'react'
import { Button, Input, Select, message, Switch, Divider } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    ai_api_key: '',
    ai_base_url: 'https://api.deepseek.com/v1',
    ai_model: 'deepseek-chat',
    ai_enabled: false,
    data_refresh_interval: 300,
    stock_source: 'auto',
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings/')
      if (res?.data) setSettings(prev => ({ ...prev, ...res.data }))
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/settings/', settings)
      message.success('配置已保存，重启后端后生效')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTestAI = async () => {
    setTesting(true)
    try {
      const res = await api.post('/settings/test-ai')
      if (res?.data?.success) {
        message.success('AI连接成功！')
      } else {
        message.error('AI连接失败：' + (res?.data?.error || '未知错误'))
      }
    } catch {
      message.error('测试失败，请检查配置')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>系统设置</h1>

      {/* AI Configuration */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI 分析配置</div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          配置AI接口后，基金/股票分析页面的AI结论、护城河评分、30天预测将由AI实时生成，而非使用Mock数据。
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 14 }}>启用AI分析</div>
          <Switch
            checked={settings.ai_enabled}
            onChange={v => setSettings(s => ({ ...s, ai_enabled: v }))}
            style={{ background: settings.ai_enabled ? '#E87A30' : undefined }}
          />
        </div>

        {settings.ai_enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>AI 服务商</div>
              <Select
                value={settings.ai_base_url}
                onChange={v => {
                  const models = {
                    'https://api.deepseek.com/v1': 'deepseek-chat',
                    'https://api.siliconflow.cn/v1': 'deepseek-ai/DeepSeek-V3',
                    'https://dashscope.aliyuncs.com/compatible-mode/v1': 'qwen-max',
                    'https://api.openai.com/v1': 'gpt-4o',
                    'custom': '',
                  }
                  setSettings(s => ({
                    ...s,
                    ai_base_url: v,
                    ai_model: models[v] || s.ai_model,
                  }))
                }}
                style={{ width: '100%' }}
                options={[
                  { value: 'https://api.deepseek.com/v1', label: 'DeepSeek V3（推荐，便宜）' },
                  { value: 'https://api.siliconflow.cn/v1', label: '硅基流动' },
                  { value: 'https://dashscope.aliyuncs.com/compatible-mode/v1', label: '通义千问' },
                  { value: 'https://api.openai.com/v1', label: 'OpenAI' },
                  { value: 'custom', label: '自定义' },
                ]}
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>API Base URL</div>
              <Input
                value={settings.ai_base_url}
                onChange={e => setSettings(s => ({ ...s, ai_base_url: e.target.value }))}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>模型名称</div>
              <Input
                value={settings.ai_model}
                onChange={e => setSettings(s => ({ ...s, ai_model: e.target.value }))}
                placeholder="deepseek-chat"
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>API Key</div>
              <Input.Password
                value={settings.ai_api_key}
                onChange={e => setSettings(s => ({ ...s, ai_api_key: e.target.value }))}
                placeholder="sk-..."
              />
            </div>

            <Button
              onClick={handleTestAI}
              loading={testing}
              style={{ alignSelf: 'flex-start' }}
            >
              测试连接
            </Button>
          </div>
        )}
      </div>

      {/* Data Source Configuration */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>数据源配置</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>股票数据源</div>
            <Select
              value={settings.stock_source}
              onChange={v => setSettings(s => ({ ...s, stock_source: v }))}
              style={{ width: '100%' }}
              options={[
                { value: 'auto', label: '自动（东方财富→新浪→Mock）' },
                { value: 'eastmoney', label: '东方财富' },
                { value: 'sina', label: '新浪财经' },
              ]}
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>数据缓存时间（秒）</div>
            <Input
              type="number"
              value={settings.data_refresh_interval}
              onChange={e => setSettings(s => ({ ...s, data_refresh_interval: parseInt(e.target.value) || 300 }))}
              placeholder="300"
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              缓存时间越短数据越新，但API被限流风险越高。建议300秒（5分钟）。
            </div>
          </div>
        </div>
      </div>

      {/* API Status */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>接口状态</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: '东方财富（股票）', url: 'push2.eastmoney.com' },
            { name: '新浪财经（股票备选）', url: 'hq.sinajs.cn' },
            { name: '东方财富（基金）', url: 'fund.eastmoney.com' },
            { name: '东方财富（K线）', url: 'push2his.eastmoney.com' },
            { name: 'AI分析接口', url: settings.ai_base_url },
          ].map(item => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 13 }}>{item.name}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{item.url}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          style={{ background: '#E87A30', borderColor: '#E87A30' }}
        >
          保存配置
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadSettings}
        >
          重置
        </Button>
      </div>
    </div>
  )
}
