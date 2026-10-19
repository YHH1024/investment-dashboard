import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu } from 'antd'
import {
  PieChartOutlined,
  LineChartOutlined,
  StockOutlined,
  FilterOutlined,
  EyeOutlined,
  ReadOutlined,
  ToolOutlined,
  CalculatorOutlined,
  BellOutlined,
  SwapOutlined, SettingOutlined,
} from '@ant-design/icons'

const { Sider, Content } = AntLayout

const menuItems = [
  { key: '/portfolio', icon: <PieChartOutlined />, label: '持仓总览' },
  { key: '/fund/000311', icon: <LineChartOutlined />, label: '基金分析' },
  { key: '/stock/600036', icon: <StockOutlined />, label: '股票分析' },
  { key: '/screener', icon: <FilterOutlined />, label: '基金筛选' },
  { key: '/watchlist', icon: <EyeOutlined />, label: '观察池' },
  { key: '/news', icon: <ReadOutlined />, label: '新闻监控' },
  { key: '/skills', icon: <ToolOutlined />, label: '技能管理' },
  { key: '/dca', icon: <CalculatorOutlined />, label: '定投计算器' },
  { key: '/alerts', icon: <BellOutlined />, label: '提醒中心' },
  { key: '/transactions', icon: <SwapOutlined />, label: '交易记录' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKey = menuItems.find(item => location.pathname.startsWith(item.key))?.key || '/portfolio'

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#1A1A1A',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #333',
        }}>
          <div style={{
            color: '#E87A30',
            fontSize: collapsed ? 18 : 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            {collapsed ? 'ID' : '投资看板'}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: '#1A1A1A',
            borderRight: 'none',
            marginTop: 8,
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Content style={{ minHeight: '100vh', background: '#FFFAF5' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
