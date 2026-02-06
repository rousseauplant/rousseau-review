import { useState, useEffect, useRef } from 'react';
import { Upload, Sun, Zap, Check } from 'lucide-react';
import { supabase } from './lib/supabase';

const LIGHT_ZONES = [
  { id: 'high', label: 'HIGH GROWTH ZONE', desc: 'Bright enough for plants to actively thrive', bg: 'bg-blue-900', dot: 'bg-green-500', text: 'text-white' },
  { id: 'low', label: 'LOW GROWTH ZONE', desc: 'Enough for survival + slow growth', bg: 'bg-white', dot: 'bg-yellow-500', text: 'text-gray-900', border: true },
  { id: 'no', label: 'NO GROWTH ZONE', desc: 'Functionally too dark for real growth', bg: 'bg-white', dot: 'bg-red-500', text: 'text-gray-900', border: true }
];
const DIRECTIONS = ['East', 'West', 'North', 'South', 'Idk'];
const FEEDING = ['Every watering', 'Every other watering', 'Every 3rd watering', 'Monthly'];
const SOIL = ['Perlite', 'Pumice', 'Orchid Bark', 'Coco Coir', 'Coco Chunks', 'Tree Fern Fiber', 'Horticultural Charcoal', 'Bio Char', 'Worm Castings', 'Rice Hulls', 'LECA', 'Pon (Lechuza)', 'Zeolite', 'Fluval Stratum', 'Regular Potting Mix', 'Sphagnum Moss', 'Lava Rock', 'Vermiculite'];

