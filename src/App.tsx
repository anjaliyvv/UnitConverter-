/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { initialCategories } from './data';
import { Category, HistoryItem, Unit } from './types';
import { Copy, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategories[0]);
  const [fromUnit, setFromUnit] = useState<Unit | undefined>(selectedCategory.units[0]);
  const [toUnit, setToUnit] = useState<Unit | undefined>(selectedCategory.units[1]);
  const [value, setValue] = useState<string>('1');
  const [result, setResult] = useState<string>('');
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('conversionHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [precision, setPrecision] = useState<number>(() => {
    const p = localStorage.getItem('precision');
    return p ? parseInt(p) : 2;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('customUnits');
    if (!saved) return initialCategories;
    const customUnits: { categoryId: string, name: string, multiplier: number }[] = JSON.parse(saved);
    return initialCategories.map(cat => {
      const unitsForCat = customUnits.filter(u => u.categoryId === cat.id);
      return {
        ...cat,
        units: [...cat.units, ...unitsForCat.map(u => ({
          name: u.name,
          toBase: (v: number) => v / u.multiplier,
          fromBase: (v: number) => v * u.multiplier
        }))]
      };
    });
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitMultiplier, setNewUnitMultiplier] = useState('');

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    localStorage.setItem('conversionHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('precision', precision.toString());
  }, [precision]);

  useEffect(() => {
    // Only persist custom units
    const customUnits = categories.flatMap(cat => 
      cat.units
        .filter(u => !initialCategories.find(ic => ic.id === cat.id)?.units.find(iu => iu.name === u.name))
        .map(u => ({
          categoryId: cat.id,
          name: u.name,
          multiplier: u.fromBase(1) // Assuming linear relationship
        }))
    );
    localStorage.setItem('customUnits', JSON.stringify(customUnits));
  }, [categories]);

  const chartData = [...history]
    .reverse()
    .filter(item => !isNaN(parseFloat(item.result)))
    .map((item, index) => ({
      name: index,
      value: parseFloat(item.result)
    }));

  const addCustomUnit = () => {
    if (!newUnitName || !newUnitMultiplier) return;
    const multiplier = parseFloat(newUnitMultiplier);
    if (isNaN(multiplier)) return;

    const newUnit: Unit = {
      name: newUnitName,
      toBase: (v: number) => v / multiplier,
      fromBase: (v: number) => v * multiplier
    };

    const updatedCategory = { ...selectedCategory, units: [...selectedCategory.units, newUnit] };
    setSelectedCategory(updatedCategory);
    setCategories(prev => prev.map(c => c.id === selectedCategory.id ? updatedCategory : c));
    setNewUnitName('');
    setNewUnitMultiplier('');
  };

  useEffect(() => {
    if (selectedCategory.isCurrency && selectedCategory.units.length === 0) {
      fetch('/api/currency')
        .then(res => res.json())
        .then(data => {
          setCurrencyRates(data.rates);
          const currencyUnits: Unit[] = [
            { name: 'USD', toBase: (v: number) => v, fromBase: (v: number) => v },
            ...Object.keys(data.rates).map(r => ({
              name: r,
              toBase: (v: number) => v / data.rates[r],
              fromBase: (v: number) => v * data.rates[r]
            }))
          ];
          setCategories(prev => prev.map(c => c.id === 'currency' ? { ...c, units: currencyUnits } : c));
          setSelectedCategory(prev => ({ ...prev, units: currencyUnits }));
          setFromUnit(prev => prev || currencyUnits[0]);
          setToUnit(prev => prev || currencyUnits[1]);
        })
        .catch(console.error);
    }
  }, [selectedCategory]);

  const handleConvert = () => {
    if (!fromUnit || !toUnit) return;
    setIsLoading(true);
    
    setTimeout(() => {
      const fromVal = parseFloat(value);
      if (!isNaN(fromVal)) {
        const baseValue = fromUnit.toBase(fromVal);
        const converted = toUnit.fromBase(baseValue);
        
        const formatNumber = (num: number, prec: number) => {
          if (num === 0) return num.toFixed(prec);
          const abs = Math.abs(num);
          if (abs >= 1e7 || (abs < Math.pow(10, -prec) && abs > 0)) {
            return num.toExponential(prec);
          }
          return num.toFixed(prec);
        };

        const conversionResult = formatNumber(converted, precision);
        setResult(conversionResult);
        
        const newHistoryItem = { value, from: fromUnit.name, to: toUnit.name, result: conversionResult };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
      } else {
        setResult('');
      }
      setIsLoading(false);
    }, 300);
  };

  const swapUnits = () => {
    if (!fromUnit || !toUnit) return;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="flex justify-between items-end p-8 border-b border-zinc-800 bg-zinc-950">
        <div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">OMNI CONVERT</h1>
          <p className="mt-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">Universal Unit Intelligence Suite</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row bg-zinc-950">
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col p-6 space-y-4">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Categories</div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-600 transition-colors text-sm"
          />
          <div className="space-y-1 overflow-y-auto">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setFromUnit(cat.units[0]);
                  setToUnit(cat.units[1]);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg font-medium transition-all ${selectedCategory.id === cat.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-900 text-zinc-400'}`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-auto pt-6 border-t border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Add Custom Unit</div>
            <input type="text" placeholder="Unit Name" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full p-2.5 mb-2 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:border-blue-600 transition-colors text-sm" />
            <input type="number" placeholder="Multiplier" value={newUnitMultiplier} onChange={(e) => setNewUnitMultiplier(e.target.value)} className="w-full p-2.5 mb-4 bg-zinc-900 text-zinc-200 rounded-lg border border-zinc-800 focus:border-blue-600 transition-colors text-sm" />
            <button onClick={addCustomUnit} className="w-full p-3 bg-zinc-800 text-zinc-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors">Save Custom Unit</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col p-6 md:p-12 justify-center">
          <div className="max-w-xl mx-auto w-full space-y-10">
            <div className="space-y-4 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">From</div>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConvert();
                }}
                className="text-5xl font-black bg-transparent w-full border-none outline-none text-white placeholder-zinc-700"
                placeholder="0"
              />
              <select 
                className="text-lg font-medium text-zinc-300 bg-zinc-800 p-2 rounded-lg w-full outline-none"
                onChange={(e) => setFromUnit(selectedCategory.units.find(u => u.name === e.target.value))}
                value={fromUnit?.name || ''}
              >
                {selectedCategory.units.map(u => <option key={u.name} value={u.name} className="bg-zinc-900">{u.name}</option>)}
              </select>
            </div>

            <div className="flex justify-center">
              <button onClick={swapUnits} className="p-3 bg-zinc-800 text-zinc-400 rounded-full hover:text-white transition-colors">
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="space-y-4 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">To</div>
              <motion.div 
                key={result}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isLoading ? 0.5 : 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-black text-blue-400 flex items-center justify-between"
              >
                {result || '0'}
                <button onClick={copyResult} className="text-zinc-600 hover:text-zinc-300">
                  <Copy size={24} />
                </button>
              </motion.div>
              <select 
                className="text-lg font-medium text-zinc-400 bg-zinc-800 p-2 rounded-lg w-full outline-none"
                onChange={(e) => setToUnit(selectedCategory.units.find(u => u.name === e.target.value))}
                value={toUnit?.name || ''}
              >
                {selectedCategory.units.map(u => <option key={u.name} value={u.name} className="bg-zinc-900">{u.name}</option>)}
              </select>
            </div>
            
            <button 
              onClick={handleConvert}
              className="w-full py-5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
            >
              Convert Now
            </button>
          </div>
        </main>
        
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col bg-zinc-900/30">
          <div className="flex-1 p-8 space-y-8">
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Settings</div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <label className="text-xs text-zinc-300">Precision: <span className='font-bold text-blue-400'>{precision}</span></label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    value={precision}
                    onChange={(e) => setPrecision(parseInt(e.target.value))}
                    className="w-full accent-blue-600 mt-3"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">History</div>
                <button onClick={() => setHistory([])} className="text-[10px] text-zinc-500 hover:text-white underline">CLEAR</button>
              </div>
              <div className="space-y-3">
                {history.map((item, index) => (
                    <div key={index} className="text-xs bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                        <div className="text-zinc-500 mb-1">{item.value} {item.from} =</div>
                        <div className="font-mono text-zinc-100 font-bold">{item.result} {item.to}</div>
                    </div>
                ))}
              </div>
              {chartData.length > 1 && (
                <div className="mt-8 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Conversion Trend</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="name" hide />
                        <YAxis domain={['auto', 'auto']} stroke="#52525b" tick={{fontSize: 10}} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} 
                            itemStyle={{ color: '#e4e4e7', fontSize: '12px' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: number) => [value.toFixed(precision), 'Result']}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
