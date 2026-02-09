import { useState, useRef, useEffect } from 'react';
import { Upload, Share2, Download, RotateCcw, ChevronLeft, Sparkles, Sun, Droplets, Thermometer, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from './lib/supabase';

// Types
interface CoverData {
  id?: string;
  plant_name: string;
  image_url: string;
  cover_data_url: string;
  light_zone: string;
  direction: string;
  has_grow_lights: boolean;
  temperature: number;
  humidity: number;
  nutrients: string;
  feeding_schedule: string;
  created_at?: string;
}

// Constants
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const LIGHT_ZONES = [
  { 
    id: 'high', 
    label: 'HIGH GROWTH CONDITIONS', 
    shortLabel: 'HIGH',
    description: 'Bright enough for plants to actively thrive',
    details: 'South or West facing windows with 6+ hours of direct sun. Ideal for most tropical plants.',
    color: '#22c55e', 
    bg: 'bg-green-500', 
    text: 'text-green-600',
    borderColor: '#22c55e'
  },
  { 
    id: 'low', 
    label: 'LOW GROWTH CONDITIONS', 
    shortLabel: 'LOW',
    description: 'Enough for survival + slow growth',
    details: 'East facing or bright indirect light. 3-6 hours of sun. Good for shade-tolerant plants.',
    color: '#eab308', 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-600',
    borderColor: '#eab308'
  },
  { 
    id: 'no', 
    label: 'NO GROWTH CONDITIONS', 
    shortLabel: 'NO',
    description: 'Functionally too dark for real growth',
    details: 'North facing or low light areas. Less than 3 hours of sun. Consider supplemental lighting.',
    color: '#9ca3af', 
    bg: 'bg-gray-400', 
    text: 'text-gray-500',
    borderColor: '#9ca3af'
  },
];

const DIRECTIONS = ['East', 'West', 'North', 'South'];

const FEEDING_SCHEDULES = [
  { value: 'every', label: 'Every watering' },
  { value: 'every_other', label: 'Every other watering' },
  { value: 'monthly', label: 'Once a month' },
  { value: 'sparingly', label: 'More sparingly' },
];

export default function App() {
  // View state
  const [view, setView] = useState<'form' | 'cover' | 'gallery'>('form');
  const [showZoneDetails, setShowZoneDetails] = useState(false);
  
  // Form state
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [plantName, setPlantName] = useState('');
  const [nutrients, setNutrients] = useState('');
  const [lightZone, setLightZone] = useState<'high' | 'low' | 'no'>('high');
  const [direction, setDirection] = useState('West');
  const [hasGrowLights, setHasGrowLights] = useState(false);
  const [temperature, setTemperature] = useState(72);
  const [humidity, setHumidity] = useState(55);
  const [feedingSchedule, setFeedingSchedule] = useState('every');
  
  // Output state
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<CoverData[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadGallery(); }, []);

  const loadGallery = async () => {
    const { data } = await supabase
      .from('covers')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setGallery(data);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      const r = new FileReader();
      r.onloadend = () => setPhoto(r.result as string);
      r.readAsDataURL(f);
    }
  };

  const generateCover = async () => {
    if (!photo || !plantName) return;
    setIsGenerating(true);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    
    // Magazine dimensions (4:5 ratio, Instagram-friendly)
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // Load and draw photo (full bleed)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = photo; });
    
    // Calculate cover crop (focus on center, maintain aspect)
    const imgRatio = img.width / img.height;
    const canvasRatio = W / H;
    let sx, sy, sWidth, sHeight;
    
    if (imgRatio > canvasRatio) {
      sHeight = img.height;
      sWidth = img.height * canvasRatio;
      sx = (img.width - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = img.width;
      sHeight = img.width / canvasRatio;
      sx = 0;
      sy = (img.height - sHeight) / 3; // Focus upper third
    }
    
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, W, H);

    // Apply subtle photo enhancement
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // Multi-layer gradient overlay for text readability
    // Top gradient for header
    const topGrad = ctx.createLinearGradient(0, 0, 0, 200);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    topGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 200);

    // Bottom gradient for content
    const bottomGrad = ctx.createLinearGradient(0, H - 550, 0, H);
    bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGrad.addColorStop(0.3, 'rgba(0,0,0,0.5)');
    bottomGrad.addColorStop(0.7, 'rgba(0,0,0,0.75)');
    bottomGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - 550, W, 550);

    // Decorative accent line
    const zoneInfo = LIGHT_ZONES.find(z => z.id === lightZone)!;
    ctx.strokeStyle = zoneInfo.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, H - 380);
    ctx.lineTo(120, H - 380);
    ctx.stroke();

    // Header - ROUSSEAU REVIEW
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROUSSEAU REVIEW', W / 2, 70);

    // Date
    const now = new Date();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillText(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`, W / 2, 100);

    // Plant name - Large, impactful
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 68px "Bungee", sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    
    const nameWords = plantName.toUpperCase().split(' ');
    let nameLine = '';
    let nameY = H - 340;
    const maxNameWidth = W - 120;
    
    for (const word of nameWords) {
      const test = nameLine + word + ' ';
      if (ctx.measureText(test).width > maxNameWidth && nameLine) {
        ctx.fillText(nameLine.trim(), 60, nameY);
        nameLine = word + ' ';
        nameY += 78;
      } else {
        nameLine = test;
      }
    }
    ctx.fillText(nameLine.trim(), 60, nameY);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Nutrients tag
    let currentY = nameY + 45;
    if (nutrients) {
      ctx.fillStyle = '#d97706';
      ctx.font = '700 20px Inter, sans-serif';
      ctx.fillText(`FUELED BY ${nutrients.toUpperCase()}`, 60, currentY);
      currentY += 45;
    }

    // Stats section - redesigned for better text fit
    const statsY = currentY;
    const cardWidth = 320;
    const cardHeight = 110;
    const cardGap = 20;

    // Light stat card - single line text
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(60, statsY, cardWidth, cardHeight);
    ctx.strokeStyle = zoneInfo.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(60, statsY, cardWidth, cardHeight);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText('LIGHT', 75, statsY + 22);
    
    ctx.fillStyle = zoneInfo.color;
    ctx.font = '800 26px Inter, sans-serif';
    ctx.fillText(zoneInfo.label, 75, statsY + 55);

    // Temperature card
    const tempX = 60 + cardWidth + cardGap;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(tempX, statsY, cardWidth, cardHeight);
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(tempX, statsY, cardWidth, cardHeight);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText('TEMPERATURE', tempX + 15, statsY + 22);
    
    ctx.fillStyle = '#d97706';
    ctx.font = '800 42px Inter, sans-serif';
    ctx.fillText(`${temperature}°`, tempX + 15, statsY + 72);
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillText('F', tempX + 15 + ctx.measureText(`${temperature}°`).width + 4, statsY + 72);

    // Humidity card
    const humX = 60 + (cardWidth + cardGap) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(humX, statsY, cardWidth, cardHeight);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(humX, statsY, cardWidth, cardHeight);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText('HUMIDITY', humX + 15, statsY + 22);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = '800 42px Inter, sans-serif';
    ctx.fillText(`${humidity}%`, humX + 15, statsY + 72);

    // Tags row
    let tagX = 60;
    const tagY = statsY + cardHeight + 18;
    const tagHeight = 38;
    
    // Direction tag
    const dirWidth = ctx.measureText(direction + '-facing window').width + 32;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(tagX, tagY, dirWidth, tagHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tagX, tagY, dirWidth, tagHeight);
    
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText(direction + '-facing window', tagX + 16, tagY + 24);
    tagX += dirWidth + 12;

    // Grow lights tag
    if (hasGrowLights) {
      const lightWidth = 140;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(tagX, tagY, lightWidth, tagHeight);
      ctx.strokeRect(tagX, tagY, lightWidth, tagHeight);
      
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '500 14px Inter, sans-serif';
      ctx.fillText('⚡ Grow lights', tagX + 16, tagY + 24);
      tagX += lightWidth + 12;
    }

    // Feeding schedule tag
    const feedingLabel = FEEDING_SCHEDULES.find(f => f.value === feedingSchedule)?.label || '';
    const feedWidth = ctx.measureText(feedingLabel).width + 32;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fillRect(tagX, tagY, feedWidth, tagHeight);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.strokeRect(tagX, tagY, feedWidth, tagHeight);
    
    ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText(feedingLabel, tagX + 16, tagY + 24);

    // Footer branding
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Powered by Rousseau Plant Care', W / 2, H - 25);

    const coverUrl = canvas.toDataURL('image/jpeg', 0.95);
    setGeneratedCover(coverUrl);
    setView('cover');
    setIsGenerating(false);

    // Save to database
    if (photoFile) {
      const fd = new FormData();
      fd.append('file', photoFile);
      fd.append('upload_preset', 'rousseau_covers');
      
      try {
        const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'dk7tsjufx';
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: fd
        });
        const data = await res.json();
        
        if (data.secure_url) {
          const { error } = await supabase.from('covers').insert({
            plant_name: plantName,
            image_url: data.secure_url,
            cover_data_url: coverUrl,
            light_zone: lightZone,
            direction,
            has_grow_lights: hasGrowLights,
            temperature,
            humidity,
            nutrients: nutrients || null,
            feeding_schedule: feedingSchedule,
          });
          
          if (error) {
            console.error('Supabase insert error:', error);
          } else {
            loadGallery();
          }
        }
      } catch (e) {
        console.error('Save failed:', e);
      }
    }
  };

  const downloadCover = () => {
    if (!generatedCover) return;
    const a = document.createElement('a');
    a.href = generatedCover;
    a.download = `rousseau-${plantName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.click();
  };

  const shareCover = async () => {
    if (!generatedCover || !navigator.share) return;
    
    try {
      const res = await fetch(generatedCover);
      const blob = await res.blob();
      const file = new File([blob], `rousseau-${plantName}.jpg`, { type: 'image/jpeg' });
      
      await navigator.share({
        title: `Rousseau Review — ${plantName}`,
        text: `Check out my plant cover for ${plantName}!`,
        files: [file],
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const resetForm = () => {
    setView('form');
    setGeneratedCover(null);
    setPhoto(null);
    setPhotoFile(null);
    setPlantName('');
    setNutrients('');
    setFeedingSchedule('every');
  };

  // Gallery View
  if (view === 'gallery') {
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-amber-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-bungee text-2xl text-rousseau-blue">ROUSSEAU</span>
              <span className="text-sm text-gray-500 uppercase tracking-wider">Plant Care</span>
            </div>
            <button onClick={() => setView('form')} className="text-rousseau-blue font-medium hover:underline">
              Create Cover
            </button>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="font-bungee text-3xl text-rousseau-blue mb-8">Community Gallery</h2>
          
          {gallery.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <p className="text-gray-400 text-lg">No covers yet. Be the first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img 
                    src={item.cover_data_url || item.image_url} 
                    alt={item.plant_name}
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bungee text-rousseau-blue text-sm truncate">{item.plant_name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Cover Result View
  if (view === 'cover' && generatedCover) {
    const zoneInfo = LIGHT_ZONES.find(z => z.id === lightZone)!;
    const feedingLabel = FEEDING_SCHEDULES.find(f => f.value === feedingSchedule)?.label;
    
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-amber-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
            <button onClick={() => setView('gallery')} className="flex items-center gap-2 text-rousseau-blue font-medium hover:underline">
              <ChevronLeft className="w-5 h-5" />
              Gallery
            </button>
            <span className="font-bungee text-xl text-rousseau-amber">ROUSSEAU</span>
            <button onClick={resetForm} className="text-rousseau-blue font-medium hover:underline">
              New Cover
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-8">
          {/* Generated Cover */}
          <div className="relative">
            <img 
              src={generatedCover} 
              alt="Generated cover" 
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button 
              onClick={shareCover}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-rousseau-blue text-rousseau-blue py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
            <button 
              onClick={downloadCover}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-rousseau-blue text-rousseau-blue py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Save
            </button>
            <button 
              onClick={resetForm}
              className="flex-1 flex items-center justify-center gap-2 bg-rousseau-amber text-white py-4 rounded-xl font-semibold hover:bg-amber-600 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              New
            </button>
          </div>

          {/* Care Summary Report */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-rousseau-amber" />
              <h3 className="font-bungee text-xl text-rousseau-blue">Care Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: `${zoneInfo.color}15`, border: `1px solid ${zoneInfo.color}40` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: zoneInfo.color }}>
                  <Sun className="w-5 h-5" />
                  <span className="font-semibold text-sm">Light</span>
                </div>
                <p className="text-gray-800 font-bold">{zoneInfo.label}</p>
                <p className="text-gray-500 text-sm">{direction}-facing window</p>
                {hasGrowLights && <p className="text-rousseau-amber text-sm mt-1">⚡ Grow lights</p>}
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Thermometer className="w-5 h-5" />
                  <span className="font-semibold text-sm">Temperature</span>
                </div>
                <p className="text-gray-800 font-bold text-2xl">{temperature}°F</p>
                <p className="text-gray-500 text-sm">Average range</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Droplets className="w-5 h-5" />
                  <span className="font-semibold text-sm">Humidity</span>
                </div>
                <p className="text-gray-800 font-bold text-2xl">{humidity}%</p>
                <p className="text-gray-500 text-sm">Relative humidity</p>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold text-sm">Feeding</span>
                </div>
                <p className="text-gray-800 font-bold">{feedingLabel}</p>
                <p className="text-gray-500 text-sm">Fertilizer schedule</p>
              </div>
            </div>
            
            {nutrients && (
              <div className="mt-4 bg-rousseau-amber/10 rounded-xl p-4 border border-rousseau-amber/30">
                <div className="flex items-center gap-2 text-rousseau-amber mb-1">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold text-sm">Nutrients</span>
                </div>
                <p className="text-gray-800 font-medium">{nutrients}</p>
              </div>
            )}
          </div>
        </main>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Form View
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bungee text-2xl text-rousseau-blue">ROUSSEAU</span>
            <span className="text-sm text-gray-500 uppercase tracking-wider">Plant Care</span>
          </div>
          <button onClick={() => setView('gallery')} className="text-rousseau-blue font-medium hover:underline">
            Browse Gallery
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full mb-3 tracking-wide">
            FREE TOOL
          </span>
          <h1 className="font-bungee text-3xl md:text-4xl text-rousseau-blue mb-2">
            CREATE YOUR COVER
          </h1>
          <p className="text-gray-600">Feature your plant in the Rousseau Review</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Plant Photo <span className="text-red-500">*</span>
            </label>
            <div 
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-rousseau-blue hover:bg-blue-50 transition-all"
            >
              {photo ? (
                <img src={photo} alt="Preview" className="max-h-56 mx-auto rounded-lg shadow-md" />
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">Click to upload your plant photo</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>

          {/* Plant Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Plant Name</label>
            <input 
              type="text" 
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g., Anthurium Warocqueanum"
              className="w-full p-4 border border-gray-300 rounded-xl focus:border-rousseau-blue focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Nutrients */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nutrients</label>
            <p className="text-xs text-gray-500 mb-2">Appears as "Fueled by..." on your cover</p>
            <input 
              type="text" 
              value={nutrients}
              onChange={(e) => setNutrients(e.target.value)}
              placeholder="e.g., Aroid Food, Healthy Root, Healthy Leaf"
              className="w-full p-4 border border-gray-300 rounded-xl focus:border-rousseau-blue focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Light Zone with expandable details */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Light Zone</label>
            <div className="space-y-2">
              {LIGHT_ZONES.map((zone) => (
                <div key={zone.id}>
                  <button
                    onClick={() => setLightZone(zone.id as any)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      lightZone === zone.id 
                        ? 'border-rousseau-blue bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${zone.bg}`} />
                    <div className="flex-1">
                      <span className={`font-bold ${zone.text}`}>{zone.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>
                    </div>
                  </button>
                  {lightZone === zone.id && (
                    <div className="mx-4 mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      {zone.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Light Zone Info Toggle */}
            <button 
              onClick={() => setShowZoneDetails(!showZoneDetails)}
              className="mt-3 flex items-center gap-2 text-rousseau-blue text-sm font-medium"
            >
              {showZoneDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showZoneDetails ? 'Hide light zone guide' : 'Learn about light zones'}
            </button>
            
            {showZoneDetails && (
              <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">Understanding Light Zones</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-green-600">High Growth:</span> South or West windows with 6+ hours of direct sun. Best for tropical plants like Monsteras, Philodendrons, and Anthuriums.
                  </div>
                  <div>
                    <span className="font-semibold text-yellow-600">Low Growth:</span> East windows or bright indirect light. 3-6 hours of sun. Good for Pothos, Snake Plants, and ZZ Plants.
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500">No Growth:</span> North windows or dim corners. Less than 3 hours of sun. Consider grow lights for these areas.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direction */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Window Direction</label>
            <div className="flex flex-wrap gap-2">
              {DIRECTIONS.map((dir) => (
                <button
                  key={dir}
                  onClick={() => setDirection(dir)}
                  className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                    direction === dir 
                      ? 'bg-rousseau-blue text-white border-rousseau-blue' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Grow Lights */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <input 
                type="checkbox" 
                checked={hasGrowLights}
                onChange={(e) => setHasGrowLights(e.target.checked)}
                className="w-5 h-5 accent-rousseau-blue"
              />
              <span className="text-gray-700">Uses grow lights</span>
            </label>
          </div>

          {/* Temperature */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Temperature: <span className="text-rousseau-blue text-lg">{temperature}°F</span>
            </label>
            <input 
              type="range" 
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              min="50" 
              max="95"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50°F</span>
              <span>95°F</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Humidity: <span className="text-blue-600 text-lg">{humidity}%</span>
            </label>
            <input 
              type="range" 
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              min="20" 
              max="90"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Feeding Schedule */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Feeding Schedule</label>
            <div className="space-y-2">
              {FEEDING_SCHEDULES.map((option) => (
                <label 
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    feedingSchedule === option.value 
                      ? 'border-rousseau-blue bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="feeding"
                    value={option.value}
                    checked={feedingSchedule === option.value}
                    onChange={(e) => setFeedingSchedule(e.target.value)}
                    className="w-5 h-5 accent-rousseau-blue"
                  />
                  <span className="text-gray-700 font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={generateCover}
            disabled={!photo || !plantName || isGenerating}
            className="w-full bg-rousseau-blue hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-5 rounded-xl transition-all font-bungee text-lg shadow-lg hover:shadow-xl"
          >
            {isGenerating ? 'Generating...' : 'Generate Cover'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Powered by <a href="https://rousseauplant.care" className="text-rousseau-blue hover:underline font-medium">Rousseau Plant Care</a>
          </p>
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
