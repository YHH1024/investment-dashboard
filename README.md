# 投资看板 - Personal Investment Dashboard

一个基于 React + FastAPI 的个人投资管理面板，集成实时数据、AI分析、走线图预测等功能。

## 功能特性

### 📊 核心页面

| 页面 | 功能 |
|------|------|
| 持仓总览 | 基金+股票一览、添加/编辑/删除、定投设置 |
| 基金分析 | 走势图+拖拽缩放+时间选择器+AI分析+当前日期标注 |
| 股票分析 | 价格走势+估值+护城河+解套方案 |
| 基金筛选 | Top100实时排名（每天更新） |
| 观察池 | 跟进标的+预测验证 |
| 新闻监控 | 实时新闻+影响分析+准确率 |
| 技能管理 | 已安装/探索/编辑/配置 |
| 定投计算器 | 回测+模拟 |
| 提醒中心 | 增删改提醒+历史 |
| 交易记录 | 买入/卖出/分红+风险指标+解套策略 |
| 系统设置 | AI配置+数据源 |

### 🎯 核心能力

- **实时数据**：AKShare + 东方财富 API
- **AI分析**：硅基流动 DeepSeek V4（可配置其他AI）
- **走线图**：拖拽缩放+时间选择器+贝塞尔曲线+预测区间
- **数据持久化**：SQLite 数据库
- **每日提醒**：飞书日历集成
- **基金筛选**：Top100 实时排名（每天更新）
- **交易记录**：风险指标+解套策略
- **数据缓存**：3层缓存（内存+SQLite+API）

## 技术栈

### 前端
- React 18
- Ant Design 5
- Vite
- Axios

### 后端
- Python 3.9+
- FastAPI
- SQLite
- AKShare
- 东方财富 API

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/investment-dashboard.git
cd investment-dashboard
```

### 2. 启动后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

后端将在 http://localhost:8000 启动

### 3. 启动前端

```bash
cd frontend
npm install
npx vite --host 0.0.0.0 --port 5174
```

前端将在 http://localhost:5174 启动

### 4. 配置 AI（可选）

访问 http://localhost:5174/settings 配置 AI API：

| AI服务商 | Base URL | 模型 |
|---------|----------|------|
| 硅基流动 | https://api.siliconflow.cn/v1 | deepseek-ai/DeepSeek-V4-Pro |
| DeepSeek | https://api.deepseek.com/v1 | deepseek-chat |
| 通义千问 | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-max |

## 项目结构

```
investment-dashboard/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── db_storage.py        # SQLite 数据库
│   ├── routers/             # API 路由
│   │   ├── funds.py         # 基金 API
│   │   ├── stocks.py        # 股票 API
│   │   ├── holdings.py      # 持仓 API
│   │   ├── news.py          # 新闻 API
│   │   ├── transactions.py  # 交易记录 API
│   │   └── ...
│   ├── services/
│   │   ├── akshare_fetcher.py  # AKShare 数据获取
│   │   ├── data_fetcher.py     # Mock 数据
│   │   ├── skill_engine.py     # AI 分析引擎
│   │   └── ai_analyzer.py      # AI 接口
│   └── data/
│       ├── dashboard.db     # 主数据库
│       └── cache.db         # 缓存数据库
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── api/             # API 封装
│   │   └── App.jsx          # 路由配置
│   └── vite.config.js
└── README.md
```

## 数据源

| 数据类型 | 数据源 | 缓存时间 |
|---------|--------|---------|
| 股票实时价格 | 东方财富 / 新浪财经 | 5分钟 |
| 基金净值 | AKShare | 10分钟 |
| 历史数据 | AKShare | 10分钟 |
| 基金排名 | AKShare | 24小时 |
| 新闻 | 东方财富 | 30分钟 |

## 环境变量（可选）

```bash
# AI 配置（也可在设置页面配置）
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=deepseek-ai/DeepSeek-V4-Pro

# 代理配置（如果需要）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

## 许可证

MIT License

## 作者

郜永航 (HaHa102)