export default function App() {
  const [tab, setTab] = useState<'create' | 'gallery'>('create');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userName, setUserName] = useState('');
  const [plantName, setPlantName] = useState('');
  const [hasWindow, setHasWindow] = useState(true);
  const [direction, setDirection] = useState('South');
  const [growLights, setGrowLights] = useState(false);
  const [lightZone, setLightZone] = useState('high');
  const [temp, setTemp] = useState(72);
  const [humidity, setHumidity] = useState(60);
  const [feeding, setFeeding] = useState(0);
  const [foliar, setFoliar] = useState(false);
  const [nutrients, setNutrients] = useState('');
  const [soil, setSoil] = useState<string[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [covers, setCovers] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { fetchCovers(); }, []);
  const fetchCovers = async () => {
    const { data } = await supabase.from('covers').select('*').eq('is_hidden', false).order('created_at', { ascending: false });
    if (data) setCovers(data);
  };
  const toggleSoil = (s: string) => setSoil(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPhotoFile(f); const r = new FileReader(); r.onloadend = () => setPhoto(r.result as string); r.readAsDataURL(f); }
  };
  const generate = async () => {
    if (!photo || !plantName) return;
    setLoading(true);
    const canvas = canvasRef.current!, ctx = canvas.getContext('2d')!;
    canvas.width = 500; canvas.height = 700;
    ctx.fillStyle = '#FEF4E0'; ctx.fillRect(0, 0, 500, 700);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 484, 684);
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.strokeRect(16, 16, 468, 668);
    ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 32px Bungee, Arial'; ctx.textAlign = 'center'; ctx.fillText('ROUSSEAU', 250, 55);
    ctx.fillStyle = '#22c55e'; ctx.font = 'bold 24px Bungee, Arial'; ctx.fillText('REVIEW', 250, 85);
    const img = new Image(); img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = photo; });
    ctx.drawImage(img, 30, 105, 440, 320);
    const name = userName ? `${userName.toUpperCase()}'S ${plantName.toUpperCase()}` : plantName.toUpperCase();
    ctx.fillStyle = '#1e3a5f'; ctx.font = 'bold 22px Bungee, Arial';
    const words = name.split(' '); let line = '', y = 470;
    for (const w of words) { const test = line + w + ' '; if (ctx.measureText(test).width > 440 && line) { ctx.fillText(line, 250, y); line = w + ' '; y += 28; } else line = test; }
    ctx.fillText(line, 250, y);
    y += 35; ctx.fillStyle = '#22c55e'; ctx.font = 'bold 12px Inter, Arial'; ctx.fillText('CARE GUIDE', 250, y);
    ctx.fillStyle = '#4b5563'; ctx.font = '11px Inter, Arial';
    const zone = LIGHT_ZONES.find(z => z.id === lightZone);
    ctx.fillText(`${zone?.label} | ${temp}°F | ${humidity}% Humidity`, 250, y + 18);
    ctx.fillText(`Feed: ${FEEDING[feeding]}`, 250, y + 32);
    if (soil.length) ctx.fillText(`Soil: ${soil.slice(0, 3).join(', ')}${soil.length > 3 ? '...' : ''}`, 250, y + 46);
    if (foliar) { ctx.fillStyle = '#22c55e'; ctx.fillText('Foliar Feed Recommended', 250, y + 60); }
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px Inter, Arial'; ctx.fillText('Powered by Rousseau Plant Care', 250, 675);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95); setCover(dataUrl);
    if (photoFile) {
      const fd = new FormData(); fd.append('file', photoFile); fd.append('upload_preset', 'rousseau_covers');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
      const d = await res.json();
      if (d.secure_url) { await supabase.from('covers').insert({ plant_name: plantName, image_url: d.secure_url, light_zone: lightZone, watering_interval: FEEDING[feeding], temperature: temp, humidity, soil_mix: soil.join(', '), foliar_feed: foliar, nutrients: nutrients || null, cover_data_url: dataUrl } as any); fetchCovers(); }
    }
    setLoading(false);
  };
  const download = () => { if (cover) { const a = document.createElement('a'); a.href = cover; a.download = `rousseau-${plantName}.jpg`; a.click(); } };

  if (tab === 'gallery') return (
    <div className="min-h-screen" style={{ background: '#FEF4E0' }}>
      <header className="bg-white border-b border-amber-200"><div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center"><div><span className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'Bungee' }}>ROUSSEAU</span><span className="text-sm text-gray-600 ml-2">PLANT CARE</span></div><button onClick={() => setTab('create')} className="text-blue-900 hover:underline font-medium">Create Cover</button></div></header>
      <main className="max-w-6xl mx-auto px-6 py-8"><h2 className="text-3xl font-bold text-blue-900 mb-8" style={{ fontFamily: 'Bungee' }}>Community Gallery</h2>{covers.length === 0 ? <div className="text-center py-16 bg-white rounded-xl"><p className="text-gray-500">No covers yet. Be the first!</p></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{covers.map(c => <div key={c.id} className="bg-white rounded-xl shadow-lg overflow-hidden"><img src={c.cover_data_url || c.image_url} alt={c.plant_name} className="w-full aspect-[3/4] object-cover" /><div className="p-4"><h3 className="font-bold text-blue-900" style={{ fontFamily: 'Bungee' }}>{c.plant_name}</h3></div></div>)}</div>}</main>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#FEF4E0' }}>
      <header className="bg-white border-b border-amber-200"><div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center"><div><span className="text-2xl font-bold text-blue-900" style={{ fontFamily: 'Bungee' }}>ROUSSEAU</span><span className="text-sm text-gray-600 ml-2">PLANT CARE</span></div><button onClick={() => setTab('gallery')} className="text-blue-900 hover:underline font-medium">Browse Gallery</button></div></header>
      <div className="text-center py-8"><span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">FREE TOOL</span><h1 className="text-4xl font-bold text-blue-900 mb-2" style={{ fontFamily: 'Bungee' }}>CREATE YOUR COVER</h1><p className="text-gray-600">Feature your plant in the Rousseau Review</p></div>
      <main className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-2">Plant Photo <span className="text-red-500">*</span></label><div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all">{photo ? <img src={photo} alt="" className="max-h-48 mx-auto rounded-lg" /> : <div className="text-gray-400"><Upload className="w-10 h-10 mx-auto mb-2" /><p className="text-sm">Click to upload your plant photo</p></div>}</div><input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" /></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label><p className="text-xs text-gray-500 mb-2">Appears on your cover (e.g., &quot;SARAH&apos;S MONSTERA&quot;)</p><input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g., Sarah" className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none" /></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-1">Plant Name</label><p className="text-xs text-gray-500 mb-2">What plant are you featuring?</p><input type="text" value={plantName} onChange={e => setPlantName(e.target.value)} placeholder="e.g., Monstera Deliciosa" className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none" /></div>
            <div className="mb-6 bg-amber-50 rounded-lg p-4"><label className="block text-sm font-semibold text-gray-700 mb-3">Light Zone <span className="text-red-500">*</span></label><label className="flex items-center gap-2 mb-3 cursor-pointer"><input type="checkbox" checked={hasWindow} onChange={e => setHasWindow(e.target.checked)} className="w-4 h-4 text-blue-900 rounded" /><Sun className="w-4 h-4 text-amber-500" /><span className="text-sm">Gets natural light from a window</span></label>{hasWindow && <div className="ml-6 mb-4"><p className="text-xs text-gray-500 mb-2">Which direction?</p><div className="flex flex-wrap gap-2">{DIRECTIONS.map(d => <button key={d} onClick={() => setDirection(d)} className={`px-4 py-2 text-sm rounded border transition-all ${direction === d ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-900'}`}>{d}</button>)}</div></div>}<label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" checked={growLights} onChange={e => setGrowLights(e.target.checked)} className="w-4 h-4 text-blue-900 rounded" /><Zap className="w-4 h-4 text-amber-500" /><span className="text-sm">Uses grow lights</span></label><p className="text-xs text-gray-500 mb-2">Select your light zone:</p><div className="space-y-2">{LIGHT_ZONES.map(z => <button key={z.id} onClick={() => setLightZone(z.id)} className={`w-full p-3 rounded-lg text-left transition-all ${lightZone === z.id ? `${z.bg} ${z.text}` : 'bg-white border border-gray-200 hover:border-blue-900'} ${z.border && lightZone !== z.id ? 'border border-gray-200' : ''}`}><div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${z.dot}`} /><span className="font-bold text-sm">{z.label}</span></div><p className={`text-xs mt-1 ${lightZone === z.id ? 'text-white/80' : 'text-gray-500'}`}>{z.desc}</p></button>)}</div></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-2">Average Temperature (°F)</label><div className="flex items-center gap-4"><input type="range" value={temp} onChange={e => setTemp(Number(e.target.value))} min={50} max={95} className="flex-1 accent-blue-900" /><span className="text-lg font-bold text-blue-900 w-16">{temp}°F</span></div></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-2">Average Humidity (%)</label><div className="flex items-center gap-4"><input type="range" value={humidity} onChange={e => setHumidity(Number(e.target.value))} min={20} max={90} step={5} className="flex-1 accent-blue-900" /><span className="text-lg font-bold text-blue-900 w-16">{humidity}%</span></div></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-3">Feeding Schedule</label><div className="space-y-2">{FEEDING.map((f, i) => <label key={f} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="feed" checked={feeding === i} onChange={() => setFeeding(i)} className="w-4 h-4 text-blue-900" /><span className="text-sm">{f}</span></label>)}</div></div>
            <div className="mb-6"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={foliar} onChange={e => setFoliar(e.target.checked)} className="w-4 h-4 text-blue-900 rounded" /><span className="text-sm">I foliar feed</span></label></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-1">What nutrients do you use?</label><p className="text-xs text-gray-500 mb-2">Only Rousseau products (Aroid Food, Healthy Leaf, Healthy Root) appear on covers</p><input type="text" value={nutrients} onChange={e => setNutrients(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none" /></div>
            <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-3">What&apos;s in your soil mix?</label><div className="grid grid-cols-2 gap-2">{SOIL.map(s => <button key={s} onClick={() => toggleSoil(s)} className={`flex items-center gap-2 p-2 rounded border text-left text-sm transition-all ${soil.includes(s) ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-gray-300'}`}>{soil.includes(s) && <Check className="w-4 h-4" />}<span>{s}</span></button>)}</div></div>
            <button onClick={generate} disabled={!photo || !plantName || loading} className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all" style={{ fontFamily: 'Bungee' }}>{loading ? 'Generating...' : 'Generate Cover'}</button>
            <p className="text-center text-sm text-gray-500 mt-4">Powered by <a href="https://rousseauplant.care" className="text-blue-900 hover:underline">Rousseau Plant Care</a></p>
          </div>
          <div><div className="bg-white rounded-xl shadow-lg p-6 sticky top-6"><h3 className="text-lg font-bold text-blue-900 mb-4" style={{ fontFamily: 'Bungee' }}>Preview</h3>{cover ? <div className="space-y-4"><img src={cover} alt="Cover" className="w-full rounded-lg shadow-xl" /><button onClick={download} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all">Download Cover</button></div> : <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"><div className="text-center text-gray-400"><Upload className="w-16 h-16 mx-auto mb-2" /><p>Your cover will appear here</p></div></div>}</div></div>
        </div>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
