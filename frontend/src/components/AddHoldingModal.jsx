import { useState, useEffect } from 'react'
import { Modal, Input, Select, InputNumber, Button, message, Spin } from 'antd'
import { addHolding } from '../api'
import api from '../api'

export default function AddHoldingModal({ open, onClose, onAdded }) {
  const [type, setType] = useState('fund')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [fundInfo, setFundInfo] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fund fields
  const [holdingAmount, setHoldingAmount] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [dcaAmount, setDcaAmount] = useState(0)
  const [dcaFrequency, setDcaFrequency] = useState('daily')

  // Stock fields
  const [shares, setShares] = useState(0)
  const [costPrice, setCostPrice] = useState(0)

  // Auto-search fund info
  useEffect(() => {
    if (type !== 'fund' || !code || code.length < 4) {
      setFundInfo(null)
      setName('')
      return
    }
    const timer = setTimeout(() => searchFund(code), 500)
    return () => clearTimeout(timer)
  }, [code, type])

  const searchFund = async (fundCode) => {
    setSearching(true)
    try {
      const res = await api.get(`/funds/${fundCode}`)
      if (res?.data && !res.data.error) {
        setFundInfo(res.data)
        setName(res.data.name)
      } else {
        setFundInfo(null)
        setName('')
      }
    } catch {
      setFundInfo(null)
      setName('')
    } finally {
      setSearching(false)
    }
  }

  const holdingDays = startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
    : 0

  const handleOk = async () => {
    if (type === 'fund') {
      if (!code || !name || !holdingAmount || !startDate) {
        message.warning('请填写完整信息')
        return
      }
    } else {
      if (!code || !name || !shares || !costPrice) {
        message.warning('请填写完整信息')
        return
      }
    }
    setLoading(true)
    try {
      const data = type === 'fund' ? {
        code, name, type,
        holding_amount: holdingAmount,
        start_date: startDate,
        holding_days: holdingDays,
        dca_amount: dcaAmount,
        dca_frequency: dcaFrequency,
        current_price: fundInfo?.nav || 0,
      } : {
        code, name, type,
        shares, cost_price: costPrice, current_price: costPrice,
      }
      await addHolding(data)
      message.success('添加成功')
      onAdded?.()
      onClose()
      resetForm()
    } catch {
      message.error('添加失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCode(''); setName(''); setFundInfo(null)
    setHoldingAmount(0); setStartDate('')
    setDcaAmount(0); setDcaFrequency('daily')
    setShares(0); setCostPrice(0)
  }

  const freqLabel = { daily: '每日', weekly: '每周', biweekly: '双周', monthly: '每月' }

  return (
    <Modal
      title={type === 'fund' ? '添加基金持仓' : '添加股票持仓'}
      open={open}
      onOk={handleOk}
      onCancel={() => { onClose(); resetForm() }}
      confirmLoading={loading}
      okText="添加"
      cancelText="取消"
      okButtonProps={{ style: { background: '#E87A30', borderColor: '#E87A30' } }}
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        {/* Type */}
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>类型</div>
          <Select value={type} onChange={v => { setType(v); resetForm() }} style={{ width: '100%' }}
            options={[{ value: 'fund', label: '基金' }, { value: 'stock', label: '股票' }]} />
        </div>

        {/* Code + auto-search */}
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
            {type === 'fund' ? '基金代码' : '股票代码'}
          </div>
          <Input value={code} onChange={e => setCode(e.target.value)}
            placeholder={type === 'fund' ? '如: 000311' : '如: 600036'}
            suffix={searching ? <Spin size="small" /> : null} />
          {name && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, fontSize: 13 }}>
              {name}
              {fundInfo && <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                {fundInfo.type} | {fundInfo.company} | 净值 {fundInfo.nav?.toFixed(4)}
              </span>}
            </div>
          )}
        </div>

        {type === 'fund' ? (
          <>
            {/* Holding Amount */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>持仓金额（元）</div>
              <InputNumber value={holdingAmount} onChange={setHoldingAmount} style={{ width: '100%' }}
                min={0} step={1000} placeholder="如: 10000"
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v.replace(/\$\s?|(,*)/g, '')} />
            </div>

            {/* Start Date */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>持仓时间</div>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              {startDate && holdingDays >= 0 && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#E87A30' }}>
                  已持有 {holdingDays} 天
                </div>
              )}
            </div>

            {/* DCA */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1A1A1A' }}>定投设置</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>定投周期</div>
                  <Select value={dcaFrequency} onChange={setDcaFrequency} style={{ width: '100%' }}
                    options={[
                      { value: 'daily', label: '每日' },
                      { value: 'weekly', label: '每周' },
                      { value: 'biweekly', label: '每两周' },
                      { value: 'monthly', label: '每月' },
                    ]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>定投金额（元）</div>
                  <InputNumber value={dcaAmount} onChange={setDcaAmount} style={{ width: '100%' }}
                    min={0} step={100} placeholder="如: 25" />
                </div>
              </div>
              {dcaAmount > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#E87A30', fontWeight: 500, padding: '6px 12px', background: '#FFF7E6', borderRadius: 6 }}>
                  {freqLabel[dcaFrequency]}定投 ¥{dcaAmount.toLocaleString()}
                  {dcaFrequency === 'daily' && ` (月约 ¥${(dcaAmount * 22).toLocaleString()})`}
                  {dcaFrequency === 'weekly' && ` (月约 ¥${(dcaAmount * 4).toLocaleString()})`}
                  {dcaFrequency === 'biweekly' && ` (月约 ¥${(dcaAmount * 2).toLocaleString()})`}
                  {dcaFrequency === 'monthly' && ''}
                </div>
              )}
            </div>

            {/* Summary */}
            {holdingAmount > 0 && (
              <div style={{ fontSize: 12, color: '#666', background: '#f9f9f9', padding: '8px 12px', borderRadius: 6 }}>
                持仓 ¥{holdingAmount.toLocaleString()}
                {fundInfo?.nav > 0 && <span> / 约 {(holdingAmount / fundInfo.nav).toFixed(2)} 份</span>}
                {startDate && <span> / 已持 {holdingDays} 天</span>}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>股数</div>
              <InputNumber value={shares} onChange={setShares} style={{ width: '100%' }} min={0} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>成本价</div>
              <InputNumber value={costPrice} onChange={setCostPrice} style={{ width: '100%' }} min={0} step={0.01} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
