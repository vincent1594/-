import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Cpu, 
  Sliders, 
  Zap, 
  AlertTriangle, 
  Flame, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Play,
  Database,
  Layers,
  Shield,
  ToggleLeft,
  ToggleRight,
  Info,
  Trash2,
  RefreshCw,
  PlusCircle,
  Power
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Constants
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // System General States
  const [timeIndex, setTimeIndex] = useState(10); // Starts at 10:00 AM
  const [systemFrequency, setSystemFrequency] = useState(60.02); // Hz
  const [systemLoad, setSystemLoad] = useState(380); // MW
  const [currentLmp, setCurrentLmp] = useState(85.50); // 元/MWh
  const [reserveMargin, setReserveMargin] = useState(15.2); // %
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'info', msg: '系統調度正常，風力發電充沛。', time: '09:45' },
    { id: 2, type: 'warning', msg: '備轉容量稍有下降，請密切關注尖峰用電。', time: '09:50' }
  ]);

  // Tab 1: Electricity Trading (電力買賣與出清)
  const [bids, setBids] = useState([
    { id: 'b1', party: '台工電子廠', qty: 65, price: 95 },
    { id: 'b2', party: '北部售電公司', qty: 50, price: 85 },
    { id: 'b3', party: '綠色零售商', qty: 40, price: 78 },
    { id: 'b4', party: '晶圓精密工業', qty: 80, price: 110 },
    { id: 'b5', party: '中部聯合商業大樓', qty: 30, price: 70 }
  ]);
  const [asks, setAsks] = useState([
    { id: 's1', party: '麥寮電廠一號機', qty: 70, price: 50 },
    { id: 's2', party: '海能風力發電', qty: 50, price: 25 },
    { id: 's3', party: '通霄複循環燃氣', qty: 80, price: 80 },
    { id: 's4', party: '南部光電園區', qty: 45, price: 15 },
    { id: 's5', party: '大潭尖峰氣渦輪', qty: 60, price: 115 }
  ]);
  const [tradeType, setTradeType] = useState('buy'); // buy or sell
  const [tradeQty, setTradeQty] = useState(30);
  const [tradePrice, setTradePrice] = useState(85);
  const [tradeParty, setTradeParty] = useState('自定義用戶');
  
  // Market Clearing results
  const [isClearing, setIsClearing] = useState(false);
  const [clearingStepText, setClearingStepText] = useState('');
  const [clearingPrice, setClearingPrice] = useState(80);
  const [clearingQuantity, setClearingQuantity] = useState(155);
  const [matchedBids, setMatchedBids] = useState(['b1', 'b2', 'b4']);
  const [matchedAsks, setMatchedAsks] = useState(['s1', 's2', 's3', 's4']);

  // Tab 2: Pricing (即時電價歷史)
  const [priceHistory, setPriceHistory] = useState([
    62, 58, 55, 54, 60, 75, 92, 110, 105, 90, 85, 88, 95, 118, 125, 130, 115, 98, 88, 80, 75, 70, 68, 65
  ]);

  // Tab 3: AI Load Forecasting (AI 負載預測)
  const [temperature, setTemperature] = useState(28); // °C
  const [humidity, setHumidity] = useState(65); // %
  const [isHoliday, setIsHoliday] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Baseline load curve generator based on inputs
  const getForecastCurve = (temp, hum, holiday) => {
    const tempFactor = Math.max(0, temp - 25) * 12; // cooling demand increase
    const humFactor = Math.max(0, hum - 60) * 1.5;
    const dayMultiplier = holiday ? 0.85 : 1.0;
    
    // Normal 24h load profile
    const baseCurve = [
      210, 195, 185, 180, 190, 210, 260, 310, 340, 360, 370, 380, 365, 375, 390, 410, 420, 400, 360, 320, 290, 260, 240, 220
    ];
    
    const actual = baseCurve.map(v => Math.round((v + tempFactor + humFactor) * dayMultiplier));
    const predicted = actual.map((v, i) => Math.round(v * (1 + (Math.sin(i) * 0.02) + (i % 2 === 0 ? 0.01 : -0.01))));
    
    return { actual, predicted };
  };

  const [forecastCurve, setForecastCurve] = useState(getForecastCurve(28, 65, false));

  // Tab 4: AI Optimal Dispatch (AI 最佳化調度)
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizingStepText, setOptimizingStepText] = useState('');
  const [generators, setGenerators] = useState([
    { id: 'g1', name: '麥寮燃煤 G1', type: 'coal', cap: 100, out: 100, cost: 50, co2: 0.85, status: 'active' },
    { id: 'g2', name: '通霄燃氣 G2', type: 'gas', cap: 120, out: 95, cost: 80, co2: 0.42, status: 'active' },
    { id: 'g3', name: '大潭燃氣 G3', type: 'gas', cap: 80, out: 20, cost: 110, co2: 0.45, status: 'active' },
    { id: 'g4', name: '海能離岸風力 G4', type: 'wind', cap: 90, out: 65, cost: 15, co2: 0.0, status: 'active' },
    { id: 'g5', name: '南部太陽能 G5', type: 'solar', cap: 60, out: 40, cost: 10, co2: 0.0, status: 'active' },
    { id: 'g6', name: '路園儲能電池 G6', type: 'battery', cap: 50, out: 10, cost: 95, co2: 0.02, status: 'standby' }
  ]);
  const [dispatchStats, setDispatchStats] = useState({
    costBefore: 28540,
    costAfter: 24120,
    co2Before: 138.4,
    co2After: 112.1
  });

  // Tab 5: Demand Response (需量反應)
  const [drEventActive, setDrEventActive] = useState(false);
  const [drRate, setDrRate] = useState(10); // 元/kWh
  const [drCustomers, setDrCustomers] = useState([
    { id: 'c1', name: '日月光半導體', base: 45, current: 45, maxReduce: 15, responsive: false, forceExclude: false },
    { id: 'c2', name: '東和鋼鐵廠', base: 35, current: 35, maxReduce: 20, responsive: false, forceExclude: false },
    { id: 'c3', name: '亞馬遜數據中心', base: 25, current: 25, maxReduce: 5, responsive: false, forceExclude: false },
    { id: 'c4', name: '遠東新世紀紡織', base: 18, current: 18, maxReduce: 6, responsive: false, forceExclude: false }
  ]);
  const [drTotalReduced, setDrTotalReduced] = useState(0); // MW

  // Tab 6: Power Flow (潮流分析)
  const [activeBus, setActiveBus] = useState(2);
  const [breakerStates, setBreakerStates] = useState({
    'L1_2': true,
    'L1_3': true,
    'L2_4': true,
    'L3_4': true,
    'L4_5': true,
    'L2_5': true
  });
  
  // Power Flow computation results (IEEE 5-Bus simulated DC power flow)
  const [busData, setBusData] = useState({
    1: { id: 1, type: '發電 / 節點 1', name: '主發電樞紐', gen: 165, load: 0, volt: 1.02 },
    2: { id: 2, type: '負載 / 節點 2', name: '工業園區', gen: 0, load: 120, volt: 0.99 },
    3: { id: 3, type: '發電 / 節點 3', name: '綠能儲能網', gen: 115, load: 0, volt: 1.01 },
    4: { id: 4, type: '負載 / 節點 4', name: '民生住宅區', gen: 0, load: 90, volt: 0.98 },
    5: { id: 5, type: '負載 / 節點 5', name: '商業摩天大樓', gen: 0, load: 70, volt: 0.97 }
  });

  const [lineData, setLineData] = useState({
    'L1_2': { from: 1, to: 2, flow: 85, cap: 100, status: 'normal' },
    'L1_3': { from: 1, to: 3, flow: 80, cap: 120, status: 'normal' },
    'L2_4': { from: 2, to: 4, flow: 35, cap: 80, status: 'normal' },
    'L3_4': { from: 3, to: 4, flow: 55, cap: 80, status: 'normal' },
    'L4_5': { from: 4, to: 5, flow: 45, cap: 50, status: 'normal' },
    'L2_5': { from: 2, to: 5, flow: 25, cap: 50, status: 'normal' }
  });

  // Periodical state updates simulating a live power market
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate real-time price fluctuation
      setCurrentLmp(prev => {
        const noise = (Math.random() - 0.5) * 4;
        const newLmp = Math.max(45, Math.min(220, prev + noise));
        return parseFloat(newLmp.toFixed(2));
      });
      
      // Simulate slight frequency fluctuation
      setSystemFrequency(prev => {
        const noise = (Math.random() - 0.5) * 0.04;
        const newFreq = 60.0 + parseFloat(noise.toFixed(3));
        return parseFloat(newFreq.toFixed(2));
      });

      // Update current hour load from forecasting curve
      setSystemLoad(forecastCurve.actual[timeIndex]);
      
      // Reserve margin dynamics
      setReserveMargin(prev => {
        const calculated = ((460 - forecastCurve.actual[timeIndex]) / forecastCurve.actual[timeIndex]) * 100;
        return parseFloat(calculated.toFixed(1));
      });

    }, 4000);

    return () => clearInterval(timer);
  }, [timeIndex, forecastCurve]);

  // Hourly index increment to simulate 24-hour cycle
  const incrementTime = () => {
    setTimeIndex(prev => (prev + 1) % 24);
  };
  const decrementTime = () => {
    setTimeIndex(prev => (prev - 1 + 24) % 24);
  };

  // 0. Dashboard - Clear Alerts
  const handleClearAlerts = () => {
    setAlerts([]);
  };

  // 0. Dashboard - Trigger Custom Test Alert
  const handleTriggerTestAlert = () => {
    const msgs = [
      '【緊急】區域變電所二次變壓器出現局部過熱，請派員查驗！',
      '【通報】海能離岸風電瞬時出力大增，電網頻率小幅攀升。',
      '【注意】北部用電樞紐饋線載流率逼近 85%，啟動預警機制。',
      '【通告】智慧AI調度引擎檢測到燃料成本變動，已自動調度最優基載方案。'
    ];
    const types = ['danger', 'success', 'warning', 'info'];
    const randIdx = Math.floor(Math.random() * msgs.length);
    
    addSystemAlert(types[randIdx], msgs[randIdx], HOURS[timeIndex]);
  };

  // 1. 電力交易 - 新增掛單
  const handleAddOrder = (e) => {
    e.preventDefault();
    if (tradeQty <= 0 || tradePrice <= 0) return;
    
    const newOrd = {
      id: Math.random().toString(36).substr(2, 9),
      party: tradeParty,
      qty: parseInt(tradeQty),
      price: parseInt(tradePrice)
    };

    if (tradeType === 'buy') {
      setBids(prev => [...prev, newOrd].sort((a, b) => b.price - a.price));
      addSystemAlert('info', `使用者提交買單: ${newOrd.qty} MW @ ${newOrd.price} 元/MWh`, HOURS[timeIndex]);
    } else {
      setAsks(prev => [...prev, newOrd].sort((a, b) => a.price - b.price));
      addSystemAlert('info', `使用者提交賣單: ${newOrd.qty} MW @ ${newOrd.price} 元/MWh`, HOURS[timeIndex]);
    }

    setTradeQty(30);
    setTradePrice(85);
  };

  // 1. 電力交易 - 刪除個別掛單
  const handleDeleteOrder = (id, type) => {
    if (type === 'bid') {
      setBids(prev => prev.filter(b => b.id !== id));
      setMatchedBids(prev => prev.filter(matchedId => matchedId !== id));
    } else {
      setAsks(prev => prev.filter(s => s.id !== id));
      setMatchedAsks(prev => prev.filter(matchedId => matchedId !== id));
    }
    addSystemAlert('info', `使用者手動撤銷了一筆市場掛單。`, HOURS[timeIndex]);
  };

  // 1. 電力交易 - 一鍵清空掛單
  const handleClearAllOrders = () => {
    setBids([]);
    setAsks([]);
    setMatchedBids([]);
    setMatchedAsks([]);
    setClearingPrice(0);
    setClearingQuantity(0);
    addSystemAlert('warning', `市場所有委託掛單已清空。`, HOURS[timeIndex]);
  };

  // 1. 電力交易 - 撮合出清演算法 (Double Auction Clearing with dynamic steps scrolling)
  const runMarketClearing = () => {
    setIsClearing(true);
    setClearingStepText('[市場] 正在啟動雙向拍賣出清引擎...');
    
    // Step-by-step scrolling log simulation
    setTimeout(() => setClearingStepText('[市場] 正在檢索買方申報委託簿 (Bids) 排序...'), 400);
    setTimeout(() => setClearingStepText('[市場] 正在檢索賣方申報委託簿 (Asks) 排序...'), 800);
    setTimeout(() => setClearingStepText('[市場] 正在建構社會福利最大化 (LMP) 供需交疊線段...'), 1200);
    setTimeout(() => setClearingStepText('[市場] 求解市場邊際出清價格與匹配容量點...'), 1600);

    setTimeout(() => {
      const sortedBids = [...bids].sort((a, b) => b.price - a.price);
      const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
      
      let matchedB = [];
      let matchedS = [];
      let totalQty = 0;
      let clearPrice = 0;
      
      let bidIdx = 0;
      let askIdx = 0;
      
      while (bidIdx < sortedBids.length && askIdx < sortedAsks.length) {
        const curBid = sortedBids[bidIdx];
        const curAsk = sortedAsks[askIdx];
        
        if (curBid.price >= curAsk.price) {
          const matchQty = Math.min(curBid.qty, curAsk.qty);
          totalQty += matchQty;
          clearPrice = Math.round((curBid.price + curAsk.price) / 2);
          
          matchedB.push(curBid.id);
          matchedS.push(curAsk.id);
          
          bidIdx++;
          askIdx++;
        } else {
          break;
        }
      }
      
      if (totalQty > 0) {
        setClearingPrice(clearPrice);
        setClearingQuantity(totalQty);
        setCurrentLmp(clearPrice);
        
        setPriceHistory(prev => {
          const updated = [...prev];
          updated[timeIndex] = clearPrice;
          return updated;
        });

        setMatchedBids(matchedB);
        setMatchedAsks(matchedS);
        addSystemAlert('success', `市場出清撮合成功！出清價: ${clearPrice} 元/MWh, 出清量: ${totalQty} MW`, HOURS[timeIndex]);
      } else {
        setClearingPrice(0);
        setClearingQuantity(0);
        setMatchedBids([]);
        setMatchedAsks([]);
        addSystemAlert('warning', `供需價格未交疊，出清未匹配成功。`, HOURS[timeIndex]);
      }
      
      setIsClearing(false);
    }, 2000);
  };

  // Generate real data points for the double auction supply-demand curves
  const getClearingChartData = () => {
    const sortedBids = [...bids].sort((a, b) => b.price - a.price);
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

    let demandPoints = [];
    let cumBidQty = 0;
    
    if (sortedBids.length > 0) {
      demandPoints.push({ x: 0, y: sortedBids[0].price });
    }
    sortedBids.forEach(b => {
      demandPoints.push({ x: cumBidQty, y: b.price });
      cumBidQty += b.qty;
      demandPoints.push({ x: cumBidQty, y: b.price });
    });

    let supplyPoints = [];
    let cumAskQty = 0;
    if (sortedAsks.length > 0) {
      supplyPoints.push({ x: 0, y: sortedAsks[0].price });
    }
    sortedAsks.forEach(s => {
      supplyPoints.push({ x: cumAskQty, y: s.price });
      cumAskQty += s.qty;
      supplyPoints.push({ x: cumAskQty, y: s.price });
    });

    return {
      datasets: [
        {
          label: '電力需求申報曲線 (Demand)',
          data: demandPoints,
          borderColor: '#ff4a5a',
          backgroundColor: 'rgba(255, 74, 90, 0.05)',
          borderWidth: 3,
          stepped: true,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: '電力供給申報曲線 (Supply)',
          data: supplyPoints,
          borderColor: '#05f2a1',
          backgroundColor: 'rgba(5, 242, 161, 0.05)',
          borderWidth: 3,
          stepped: true,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: '出清均衡交點',
          data: clearingQuantity > 0 ? [{ x: clearingQuantity, y: clearingPrice }] : [],
          borderColor: '#00f2fe',
          backgroundColor: '#00f2fe',
          pointRadius: 8,
          pointHoverRadius: 12,
          showLine: false,
          fill: false
        }
      ]
    };
  };

  // 3. AI 負載預測 - 重新預測
  const triggerAIPrediction = () => {
    setIsPredicting(true);
    setTimeout(() => {
      const res = getForecastCurve(temperature, humidity, isHoliday);
      setForecastCurve(res);
      setIsPredicting(false);
      addSystemAlert('success', `AI 負載預測模型重新訓練及推理完成（外部特徵: 氣溫 ${temperature}°C）`, HOURS[timeIndex]);
    }, 1500);
  };

  // 4. AI 最佳化調度 - MILP 模擬 (with dynamic scrolling steps)
  const triggerOptimalDispatch = () => {
    setIsOptimizing(true);
    setOptimizingStepText('[系統] 讀取電網拓撲節點即時負荷: ' + forecastCurve.actual[timeIndex] + ' MW...');
    
    // Multi-phase dynamic log rendering
    setTimeout(() => setOptimizingStepText('[AI] 載入機組運行上限與邊際發電成本矩陣...'), 350);
    setTimeout(() => setOptimizingStepText('[AI] 構建混合整數線性規劃 (MILP) 二次優化約束系統...'), 700);
    setTimeout(() => setOptimizingStepText('[AI] 優先調度風力/光能綠色機組，實現最優消納...'), 1050);
    setTimeout(() => setOptimizingStepText('[求解器] 啟動雙向快速分支定界迭代器 (Branch-and-Bound)...'), 1400);

    setTimeout(() => {
      const targetLoad = forecastCurve.actual[timeIndex];
      let loadRemaining = targetLoad;
      
      let newGens = generators.map(g => {
        if (g.status === 'offline') {
          return { ...g, out: 0 };
        }
        
        let output = 0;
        if (g.type === 'wind' || g.type === 'solar') {
          const multiplier = g.type === 'wind' ? 0.72 : 0.6;
          const availCap = Math.round(g.cap * multiplier);
          output = Math.min(loadRemaining, availCap);
          loadRemaining -= output;
          return { ...g, out: output };
        }
        return g;
      });

      newGens = newGens.map(g => {
        if (g.status === 'offline') return g;
        if (g.type === 'coal') {
          const output = Math.min(loadRemaining, g.cap);
          loadRemaining -= output;
          return { ...g, out: output, status: output > 0 ? 'active' : 'standby' };
        }
        return g;
      });

      newGens = newGens.map(g => {
        if (g.status === 'offline') return g;
        if (g.id === 'g2') {
          const output = Math.min(loadRemaining, g.cap);
          loadRemaining -= output;
          return { ...g, out: output, status: output > 0 ? 'active' : 'standby' };
        }
        return g;
      });

      newGens = newGens.map(g => {
        if (g.status === 'offline') return g;
        if (g.type === 'battery') {
          const output = Math.min(loadRemaining, g.cap);
          loadRemaining -= output;
          return { ...g, out: output, status: output > 0 ? 'active' : 'standby' };
        }
        return g;
      });

      newGens = newGens.map(g => {
        if (g.status === 'offline') return g;
        if (g.id === 'g3') {
          const output = Math.min(loadRemaining, g.cap);
          loadRemaining -= output;
          return { ...g, out: output, status: output > 0 ? 'active' : 'standby' };
        }
        return g;
      });

      setGenerators(newGens);

      setDispatchStats({
        costBefore: Math.round(targetLoad * 92),
        costAfter: Math.round(newGens.reduce((acc, curr) => acc + (curr.out * curr.cost), 0)),
        co2Before: parseFloat((targetLoad * 0.62).toFixed(1)),
        co2After: parseFloat(newGens.reduce((acc, curr) => acc + (curr.out * curr.co2), 0).toFixed(1))
      });

      setIsOptimizing(false);
      addSystemAlert('success', `AI 混合整數線性優化調度計算完成！優化度達 15.4%`, HOURS[timeIndex]);
    }, 1800);
  };

  // 4. AI 最佳化調度 - 手動啟停機組
  const toggleGeneratorStatus = (id) => {
    setGenerators(prev => prev.map(g => {
      if (g.id === id) {
        const nextStatus = g.status === 'active' ? 'offline' : 'active';
        const output = nextStatus === 'offline' ? 0 : Math.round(g.cap * 0.5);
        addSystemAlert('info', `手動變更 [${g.name}] 狀態為: ${nextStatus === 'active' ? '運轉併網' : '解聯停機'}`, HOURS[timeIndex]);
        return { ...g, status: nextStatus, out: output };
      }
      return g;
    }));
  };

  // 4. AI 最佳化調度 - 手動調整機組出力
  const handleGeneratorOutputChange = (id, newOut) => {
    setGenerators(prev => prev.map(g => {
      if (g.id === id) {
        const outVal = Math.min(g.cap, Math.max(0, newOut));
        const statusVal = outVal > 0 ? 'active' : 'standby';
        return { ...g, out: outVal, status: g.status === 'offline' ? 'offline' : statusVal };
      }
      return g;
    }));
  };

  // 4. AI 最佳化調度 - 歷史成本優化對比柱狀圖
  const renderCostSavingChart = () => {
    const data = {
      labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
      datasets: [
        {
          label: '常規調度成本 (元)',
          data: [22000, 24000, 28540, 29000, 27000, 31000, 33000],
          backgroundColor: 'rgba(255, 74, 90, 0.45)',
          borderColor: '#ff4a5a',
          borderWidth: 1.5
        },
        {
          label: 'AI 優化調度成本 (元)',
          data: [18500, 20100, dispatchStats.costAfter, 24800, 22800, 26100, 27500],
          backgroundColor: 'rgba(5, 242, 161, 0.45)',
          borderColor: '#05f2a1',
          borderWidth: 1.5
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f3f4f6', font: { family: 'Outfit', size: 11 } } },
        tooltip: {
          backgroundColor: 'rgba(7, 10, 19, 0.95)',
          borderColor: 'rgba(5, 242, 161, 0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8b9bb4' }
        },
        x: { 
          grid: { display: false },
          ticks: { color: '#8b9bb4' }
        }
      }
    };

    return <Bar data={data} options={options} />;
  };

  // 5. 需量反應 - 發布抑低事件與補償滑桿
  const triggerDREvent = () => {
    setDrEventActive(prev => {
      const newState = !prev;
      if (newState) {
        addSystemAlert('warning', `【警報】電網尖峰負載告急！發布「需量反應-抑低用電」事件`, HOURS[timeIndex]);
      } else {
        setDrCustomers(prevCust => prevCust.map(c => ({ ...c, current: c.base, responsive: false })));
        setDrTotalReduced(0);
        addSystemAlert('success', `需量反應事件結束，電網狀態恢復正常。`, HOURS[timeIndex]);
      }
      return newState;
    });
  };

  // 5. 需量反應 - 個別用戶強制排除/參與
  const toggleCustomerExclude = (id) => {
    setDrCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextExclude = !c.forceExclude;
        addSystemAlert('info', `${nextExclude ? '強制限制排除' : '恢復參與允許'}: [${c.name}] 需量反應調度權限`, HOURS[timeIndex]);
        return { ...c, forceExclude: nextExclude, responsive: nextExclude ? false : c.responsive, current: nextExclude ? c.base : c.current };
      }
      return c;
    }));
  };

  useEffect(() => {
    if (drEventActive) {
      let totalReduced = 0;
      const updatedCust = drCustomers.map(cust => {
        if (cust.forceExclude) {
          return cust;
        }

        let threshold = 5;
        if (cust.id === 'c1') threshold = 8;
        if (cust.id === 'c2') threshold = 6;
        if (cust.id === 'c3') threshold = 11;
        if (cust.id === 'c4') threshold = 4;

        const isResponsive = drRate >= threshold;
        let reduced = 0;
        if (isResponsive) {
          const multiplier = Math.min(1.0, (drRate - threshold) / (12 - threshold) + 0.3);
          reduced = Math.round(cust.maxReduce * multiplier);
          totalReduced += reduced;
        }

        return {
          ...cust,
          current: cust.base - reduced,
          responsive: isResponsive
        };
      });

      setDrCustomers(updatedCust);
      setDrTotalReduced(totalReduced);
      setSystemLoad(forecastCurve.actual[timeIndex] - totalReduced);
    }
  }, [drRate, drEventActive, timeIndex, drCustomers.map(c => c.forceExclude).join(',')]);

  // 6. 潮流分析 - 計算 DC 潮流
  const toggleBreaker = (lineId) => {
    setBreakerStates(prev => {
      const newState = { ...prev, [lineId]: !prev[lineId] };
      recalculatePowerFlow(newState, busData);
      return newState;
    });
  };

  const handleBusDemandChange = (busId, newLoad) => {
    setBusData(prev => {
      const updatedBuses = {
        ...prev,
        [busId]: { ...prev[busId], load: parseInt(newLoad) }
      };
      recalculatePowerFlow(breakerStates, updatedBuses);
      return updatedBuses;
    });
  };

  // 6. 潮流分析 - 手動調整發電機出力 (SCADA模擬)
  const handleBusGenChange = (busId, newGen) => {
    setBusData(prev => {
      const updatedBuses = {
        ...prev,
        [busId]: { ...prev[busId], gen: parseInt(newGen) }
      };
      recalculatePowerFlow(breakerStates, updatedBuses);
      return updatedBuses;
    });
  };

  // 6. 潮流分析 - 一鍵重置電網狀態
  const handleResetGridFlow = () => {
    const defaultBreakers = {
      'L1_2': true,
      'L1_3': true,
      'L2_4': true,
      'L3_4': true,
      'L4_5': true,
      'L2_5': true
    };
    const defaultBuses = {
      1: { id: 1, type: '發電 / 節點 1', name: '主發電樞紐', gen: 165, load: 0, volt: 1.02 },
      2: { id: 2, type: '負載 / 節點 2', name: '工業園區', gen: 0, load: 120, volt: 0.99 },
      3: { id: 3, type: '發電 / 節點 3', name: '綠能儲能網', gen: 115, load: 0, volt: 1.01 },
      4: { id: 4, type: '負載 / 節點 4', name: '民生住宅區', gen: 0, load: 90, volt: 0.98 },
      5: { id: 5, type: '負載 / 節點 5', name: '商業摩天大樓', gen: 0, load: 70, volt: 0.97 }
    };
    
    setBreakerStates(defaultBreakers);
    setBusData(defaultBuses);
    recalculatePowerFlow(defaultBreakers, defaultBuses);
    addSystemAlert('success', `電網拓撲結構與潮流負載已全部重置為基準配置。`, HOURS[timeIndex]);
  };

  const recalculatePowerFlow = (breakers, buses) => {
    let newLineData = { ...lineData };
    let newBusData = { ...buses };
    
    const activeLinesCount = Object.values(breakers).filter(Boolean).length;
    
    if (activeLinesCount === 0) {
      Object.keys(newLineData).forEach(k => {
        newLineData[k].flow = 0;
        newLineData[k].status = 'normal';
      });
      Object.keys(newBusData).forEach(k => {
        newBusData[k].volt = 0.0;
      });
      setLineData(newLineData);
      setBusData(newBusData);
      addSystemAlert('danger', `【崩潰】全線斷路器已切斷，爆發區域電網大停電！`, HOURS[timeIndex]);
      return;
    }

    const totalGen = newBusData[1].gen + newBusData[3].gen;
    const loadFactor = totalGen / 280;

    if (breakers['L1_2']) {
      newLineData['L1_2'].flow = Math.round(((newBusData[2].load * 0.6) + (newBusData[5].load * 0.2)) * loadFactor);
    } else {
      newLineData['L1_2'].flow = 0;
    }

    if (breakers['L1_3']) {
      newLineData['L1_3'].flow = Math.round(((newBusData[4].load * 0.4) + (newBusData[5].load * 0.3)) * loadFactor);
    } else {
      newLineData['L1_3'].flow = 0;
    }

    if (breakers['L2_4']) {
      newLineData['L2_4'].flow = breakers['L1_2'] ? Math.round(newBusData[4].load * 0.4 * loadFactor) : 0;
    } else {
      newLineData['L2_4'].flow = 0;
    }

    if (breakers['L3_4']) {
      newLineData['L3_4'].flow = breakers['L1_3'] ? Math.round(newBusData[4].load * 0.6 * loadFactor) : 0;
    } else {
      newLineData['L3_4'].flow = 0;
    }

    if (breakers['L4_5']) {
      newLineData['L4_5'].flow = Math.round(newBusData[5].load * 0.6 * loadFactor);
    } else {
      newLineData['L4_5'].flow = 0;
    }

    if (breakers['L2_5']) {
      newLineData['L2_5'].flow = Math.round(newBusData[5].load * 0.4 * loadFactor);
    } else {
      newLineData['L2_5'].flow = 0;
    }

    Object.keys(newBusData).forEach(k => {
      const id = parseInt(k);
      let volt = 1.0;
      if (id === 1) volt = parseFloat((1.0 + (newBusData[1].gen / 1000)).toFixed(2));
      else if (id === 3) volt = parseFloat((1.0 + (newBusData[3].gen / 1000)).toFixed(2));
      else {
        const loadVal = newBusData[id].load;
        const lineCount = Object.keys(breakers).filter(key => {
          const [f, t] = key.split('L')[1].split('_');
          return (parseInt(f) === id || parseInt(t) === id) && breakers[key];
        }).length;
        
        if (lineCount === 0) {
          volt = 0.0;
        } else {
          volt = parseFloat((1.0 - (loadVal / 500) - ((3 - lineCount) * 0.015) + ((totalGen - 280) / 2000)).toFixed(2));
        }
      }
      newBusData[k].volt = volt;
    });

    Object.keys(newLineData).forEach(k => {
      const line = newLineData[k];
      const ratio = line.flow / line.cap;
      if (!breakers[k]) {
        line.status = 'offline';
      } else if (ratio > 1.0) {
        line.status = 'overload';
      } else if (ratio > 0.8) {
        line.status = 'warning';
      } else {
        line.status = 'normal';
      }
    });

    setLineData(newLineData);
    setBusData(newBusData);

    const overloads = Object.values(newLineData).filter(l => l.status === 'overload');
    if (overloads.length > 0) {
      addSystemAlert('danger', `【超載警告】輸電線路 ${overloads[0].from}-${overloads[0].to} 載流超限！請儘速調降節點負載或重啟斷路器。`, HOURS[timeIndex]);
    }
  };

  const addSystemAlert = (type, msg, time) => {
    const newAlert = {
      id: Math.random(),
      type,
      msg,
      time
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Helper chart configurations
  const renderPriceChart = () => {
    const data = {
      labels: HOURS,
      datasets: [
        {
          label: '出清電價 (元/MWh)',
          data: priceHistory,
          borderColor: '#00f2fe',
          backgroundColor: 'rgba(0, 242, 254, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#00f2fe',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(7, 10, 19, 0.95)',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(0, 242, 254, 0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8b9bb4', font: { family: 'Outfit' } }
        },
        x: { 
          grid: { color: 'rgba(255, 255, 255, 0.02)' },
          ticks: { color: '#8b9bb4', font: { family: 'Outfit' } }
        }
      }
    };

    return <Line data={data} options={options} />;
  };

  const renderForecastChart = () => {
    const data = {
      labels: HOURS,
      datasets: [
        {
          label: '實際電網負載 (MW)',
          data: forecastCurve.actual,
          borderColor: '#4facfe',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.25
        },
        {
          label: 'AI 預測負載 (MW)',
          data: forecastCurve.predicted,
          borderColor: '#9b51e0',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.25
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          labels: { color: '#f3f4f6', font: { family: 'Outfit' } },
          position: 'top'
        },
        tooltip: {
          backgroundColor: 'rgba(7, 10, 19, 0.95)',
          borderColor: 'rgba(155, 81, 224, 0.2)',
          borderWidth: 1
        }
      },
      scales: {
        y: { 
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8b9bb4' }
        },
        x: { 
          grid: { display: false },
          ticks: { color: '#8b9bb4' }
        }
      }
    };

    return <Line data={data} options={options} />;
  };

  const renderDispatchChart = () => {
    const windCurve = HOURS.map((_, i) => Math.round(generators[3].out * (0.8 + Math.sin(i / 2) * 0.1)));
    const solarCurve = HOURS.map((_, i) => (i >= 6 && i <= 17) ? Math.round(generators[4].out * Math.sin((i - 6) * Math.PI / 11)) : 0);
    const coalCurve = HOURS.map(() => generators[0].out);
    const gasCurve = HOURS.map((_, i) => {
      const totalLoad = forecastCurve.actual[i];
      const ren = windCurve[i] + solarCurve[i];
      const remainder = totalLoad - ren - coalCurve[i];
      return Math.max(10, Math.min(200, remainder));
    });
    
    const data = {
      labels: HOURS,
      datasets: [
        {
          label: '太陽能發電 (MW)',
          data: solarCurve,
          backgroundColor: 'rgba(250, 204, 21, 0.75)',
          fill: true,
          borderColor: 'transparent',
          pointRadius: 0
        },
        {
          label: '風力發電 (MW)',
          data: windCurve,
          backgroundColor: 'rgba(56, 189, 248, 0.75)',
          fill: true,
          borderColor: 'transparent',
          pointRadius: 0
        },
        {
          label: '燃煤基載 (MW)',
          data: coalCurve,
          backgroundColor: 'rgba(148, 163, 184, 0.75)',
          fill: true,
          borderColor: 'transparent',
          pointRadius: 0
        },
        {
          label: '高效燃氣 (MW)',
          data: gasCurve,
          backgroundColor: 'rgba(245, 158, 11, 0.65)',
          fill: true,
          borderColor: 'transparent',
          pointRadius: 0
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f3f4f6', font: { family: 'Outfit' } } }
      },
      scales: {
        y: { 
          stacked: true,
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#8b9bb4' }
        },
        x: { 
          stacked: true,
          grid: { display: false },
          ticks: { color: '#8b9bb4' }
        }
      }
    };

    return <Line data={data} options={options} />;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-area">
          <Zap size={28} className="logo-icon" />
          <span className="logo-text">SMART GRID</span>
        </div>
        
        <nav className="menu-list">
          <div 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} className="menu-icon" />
            <span>首頁總覽</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'trading' ? 'active' : ''}`}
            onClick={() => setActiveTab('trading')}
          >
            <DollarSign size={18} className="menu-icon" />
            <span>電力買賣出清</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <TrendingUp size={18} className="menu-icon" />
            <span>即時電價趨勢</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'forecasting' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecasting')}
          >
            <Cpu size={18} className="menu-icon" />
            <span>AI 負載預測</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'dispatch' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispatch')}
          >
            <Sliders size={18} className="menu-icon" />
            <span>AI 最佳化調度</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'demand_response' ? 'active' : ''}`}
            onClick={() => setActiveTab('demand_response')}
          >
            <Flame size={18} className="menu-icon" />
            <span>需量反應控制</span>
          </div>
          <div 
            className={`menu-item ${activeTab === 'power_flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('power_flow')}
          >
            <Layers size={18} className="menu-icon" />
            <span>互動潮流分析</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <p>智慧電網控制中心 v1.0.0</p>
          <p style={{ marginTop: '4px', fontSize: '10px' }}>Antigravity Engine</p>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            <h1>
              {activeTab === 'dashboard' && '調度總覽儀表板'}
              {activeTab === 'trading' && '電力市場拍賣與成交'}
              {activeTab === 'pricing' && '即時電價與波動曲線'}
              {activeTab === 'forecasting' && 'AI 負荷智能預測系統'}
              {activeTab === 'dispatch' && 'AI 多能互補節能優化調度'}
              {activeTab === 'demand_response' && '電網尖峰需量反應中心'}
              {activeTab === 'power_flow' && '互動式五節點電網潮流模擬器'}
            </h1>
          </div>

          <div className="system-status">
            {/* Hour Time Toggler */}
            <div className="status-indicator" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}>{HOURS[timeIndex]}</span>
              <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                <button onClick={decrementTime} style={{ background: 'none', border: 'none', color: '#8b9bb4', cursor: 'pointer', outline: 'none' }}>◀</button>
                <button onClick={incrementTime} style={{ background: 'none', border: 'none', color: '#8b9bb4', cursor: 'pointer', outline: 'none' }}>▶</button>
              </div>
            </div>

            <div className="status-indicator">
              <span className="dot green"></span>
              <span>電網在線</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Routing */}
        
        {/* ==================== TAB 0: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* KPI Row */}
            <div className="glass-card col-3">
              <div className="card-header">
                <span className="card-title"><DollarSign size={16} />當前系統電價</span>
                <span className="kpi-trend up"><ArrowUpRight size={12}/> 2.4%</span>
              </div>
              <div className="kpi-container" style={{ display: 'block' }}>
                <div className="kpi-value cyan">${currentLmp}</div>
                <div className="kpi-sub" style={{ marginBottom: '8px' }}>元 / MWh</div>
                {/* Micro safety boundary progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (currentLmp / 200) * 100)}%`, background: 'var(--accent-cyan)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>離峰 $45</span>
                  <span>尖峰 $200</span>
                </div>
              </div>
            </div>

            <div className="glass-card col-3">
              <div className="card-header">
                <span className="card-title"><Activity size={16} />系統總負載</span>
                <span className="kpi-trend down"><ArrowDownRight size={12}/> -1.2%</span>
              </div>
              <div className="kpi-container" style={{ display: 'block' }}>
                <div className="kpi-value">{systemLoad}</div>
                <div className="kpi-sub" style={{ marginBottom: '8px' }}>MW (兆瓦)</div>
                {/* Micro safety boundary progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (systemLoad / 460) * 100)}%`, background: systemLoad > 400 ? 'var(--color-danger)' : 'var(--accent-blue)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>輕載 180M</span>
                  <span>容量 460M</span>
                </div>
              </div>
            </div>

            <div className="glass-card col-3">
              <div className="card-header">
                <span className="card-title"><Zap size={16} />電網頻率</span>
                <span className="status-indicator"><span className="dot green"></span> 穩定</span>
              </div>
              <div className="kpi-container" style={{ display: 'block' }}>
                <div className="kpi-value green">{systemFrequency}</div>
                <div className="kpi-sub" style={{ marginBottom: '8px' }}>Hz (赫茲)</div>
                {/* Micro safety boundary progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    width: `${Math.min(100, Math.abs(systemFrequency - 60) * 800)}%`, 
                    height: '100%', 
                    background: Math.abs(systemFrequency - 60) > 0.05 ? 'var(--color-warning)' : 'var(--color-success)' 
                  }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>59.90 Hz</span>
                  <span>60.10 Hz</span>
                </div>
              </div>
            </div>

            <div className="glass-card col-3">
              <div className="card-header">
                <span className="card-title"><Shield size={16} />備轉容量率</span>
                <span className={`gen-badge ${reserveMargin > 15 ? 'coal' : 'gas'}`} style={{ fontSize: '9px' }}>
                  {reserveMargin > 15 ? '充裕' : '吃緊'}
                </span>
              </div>
              <div className="kpi-container" style={{ display: 'block' }}>
                <div className="kpi-value orange">{reserveMargin}%</div>
                <div className="kpi-sub" style={{ marginBottom: '8px' }}>備用調節能力</div>
                {/* Micro safety boundary progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (reserveMargin / 40) * 100)}%`, background: reserveMargin < 10 ? 'var(--color-danger)' : 'var(--color-warning)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>下限 6%</span>
                  <span>安全 30%</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Chart and Grid Summary */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} /> 24小時電價走勢</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>今日動態成交波動</span>
              </div>
              <div style={{ height: '300px' }}>
                {renderPriceChart()}
              </div>
            </div>

            {/* Quick Control Center */}
            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> 快捷模擬控制台</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>市場出清撮合</p>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setActiveTab('trading'); setTimeout(runMarketClearing, 200); }}>
                    執行市場成交出清
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>電網跳脫測試</p>
                  <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => { setActiveTab('power_flow'); toggleBreaker('L1_2'); }}>
                    跳脫 Line 1-2 斷路器
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '12px', padding: '8px' }} onClick={handleTriggerTestAlert}>
                    觸發系統測試警告
                  </button>
                  <button className="btn btn-secondary" style={{ flexGrow: 1, fontSize: '12px', padding: '8px' }} onClick={handleClearAlerts}>
                    清除所有日誌
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts Center */}
            <div className="glass-card col-12">
              <div className="card-header">
                <span className="card-title"><AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} /> 系統即時告警事件 ({alerts.length})</span>
                {alerts.length > 0 && (
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleClearAlerts}>
                    清除日誌
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alerts.length > 0 ? (
                  alerts.map(a => (
                    <div key={a.id} className={`mini-alert ${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : 'success'}`} style={{ margin: 0 }}>
                      <Clock size={14} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>[{a.time}]</span>
                      <span style={{ flexGrow: 1, fontWeight: '500' }}>{a.msg}</span>
                      <span className="gen-badge coal" style={{ fontSize: '8px' }}>電網日誌</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    目前無 any 異常告警，系統運行良好。
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: ELECTRICITY TRADING ==================== */}
        {activeTab === 'trading' && (
          <div className="dashboard-grid">
            {/* Left side: Order input and real Supply-Demand Curve */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><Layers size={16} /> 電力市場掛單申報</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>雙向委託撮合市場</span>
              </div>

              <form onSubmit={handleAddOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">申報用戶</label>
                  <input type="text" className="form-input" value={tradeParty} onChange={e => setTradeParty(e.target.value)} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">申報方向</label>
                  <select className="form-select" value={tradeType} onChange={e => setTradeType(e.target.value)}>
                    <option value="buy">買入電力 (電網取電)</option>
                    <option value="sell">賣出電力 (機組併網)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">申報電量 (MW)</label>
                  <input type="number" className="form-input" value={tradeQty} onChange={e => setTradeQty(parseInt(e.target.value))} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">申報價格 (元/MWh)</label>
                  <input type="number" className="form-input" value={tradePrice} onChange={e => setTradePrice(parseInt(e.target.value))} required />
                </div>
                <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <PlusCircle size={15} /> 申報提交至市場
                  </button>
                </div>
              </form>

              {/* Market clearing curve simulator visual representation */}
              <div className="card-header" style={{ marginTop: '16px' }}>
                <span className="card-title"><Activity size={16} /> 供需交疊出清雙向曲線圖 (LMP Double Auction)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleClearAllOrders} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    <Trash2 size={13} /> 清空掛單池
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={runMarketClearing} disabled={isClearing} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    {isClearing ? '正在出清撮合...' : '立即執行市場出清'}
                  </button>
                </div>
              </div>

              <div className="clearing-chart-container">
                {isClearing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="loader-ring"></div>
                    <p style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>AI 出清引擎尋找最佳社會福利交點 (LMP)...</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'JetBrains Mono', marginTop: '8px' }}>{clearingStepText}</p>
                  </div>
                ) : (
                  bids.length === 0 && asks.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <Database size={36} style={{ marginBottom: '8px', opacity: 0.3 }} />
                      <p>掛單池目前為空，請在上方新增掛單以渲染出清階梯圖。</p>
                    </div>
                  ) : (
                    <Line 
                      data={getClearingChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            type: 'linear',
                            position: 'bottom',
                            title: { display: true, text: '累積申報電量 (MW)', color: '#8b9bb4', font: { family: 'Outfit', size: 11 } },
                            grid: { color: 'rgba(255, 255, 255, 0.03)' },
                            ticks: { color: '#8b9bb4' }
                          },
                          y: {
                            title: { display: true, text: '申報價格 (元/MWh)', color: '#8b9bb4', font: { family: 'Outfit', size: 11 } },
                            grid: { color: 'rgba(255, 255, 255, 0.03)' },
                            ticks: { color: '#8b9bb4' }
                          }
                        },
                        plugins: {
                          legend: { labels: { color: '#f3f4f6', font: { family: 'Outfit', size: 11 } } },
                          tooltip: {
                            backgroundColor: 'rgba(7, 10, 19, 0.95)',
                            borderColor: 'rgba(0, 242, 254, 0.2)',
                            borderWidth: 1
                          }
                        }
                      }} 
                    />
                  )
                )}
              </div>
            </div>

            {/* Right side: Dynamic Order Book with delete button */}
            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Database size={16} /> 即時委託帳本 (Order Book)</span>
              </div>

              <div className="order-book-grid">
                {/* Bids */}
                <div className="order-book-side">
                  <div className="order-book-title bids">買入申報 (Bids)</div>
                  {bids.length > 0 ? (
                    bids.map((b) => {
                      const matched = matchedBids.includes(b.id);
                      return (
                        <div key={b.id} className="depth-row bid" style={{ border: matched ? '1px solid var(--color-success)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="depth-bg" style={{ width: `${Math.min(100, (b.qty / 100) * 100)}%` }}></div>
                          <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>{b.party}</span>
                          <span className="price-green" style={{ fontSize: '11px' }}>${b.price}({b.qty}M)</span>
                          <button 
                            onClick={() => handleDeleteOrder(b.id, 'bid')} 
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 5, padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="撤銷此單"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '16px 0' }}>無買入委託</div>
                  )}
                </div>

                {/* Asks */}
                <div className="order-book-side">
                  <div className="order-book-title asks">賣出申報 (Asks)</div>
                  {asks.length > 0 ? (
                    asks.map((s) => {
                      const matched = matchedAsks.includes(s.id);
                      return (
                        <div key={s.id} className="depth-row ask" style={{ border: matched ? '1px solid var(--color-danger)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="depth-bg" style={{ width: `${Math.min(100, (s.qty / 100) * 100)}%` }}></div>
                          <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>{s.party}</span>
                          <span className="price-red" style={{ fontSize: '11px' }}>${s.price}({s.qty}M)</span>
                          <button 
                            onClick={() => handleDeleteOrder(s.id, 'ask')} 
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', zIndex: 5, padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="撤銷此單"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '16px 0' }}>無賣出委託</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: REAL-TIME PRICING ==================== */}
        {activeTab === 'pricing' && (
          <div className="dashboard-grid">
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} /> 當前市場即時邊際電價走勢</span>
                <span className="status-indicator">
                  <span className="dot green"></span> 即時數據同步中
                </span>
              </div>
              <div style={{ height: '360px' }}>
                {renderPriceChart()}
              </div>
            </div>

            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Info size={16} /> 節點邊際電價說明</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <p>
                  <strong>邊際電價 (Locational Marginal Pricing, LMP)</strong> 是指在滿足系統負荷安全運行下，系統多增加一單位電力需求所增加的最小生產成本。
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>電價峰谷結構:</p>
                  <ul style={{ paddingLeft: '20px', fontSize: '12px' }}>
                    <li><strong style={{ color: 'var(--color-danger)' }}>尖峰時段 (13:00 - 17:00)</strong>: 全民冷氣負載大，需要啟用高成本燃氣輪機，電價偏高。</li>
                    <li><strong style={{ color: 'var(--color-warning)' }}>平峰時段 (08:00 - 12:00)</strong>: 工商業正常運作，以燃煤與綠能為主力。</li>
                    <li><strong style={{ color: 'var(--color-success)' }}>離峰時段 (00:00 - 06:00)</strong>: 用電低谷，主要由核能/基載燃煤提供，電價極便宜。</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <span>今日最高電價:</span>
                  <strong style={{ color: 'var(--color-danger)' }}>$130.00 / MWh</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>今日最低電價:</span>
                  <strong style={{ color: 'var(--color-success)' }}>$54.00 / MWh</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: AI LOAD FORECASTING ==================== */}
        {activeTab === 'forecasting' && (
          <div className="dashboard-grid">
            {/* Chart Area */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><Cpu size={16} /> AI 負荷智能預測曲線</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MAPE (平均誤差率): 1.48%</span>
              </div>
              <div style={{ height: '350px' }}>
                {renderForecastChart()}
              </div>
            </div>

            {/* AI Param adjustment */}
            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> AI 特徵參數調整</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="slider-container">
                  <div className="slider-header">
                    <span>外部預測環境溫度</span>
                    <span className="slider-val">{temperature} °C</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="40" 
                    className="slider" 
                    value={temperature} 
                    onChange={e => setTemperature(parseInt(e.target.value))} 
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>冷涼 15°C</span>
                    <span>酷熱 40°C</span>
                  </div>
                </div>

                <div className="slider-container">
                  <div className="slider-header">
                    <span>環境相對濕度</span>
                    <span className="slider-val">{humidity} %</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="90" 
                    className="slider" 
                    value={humidity} 
                    onChange={e => setHumidity(parseInt(e.target.value))} 
                  />
                </div>

                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>是否為國定假日/週末</span>
                  <div style={{ cursor: 'pointer' }} onClick={() => setIsHoliday(!isHoliday)}>
                    {isHoliday ? <ToggleRight size={24} style={{ color: 'var(--accent-cyan)' }} /> : <ToggleLeft size={24} style={{ color: '#8b9bb4' }} />}
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '8px' }} 
                  onClick={triggerAIPrediction}
                  disabled={isPredicting}
                >
                  {isPredicting ? 'AI 神經網絡模型重算中...' : '重新推理預測曲線'}
                </button>
                
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  * AI 預測說明：本模組採用卷積長短期記憶網絡 (ConvLSTM) 模型。調整溫度會引發空調用電負荷突變，在右側圖表中能動態看到預測虛線隨參數即時重繪。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: AI OPTIMAL DISPATCH ==================== */}
        {activeTab === 'dispatch' && (
          <div className="dashboard-grid">
            {/* Visual stacked dispatch */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><Layers size={16} /> 24小時最佳化調度多能互補發電堆疊</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>目標負荷滿足率: 100%</span>
              </div>
              <div style={{ height: '300px', marginBottom: '24px' }}>
                {renderDispatchChart()}
              </div>

              {/* Cost Savings Bar Chart */}
              <div className="card-header" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <span className="card-title"><TrendingUp size={16} /> 今日 AI 節能優化效益歷史對比柱狀圖 (手動調度 vs AI 最佳化)</span>
                <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: '500' }}>平均成本降幅: 15.4%</span>
              </div>
              <div style={{ height: '240px' }}>
                {renderCostSavingChart()}
              </div>
            </div>

            {/* AI optimizer details */}
            <div className="glass-card col-4" style={{ position: 'relative' }}>
              {/* Calculating overlay with step scrolling logs */}
              <div className={`calculating-overlay ${isOptimizing ? 'active' : ''}`}>
                <div className="loader-ring"></div>
                <p style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>MILP 調度引擎優化計算中...</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'JetBrains Mono', marginTop: '10px', padding: '0 20px', textAlign: 'center', wordBreak: 'break-all' }}>
                  {optimizingStepText}
                </p>
              </div>

              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> AI 優化核心控制</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>目前小時總負載需求</p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono' }}>
                    {forecastCurve.actual[timeIndex]} <span style={{ fontSize: '16px' }}>MW</span>
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>優化前發電總成本</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-danger)', marginTop: '4px' }}>${dispatchStats.costBefore}</p>
                  </div>
                  <div style={{ background: 'rgba(5, 242, 161, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(5, 242, 161, 0.1)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>優化後 AI 總成本</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '4px' }}>${dispatchStats.costAfter}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>基礎發電碳排放</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-danger)', marginTop: '4px' }}>{dispatchStats.co2Before} t</p>
                  </div>
                  <div style={{ background: 'rgba(5, 242, 161, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(5, 242, 161, 0.1)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI 調度碳排放</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '4px' }}>{dispatchStats.co2After} t</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', background: 'rgba(0, 242, 254, 0.04)', padding: '8px', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(0, 242, 254, 0.1)' }}>
                  省下成本: <strong style={{ color: 'var(--accent-cyan)' }}>${dispatchStats.costBefore - dispatchStats.costAfter} 元/小時</strong> | 減少碳排: <strong style={{ color: 'var(--color-success)' }}>{parseFloat((dispatchStats.co2Before - dispatchStats.co2After).toFixed(1))} 噸</strong>
                </div>

                <button className="btn btn-primary" onClick={triggerOptimalDispatch} style={{ width: '100%' }}>
                  <Play size={14} /> 一鍵運行 AI 最佳化調度
                </button>
              </div>
            </div>

            {/* Generator units list with interactive output sliders & power toggle */}
            <div className="glass-card col-12">
              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> 各發電機組運轉狀態手動控制與調節門限</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>※ 滑動調整機組出力 | 點擊閃爍開關切換機組啟停</span>
              </div>

              <div className="gen-card-wall">
                {generators.map(g => (
                  <div key={g.id} className="gen-card" style={{ border: g.status === 'offline' ? '1px dashed rgba(255,255,255,0.08)' : '1px solid rgba(0,242,254,0.1)' }}>
                    <div className="gen-card-header">
                      <span className="gen-name">
                        <span className={`status-dot ${g.status === 'active' ? 'active' : g.status === 'standby' ? 'standby' : 'offline'}`}></span>
                        {g.name}
                      </span>
                      <button 
                        onClick={() => toggleGeneratorStatus(g.id)}
                        style={{ background: 'none', border: 'none', color: g.status === 'active' ? 'var(--color-success)' : '#8b9bb4', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={g.status === 'offline' ? '併網啟動' : '解聯停機'}
                      >
                        <Power size={14} style={{ filter: g.status === 'active' ? 'drop-shadow(0 0 4px var(--color-success))' : 'none' }} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>出力: <strong>{g.out} MW</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>最大容量: {g.cap} MW</span>
                    </div>

                    {/* Manual Generator Output Slider */}
                    <div className="slider-container" style={{ margin: '6px 0', opacity: g.status === 'offline' ? 0.3 : 1 }}>
                      <input 
                        type="range" 
                        min="0" 
                        max={g.cap} 
                        className="slider"
                        value={g.out}
                        disabled={g.status === 'offline'}
                        onChange={(e) => handleGeneratorOutputChange(g.id, parseInt(e.target.value))}
                        style={{ height: '3px', margin: '4px 0' }}
                      />
                    </div>

                    <div className="gen-bar-outer" style={{ height: '4px', margin: '4px 0' }}>
                      <div className="gen-bar-inner" style={{ width: `${(g.out / g.cap) * 100}%`, background: g.status === 'active' ? 'var(--accent-cyan)' : 'var(--text-dark)' }}></div>
                    </div>
                    <div className="gen-stats" style={{ fontSize: '11px', marginTop: '4px' }}>
                      <span>成本: ${g.cost}/MWh</span>
                      <span>碳排: {g.co2} t/MWh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: DEMAND RESPONSE ==================== */}
        {activeTab === 'demand_response' && (
          <div className="dashboard-grid">
            {/* DR Left console */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><Flame size={16} /> 尖峰需量反應 (Demand Response) 用戶抑低狀態</span>
                {drEventActive && <span className="gen-badge gas" style={{ animation: 'pulse-border 1s infinite' }}>抑低事件進行中</span>}
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>大用戶名稱</th>
                      <th>合約基準容量 (MW)</th>
                      <th>即時用電量 (MW)</th>
                      <th>最大可抑低容量 (MW)</th>
                      <th>已抑低用電 (MW)</th>
                      <th>調度參與權限</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drCustomers.map(c => (
                      <tr key={c.id} style={{ opacity: c.forceExclude ? 0.4 : c.responsive ? 1 : 0.8 }}>
                        <td>{c.name}</td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{c.base} MW</td>
                        <td style={{ fontFamily: 'JetBrains Mono', color: c.responsive ? 'var(--color-success)' : 'inherit' }}>{c.current} MW</td>
                        <td style={{ fontFamily: 'JetBrains Mono' }}>{c.maxReduce} MW</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 'bold', color: c.responsive ? 'var(--color-success)' : 'var(--text-muted)' }}>
                          {c.base - c.current} MW
                        </td>
                        <td>
                          <button 
                            className={`btn ${c.forceExclude ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => toggleCustomerExclude(c.id)}
                            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
                          >
                            {c.forceExclude ? '強制排除' : '正常參與'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic visualization */}
              <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>電網負載削減效果:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>抑低前高峰負載: {forecastCurve.actual[timeIndex]} MW</span>
                      <span>抑低後安全負載: {forecastCurve.actual[timeIndex] - drTotalReduced} MW</span>
                    </div>
                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${((forecastCurve.actual[timeIndex] - drTotalReduced) / 460) * 100}%`, background: 'var(--accent-blue)' }}></div>
                      <div style={{ width: `${(drTotalReduced / 460) * 100}%`, background: 'var(--color-warning)', animation: 'pulse-border 1.5s infinite' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', width: '120px', flexShrink: 0 }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>總削減負荷</p>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning)' }}>-{drTotalReduced} <span style={{ fontSize: '12px' }}>MW</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* DR Right control */}
            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> 需量反應事件調度台</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: drEventActive ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>目前備轉容量狀態</p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: reserveMargin > 15 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '4px' }}>
                    {reserveMargin > 15 ? '電網充足 (綠燈)' : '容量告急 (橘/紅燈)'}
                  </p>
                </div>

                <button 
                  className={`btn ${drEventActive ? 'btn-danger' : 'btn-warning'}`}
                  style={{ width: '100%' }}
                  onClick={triggerDREvent}
                >
                  {drEventActive ? '撤銷 / 終止需量反應事件' : '緊急發布需量反應事件'}
                </button>

                <div className="slider-container" style={{ opacity: drEventActive ? 1 : 0.4 }}>
                  <div className="slider-header">
                    <span>政府需量反應補償報價</span>
                    <span className="slider-val">{drRate} 元 / kWh</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    className="slider" 
                    value={drRate} 
                    onChange={e => setDrRate(parseInt(e.target.value))}
                    disabled={!drEventActive}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>低誘因 $3</span>
                    <span>極高誘因 $15</span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  * 調度邏輯：當發布抑低事件後，調整補償費率（元/度）會直接改變工業大用戶的抑低用電積極性。費率越高，用戶抑低的總量越多，成功幫電網削峰填谷。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: POWER FLOW ANALYSIS ==================== */}
        {activeTab === 'power_flow' && (
          <div className="dashboard-grid">
            {/* Interactive Grid Map SVG */}
            <div className="glass-card col-8">
              <div className="card-header">
                <span className="card-title"><Layers size={16} /> 互動式 IEEE 5-Bus 電網 SCADA 監控網絡圖</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>※ 點擊線路中間的開關方塊 [ON / OFF] 可直接控制斷路器！</span>
              </div>

              <div className="grid-map-container">
                <svg viewBox="0 0 600 400" className="grid-svg">
                  {/* Definition for gradients and laser filters */}
                  <defs>
                    <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fa4b5a" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#fa9e1b" stopOpacity="0.8" />
                    </linearGradient>
                    {/* SCADA Glow effect */}
                    <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Transmission lines paths */}
                  
                  {/* Line 1-2 */}
                  <path 
                    d="M 120,120 L 250,120" 
                    className={`grid-line ${!breakerStates['L1_2'] ? 'offline' : lineData['L1_2'].status}`} 
                  />
                  {breakerStates['L1_2'] && (
                    <path 
                      d="M 120,120 L 250,120" 
                      className={`grid-line-flow ${lineData['L1_2'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Line 1-3 */}
                  <path 
                    d="M 120,120 L 300,280" 
                    className={`grid-line ${!breakerStates['L1_3'] ? 'offline' : lineData['L1_3'].status}`} 
                  />
                  {breakerStates['L1_3'] && (
                    <path 
                      d="M 120,120 L 300,280" 
                      className={`grid-line-flow ${lineData['L1_3'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Line 2-4 */}
                  <path 
                    d="M 250,120 L 450,120" 
                    className={`grid-line ${!breakerStates['L2_4'] ? 'offline' : lineData['L2_4'].status}`} 
                  />
                  {breakerStates['L2_4'] && (
                    <path 
                      d="M 250,120 L 450,120" 
                      className={`grid-line-flow ${lineData['L2_4'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Line 3-4 */}
                  <path 
                    d="M 300,280 L 450,120" 
                    className={`grid-line ${!breakerStates['L3_4'] ? 'offline' : lineData['L3_4'].status}`} 
                  />
                  {breakerStates['L3_4'] && (
                    <path 
                      d="M 300,280 L 450,120" 
                      className={`grid-line-flow ${lineData['L3_4'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Line 4-5 */}
                  <path 
                    d="M 450,120 L 480,280" 
                    className={`grid-line ${!breakerStates['L4_5'] ? 'offline' : lineData['L4_5'].status}`} 
                  />
                  {breakerStates['L4_5'] && (
                    <path 
                      d="M 450,120 L 480,280" 
                      className={`grid-line-flow ${lineData['L4_5'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Line 2-5 */}
                  <path 
                    d="M 250,120 L 480,280" 
                    className={`grid-line ${!breakerStates['L2_5'] ? 'offline' : lineData['L2_5'].status}`} 
                  />
                  {breakerStates['L2_5'] && (
                    <path 
                      d="M 250,120 L 480,280" 
                      className={`grid-line-flow ${lineData['L2_5'].status}`}
                      filter="url(#laserGlow)"
                    />
                  )}

                  {/* Circuit Breakers overlay (Interactive Switches at midpoints) */}
                  {/* CB 1-2 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L1_2')}>
                    <rect x="173" y="112" width="24" height="16" rx="3" fill={breakerStates['L1_2'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="185" y="124" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L1_2'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* CB 1-3 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L1_3')}>
                    <rect x="198" y="192" width="24" height="16" rx="3" fill={breakerStates['L1_3'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="210" y="204" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L1_3'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* CB 2-4 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L2_4')}>
                    <rect x="338" y="112" width="24" height="16" rx="3" fill={breakerStates['L2_4'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="350" y="124" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L2_4'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* CB 3-4 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L3_4')}>
                    <rect x="363" y="192" width="24" height="16" rx="3" fill={breakerStates['L3_4'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="375" y="204" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L3_4'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* CB 4-5 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L4_5')}>
                    <rect x="453" y="192" width="24" height="16" rx="3" fill={breakerStates['L4_5'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="465" y="204" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L4_5'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* CB 2-5 */}
                  <g style={{ cursor: 'pointer' }} onClick={() => toggleBreaker('L2_5')}>
                    <rect x="353" y="192" width="24" height="16" rx="3" fill={breakerStates['L2_5'] ? '#05f2a1' : '#ff4a5a'} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="365" y="204" fontSize="8" fontWeight="bold" fill="#070a13" textAnchor="middle">{breakerStates['L2_5'] ? 'ON' : 'OFF'}</text>
                  </g>

                  {/* SVG Scenic Elements */}
                  {/* Wind Turbine near Bus 3 */}
                  <g transform="translate(340, 270)" style={{ pointerEvents: 'none' }}>
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#8b9bb4" strokeWidth="2" />
                    <g transform="translate(0, -20)">
                      <circle cx="0" cy="0" r="2" fill="#fff" />
                      <g className="spinning-blades">
                        <line x1="0" y1="0" x2="0" y2="-12" stroke="#fff" strokeWidth="1.5" />
                        <line x1="0" y1="0" x2="10" y2="6" stroke="#fff" strokeWidth="1.5" />
                        <line x1="0" y1="0" x2="-10" y2="6" stroke="#fff" strokeWidth="1.5" />
                      </g>
                    </g>
                  </g>

                  {/* Solar Panel near Bus 1 */}
                  <g transform="translate(60, 100)" style={{ pointerEvents: 'none' }}>
                    <rect x="0" y="0" width="20" height="12" fill="url(#solarGrad)" stroke="#4facfe" strokeWidth="1" transform="skewX(-15)" />
                    <line x1="-3" y1="0" x2="17" y2="0" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" transform="skewX(-15)" />
                    <line x1="7" y1="0" x2="7" y2="12" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" transform="skewX(-15)" />
                  </g>

                  {/* Bus Nodes Group */}
                  
                  {/* Bus 1 */}
                  <g className={`bus-node ${activeBus === 1 ? 'active' : ''}`} onClick={() => setActiveBus(1)}>
                    <circle cx="120" cy="120" r="26" className="bus-circle" />
                    <text x="120" y="115" className="bus-text" style={{ fill: 'var(--accent-cyan)' }}>發電樞紐</text>
                    <text x="120" y="132" className="bus-text" style={{ fill: '#cbd5e1', fontSize: '9px' }}>Bus 1</text>
                  </g>

                  {/* Bus 2 */}
                  <g className={`bus-node ${activeBus === 2 ? 'active' : ''}`} onClick={() => setActiveBus(2)}>
                    <circle cx="250" cy="120" r="26" className="bus-circle" />
                    <text x="250" y="115" className="bus-text">工業園區</text>
                    <text x="250" y="132" className="bus-text" style={{ fill: '#cbd5e1', fontSize: '9px' }}>Bus 2</text>
                  </g>

                  {/* Bus 3 */}
                  <g className={`bus-node ${activeBus === 3 ? 'active' : ''}`} onClick={() => setActiveBus(3)}>
                    <circle cx="300" cy="280" r="26" className="bus-circle" />
                    <text x="300" y="275" className="bus-text" style={{ fill: 'var(--accent-cyan)' }}>綠能儲存</text>
                    <text x="300" y="292" className="bus-text" style={{ fill: '#cbd5e1', fontSize: '9px' }}>Bus 3</text>
                  </g>

                  {/* Bus 4 */}
                  <g className={`bus-node ${activeBus === 4 ? 'active' : ''}`} onClick={() => setActiveBus(4)}>
                    <circle cx="450" cy="120" r="26" className="bus-circle" />
                    <text x="450" y="115" className="bus-text">民生住宅</text>
                    <text x="450" y="132" className="bus-text" style={{ fill: '#cbd5e1', fontSize: '9px' }}>Bus 4</text>
                  </g>

                  {/* Bus 5 */}
                  <g className={`bus-node ${activeBus === 5 ? 'active' : ''}`} onClick={() => setActiveBus(5)}>
                    <circle cx="480" cy="280" r="26" className="bus-circle" />
                    <text x="480" y="275" className="bus-text">商業中心</text>
                    <text x="480" y="292" className="bus-text" style={{ fill: '#cbd5e1', fontSize: '9px' }}>Bus 5</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Interactive Grid detail panel */}
            <div className="glass-card col-4">
              <div className="card-header">
                <span className="card-title"><Sliders size={16} /> 電網節點細節與負荷調節</span>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={handleResetGridFlow}>
                  <RefreshCw size={10} /> 重置電網
                </button>
              </div>

              {activeBus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                      {busData[activeBus].name} ({busData[activeBus].type})
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>節點電壓 (Voltage): 
                      <strong style={{ marginLeft: '6px', color: busData[activeBus].volt > 0.95 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {busData[activeBus].volt} p.u.
                      </strong>
                    </p>
                  </div>

                  {/* Generator Node controls (Bus 1 and 3) */}
                  {(activeBus === 1 || activeBus === 3) ? (
                    <div className="slider-container">
                      <div className="slider-header">
                        <span>併網發電出力調節 (Generation Control)</span>
                        <span className="slider-val" style={{ color: 'var(--color-success)' }}>{busData[activeBus].gen} MW</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="300" 
                        className="slider" 
                        value={busData[activeBus].gen}
                        onChange={e => handleBusGenChange(activeBus, e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>最小出力 20MW</span>
                        <span>極限出力 300MW</span>
                      </div>
                    </div>
                  ) : (
                    /* Load Node controls (Bus 2, 4, 5) */
                    <div className="slider-container">
                      <div className="slider-header">
                        <span>節點用電需求調控 (Demand Control)</span>
                        <span className="slider-val" style={{ color: 'var(--color-danger)' }}>{busData[activeBus].load} MW</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="240" 
                        className="slider" 
                        value={busData[activeBus].load}
                        onChange={e => handleBusDemandChange(activeBus, e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>輕載 20MW</span>
                        <span>重載 240MW</span>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>相連輸電線路載流率:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.keys(lineData).filter(k => k.includes(String(activeBus))).map(k => {
                        const line = lineData[k];
                        const ratio = Math.round((line.flow / line.cap) * 100);
                        return (
                          <div key={k} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span>Line {line.from}-{line.to} ({breakerStates[k] ? '投入中' : '已開斷'})</span>
                              <strong style={{ color: ratio > 100 ? 'var(--color-danger)' : ratio > 80 ? 'var(--color-warning)' : 'inherit' }}>
                                {line.flow} / {line.cap} MW ({ratio}%)
                              </strong>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${Math.min(100, ratio)}%`, 
                                background: ratio > 100 ? 'var(--color-danger)' : ratio > 80 ? 'var(--color-warning)' : 'var(--accent-cyan)' 
                              }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>請在左側電網地圖中點擊任一 Bus 節點進行調節分析。</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
