import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PortfolioOverview from './pages/PortfolioOverview'
import FundAnalysis from './pages/FundAnalysis'
import StockAnalysis from './pages/StockAnalysis'
import FundScreener from './pages/FundScreener'
import WatchList from './pages/WatchList'
import NewsMonitor from './pages/NewsMonitor'
import SkillManager from './pages/SkillManager'
import DcaCalculator from './pages/DcaCalculator'
import AlertCenter from './pages/AlertCenter'
import SettingsPage from './pages/SettingsPage'
import TransactionPage from './pages/TransactionPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/portfolio" replace />} />
        <Route path="portfolio" element={<PortfolioOverview />} />
        <Route path="fund/:code" element={<FundAnalysis />} />
        <Route path="stock/:code" element={<StockAnalysis />} />
        <Route path="screener" element={<FundScreener />} />
        <Route path="watchlist" element={<WatchList />} />
        <Route path="news" element={<NewsMonitor />} />
        <Route path="skills" element={<SkillManager />} />
        <Route path="dca" element={<DcaCalculator />} />
        <Route path="alerts" element={<AlertCenter />} />
        <Route path="settings" element={<SettingsPage />} />
              <Route path="transactions" element={<TransactionPage />} />
      </Route>
    </Routes>
  )
}

export default App