
import React, { useState } from 'react';
import { 
  Play, Pause, RefreshCw, HelpCircle, 
  Settings, Database, Zap, ChevronRight, 
  MessageSquare, Send, X, Box, Layers,
  Thermometer, Activity, ShieldAlert, Cpu,
  Monitor, Info
} from 'lucide-react';
import { SpindleParams, SimulationState } from './types';
import { EXPLANATORY_STEPS } from './constants';
import SpindleVisualizer from './components/SpindleVisualizer';
import SpindleVisualizer3D from './components/SpindleVisualizer3D';
import { askSpindleExpert } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    pressure: 0.45,
    speed: 15000,
    load: 50,
    eccentricity: 0,
    material: 'steel',
    maintenanceMode: false,
    isRunning: true,
    showPressureMap: true,
    showAirParticles: true,
    activeExplanationIndex: 0,
    viewMode: '3d'
  });

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'expert', text: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const handleParamChange = (key: keyof SpindleParams, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleAskExpert = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setIsAsking(true);
    const answer = await askSpindleExpert(q);
    setChatHistory(prev => [...prev, { role: 'expert', text: answer }]);
    setIsAsking(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 selection:bg-sky-100">
      
      {/* Control Panel */}
      <aside className="w-full md:w-[340px] bg-white border-r border-slate-200 p-8 flex flex-col space-y-8 overflow-y-auto shadow-sm z-20">
        <header className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-sky-100 transform -rotate-3">
            <Cpu size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-900 tracking-tight leading-none italic">Aero<span className="text-sky-600">Lab</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">ULTRA-PRECISION 5.0</p>
          </div>
        </header>

        {/* Global Control Mode */}
        <section className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex">
          <button 
            onClick={() => setState(s => ({...s, viewMode: '3d'}))}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all font-bold text-xs ${state.viewMode === '3d' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Box size={14} /> <span>3D 物理视图</span>
          </button>
          <button 
            onClick={() => setState(s => ({...s, viewMode: '2d'}))}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl transition-all font-bold text-xs ${state.viewMode === '2d' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Layers size={14} /> <span>2D 剖面分析</span>
          </button>
        </section>

        {/* Dynamic Controls */}
        <div className="space-y-8">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Monitor size={12} className="mr-2 text-sky-500" /> 气源压力设定
                </label>
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{state.pressure.toFixed(2)} MPa</span>
             </div>
             <input type="range" min="0.2" max="0.8" step="0.01" value={state.pressure} onChange={(e) => handleParamChange('pressure', parseFloat(e.target.value))}
               className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-sky-600" />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Activity size={12} className="mr-2 text-emerald-500" /> 旋转速度控制
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{state.speed} RPM</span>
             </div>
             <input type="range" min="0" max="80000" step="1000" value={state.speed} onChange={(e) => handleParamChange('speed', parseInt(e.target.value))}
               className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500" />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <ShieldAlert size={12} className="mr-2 text-rose-500" /> 动态负载模拟
                </label>
                <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{state.load} N</span>
             </div>
             <input type="range" min="0" max="600" step="10" value={state.load} onChange={(e) => handleParamChange('load', parseInt(e.target.value))}
               className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-rose-500" />
          </div>
        </div>

        {/* Configuration */}
        <section className="pt-6 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高级配置与诊断</p>
          <div className="grid grid-cols-1 gap-3">
             <button 
                onClick={() => handleParamChange('maintenanceMode', !state.maintenanceMode)}
                className={`p-4 rounded-2xl border text-left transition-all ${state.maintenanceMode ? 'bg-sky-600 border-sky-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
             >
                <div className="flex items-center justify-between mb-1">
                   <Thermometer size={16} />
                   <div className={`w-2 h-2 rounded-full ${state.maintenanceMode ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
                </div>
                <p className="text-xs font-bold">气路故障诊断模式</p>
                <p className={`text-[9px] mt-1 ${state.maintenanceMode ? 'text-sky-100' : 'text-slate-400'}`}>高亮显示微孔节流区域温升与流量异常</p>
             </button>
             
             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-500 uppercase">主轴材质特性</div>
                <div className="flex gap-2">
                   {['steel', 'titanium', 'ceramic'].map((mat) => (
                      <button key={mat} onClick={() => handleParamChange('material', mat)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${state.material === mat ? 'bg-sky-600 text-white' : 'bg-white text-slate-400'}`}>
                        {mat}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={() => setState(s => ({...s, isRunning: !s.isRunning}))}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 transition-all shadow-xl ${
              state.isRunning ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
            }`}>
            {state.isRunning ? <Pause size={16} /> : <Play size={16} />}
            <span>{state.isRunning ? '紧急制动' : '启动仿真'}</span>
          </button>
          <button onClick={() => setState(s => ({...s, pressure: 0.45, speed: 15000, load: 50}))}
            className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>

        <footer className="mt-auto pt-6 border-t border-slate-100 flex flex-col space-y-4">
           <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex items-center justify-between group cursor-pointer" onClick={() => setIsChatOpen(true)}>
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-sky-600">
                    <MessageSquare size={18} />
                 </div>
                 <div>
                    <p className="font-black text-xs text-sky-800 leading-none">专家知识库</p>
                    <p className="text-[9px] text-sky-600/70 font-bold uppercase mt-1 tracking-widest">Ask for Insights</p>
                 </div>
              </div>
              <ChevronRight size={14} className="text-sky-400 group-hover:translate-x-1 transition-transform" />
           </div>
           <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest">© 2024 AeroLab Precision Engineering System</p>
        </footer>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col bg-white">
        
        {/* Title Bar */}
        <header className="h-14 px-8 flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">物理模型状态: <span className="text-slate-900">同步实时解析中 (60Hz)</span></p>
           </div>
           <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-slate-400 hover:text-sky-600 cursor-pointer transition-colors">
                 <Info size={14} />
                 <span className="text-[10px] font-bold uppercase">桌面版打包指南</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex space-x-1">
                 <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold">X</div>
                 <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold">Y</div>
                 <div className="w-6 h-6 rounded bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">Z</div>
              </div>
           </div>
        </header>

        {/* Dynamic Display */}
        <div className="flex-1 relative">
           {state.viewMode === '3d' ? (
             <SpindleVisualizer3D params={state} isRunning={state.isRunning} />
           ) : (
             <SpindleVisualizer params={state} showPressureMap={state.showPressureMap} showAirParticles={state.showAirParticles} />
           )}
        </div>

        {/* Discovery Stepper */}
        <div className="bg-white border-t border-slate-100 p-8">
           <div className="max-w-6xl mx-auto flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
              {EXPLANATORY_STEPS.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => setState(s => ({...s, activeExplanationIndex: idx}))}
                  className={`flex-shrink-0 w-72 p-6 rounded-3xl border transition-all cursor-pointer ${
                    state.activeExplanationIndex === idx 
                    ? 'bg-white border-sky-500 shadow-2xl shadow-sky-100 translate-y-[-4px]' 
                    : 'bg-slate-50 border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                   <div className="flex items-center justify-between mb-4">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        state.activeExplanationIndex === idx ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>模块 {idx + 1}</span>
                   </div>
                   <h4 className={`font-black text-sm mb-2 tracking-tight ${state.activeExplanationIndex === idx ? 'text-slate-900' : 'text-slate-500'}`}>{step.title}</h4>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">{step.content}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Expert Chat Drawer */}
        {isChatOpen && (
          <div className="absolute inset-y-0 right-0 w-full md:w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-500">
             <header className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white">
                      <Zap size={24} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-tight">精密工程 AI 顾问</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Expert System Ready</p>
                   </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all text-slate-500">
                   <X size={20} />
                </button>
             </header>

             <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 px-10">
                     <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl flex items-center justify-center border border-slate-100">
                        <MessageSquare size={40} className="text-sky-600" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 text-xl mb-3">深度原理解析</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-bold">
                           您可以询问主轴的刚度计算、动平衡、热膨胀补偿或者微孔加工精度对气膜的影响。
                        </p>
                     </div>
                     <div className="grid gap-2 w-full">
                        {["气膜阻尼对振动的影响？", "多孔质节流阀的设计准则？", "主轴热漂移的软件补偿方法？"].map((q, i) => (
                          <button key={i} onClick={() => setChatInput(q)} className="text-left p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:border-sky-600 hover:bg-sky-50 transition-all shadow-sm">
                            {q}
                          </button>
                        ))}
                     </div>
                  </div>
                )}
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                      chat.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none prose prose-slate prose-sm'
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {isAsking && <div className="flex space-x-2 p-5"><div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div><div className="w-2 h-2 bg-sky-600 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div></div>}
             </div>

             <div className="p-8 border-t border-slate-100">
                <form onSubmit={(e) => {e.preventDefault(); handleAskExpert();}} className="relative">
                   <input 
                     type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                     placeholder="询问关于气流、刚度或制造的专业知识..."
                     className="w-full bg-slate-100 border-none rounded-2xl py-5 pl-8 pr-16 text-sm font-bold focus:ring-2 focus:ring-sky-600 shadow-inner"
                   />
                   <button type="submit" disabled={isAsking || !chatInput.trim()} className="absolute right-3 top-3 p-3 bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all">
                      <Send size={20} />
                   </button>
                </form>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
