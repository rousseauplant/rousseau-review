import { useState, useEffect, useRef } from 'react';
import { Upload, Sun, Zap, Check } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Cover } from './types';

const LIGHT_ZONES = [
  {
    id: 'high',
    label: 'HIGH GROWTH ZONE',
    description: 'Bright enough for plants to actively thrive',
    color: 'bg-blue-900',
    dotColor: 'bg-green-500'
  },
  {
    id: 'low',
    label: 'LOW GROWTH ZONE',
    description: 'Enough for survival + slow growth',
    color: 'bg-white',
    dotColor: 'bg-yellow-500',
    border: true
  },
  {
    id: 'no',
    label: 'NO GROWTH ZONE',
    description: 'Functionally too dark for real growth',
    color: 'bg-white',
    dotColor: 'bg-red-500',
    border: true
  }
];

const DIRECTIONS = ['East', 'West', 'North', 'South', 'Idk'];

const FEEDING_OPTIONS = [
  { value: 'every', label: 'Every watering' },
  { value: 'every_other', label: 'Every other watering' },
  { value: 'every_3rd', label: 'Every 3rd watering' },
  { value: 'monthly', label: 'Monthly' }
];

const SOIL_INGREDIENTS = [
  'Perlite', 'Pumice', 'Orchid Bark', 'Coco Coir', 'Coco Chunks',
  'Tree Fern Fiber', 'Horticultural Charcoal', 'Bio Char', 'Worm Castings',
  'Rice Hulls', 'LECA', 'Pon (Lechuza)', 'Zeolite', 'Fluval Stratum',
  'Regular Potting Mix', 'Sphagnum Moss', 'Lava Rock', 'Vermiculite'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userName, setUserName] = useState('');
  const [plantName, setPlantName] = useState('');
  const [hasWindowLight, setHasWindowLight] = useState(true);
  const [direction, setDirection] = useState<string>('South');
  const [usesGrowLights, setUsesGrowLights] = useState(false);
  const [lightZone, setLightZone] = useState<string>('high');
  const [temperature, setTemperature] = useState(72);
  const [humidity, setHumidity] = useState(60);
  const [feedingSchedule, setFeedingSchedule] = useState('every');
  const [foliarFeed, setFoliarFeed] = useState(false);
  const [nutrients, setNutrients] = useState('');
  const [selectedSoil, setSelectedSoil] = useState<string[]>([]);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [covers, setCovers] = useState<Cover[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchCovers();
  }, []);

  const fetchCovers = async () => {
    const { data } = await supabase
      .from('covers')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    if (data) setCovers(data);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleSoil = (ingredient: string) => {
    setSelectedSoil(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const generateCover = async () => {
    if (!photo || !plantName) return;
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 500;
      canvas.height = 700;

      // Cream background
      ctx.fillStyle = '#FEF4E0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green outer border
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      // Inner amber border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Title
      ctx.fillStyle = '#1e3a5f';
      ctx.font = 'bold 32px "Bungee", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ROUSSEAU', canvas.width / 2, 55);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 24px "Bungee", Arial, sans-serif';
      ctx.fillText('REVIEW', canvas.width / 2, 85);

      // Load and draw photo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo;
      });

      const photoY = 105;
      const photoHeight = 320;
      const photoWidth = canvas.width - 60;
      
      ctx.drawImage(img, 30, photoY, photoWidth, photoHeight);

      // Plant name
      const displayName = userName 
        ? `${userName.toUpperCase()}'S ${plantName.toUpperCase()}`
        : plantName.toUpperCase();
      
      ctx.fillStyle = '#1e3a5f';
      ctx.font = 'bold 22px "Bungee", Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // Wrap text
      const maxWidth = canvas.width - 60;
      const words = displayName.split(' ');
      let line = '';
      let y = photoY + photoHeight + 40;
      
      for (let i = 0; i < words.length && y < photoY + photoHeight + 100; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Care info
      const careY = y + 35;
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillText('CARE GUIDE', canvas.width / 2, careY);

      ctx.fillStyle = '#4b5563';
      ctx.font = '11px Inter, Arial, sans-serif';
      
      const zoneInfo = LIGHT_ZONES.find(z => z.id === lightZone);
      ctx.fillText(`${zoneInfo?.label} | ${temperature}°F | ${humidity}% Humidity`, canvas.width / 2, careY + 18);
      ctx.fillText(`Feed: ${FEEDING_OPTIONS.find(f => f.value === feedingSchedule)?.label}`, canvas.width / 2, careY + 32);

      if (selectedSoil.length > 0) {
        const soilText = selectedSoil.slice(0, 3).join(', ') + (selectedSoil.length > 3 ? '...' : '');
        ctx.fillText(`Soil: ${soilText}`, canvas.width / 2, careY + 46);
      }

      if (foliarFeed) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('Foliar Feed Recommended', canvas.width / 2, careY + 60);
      }

      // Footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px Inter, Arial, sans-serif';
      ctx.fillText('Powered by Rousseau Plant Care', canvas.width / 2, canvas.height - 25);

      const coverDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setGeneratedCover(coverDataUrl);

      // Save to Supabase
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', 'rousseau_covers');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );

        const data = await response.json();
        
        if (data.secure_url) {
          await supabase.from('covers').insert({
            plant_name: plantName,
            image_url: data.secure_url,
            light_zone: lightZone,
            watering_interval: feedingSchedule,
            temperature,
            humidity,
            soil_mix: selectedSoil.join(', '),
            foliar_feed: foliarFeed,
            nutrients: nutrients || null,
            cover_data_url: coverDataUrl,
          } as any);
          fetchCovers();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCover = () => {
    if (generatedCover) {
      const link = document.createElement('a');
      link.href = generatedCover;
      link.download = `rousseau-review-${plantName}.jpg`;
      link.click();
    }
  };

  if (activeTab === 'gallery') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FEF4E0' }}>
        {/* Header */}
        <header className="bg-white border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Bungee, sans-serif', color: '#1e3a5f' }}>ROUSSEAU</span>
              <span className="text-sm text-gray-600">PLANT CARE</span>
            </div>
            <button 
              onClick={() => setActiveTab('create')}
              className="text-blue-900 font-medium hover:underline"
            >
              Create Cover
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-8" style={{ fontFamily: 'Bungee, sans-serif' }}>Community Gallery</h2>
          {covers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">No covers yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {covers.map((cover) => (
                <div key={cover.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <img src={cover.cover_data_url || cover.image_url} alt={cover.plant_name} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-blue-900" style={{ fontFamily: 'Bungee, sans-serif' }}>{cover.plant_name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEF4E0' }}>
      {/* Header */}
      <header className="bg-white border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ fontFamily: 'Bungee, sans-serif', color: '#1e3a5f' }}>ROUSSEAU</span>
            <span className="text-sm text-gray-600">PLANT CARE</span>
          </div>
          <button 
            onClick={() => setActiveTab('gallery')}
            className="text-blue-900 font-medium hover:underline"
          >
            Browse Gallery
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-8">
        <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
          FREE TOOL
        </span>
        <h1 className="text-4xl font-bold text-blue-900 mb-2" style={{ fontFamily: 'Bungee, sans-serif' }}>
          CREATE YOUR COVER
        </h1>
        <p className="text-gray-600">Feature your plant in the Rousseau Review</p>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plant Photo <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all"
              >
                {photo ? (
                  <img src={photo} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">Click to upload your plant photo</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Your Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
              <p className="text-xs text-gray-500 mb-2">Appears on your cover (e.g., &quot;SARAH&apos;S MONSTERA&quot;)</p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Sarah"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none"
              />
            </div>

            {/* Plant Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Plant Name</label>
              <p className="text-xs text-gray-500 mb-2">What plant are you featuring?</p>
              <input
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="e.g., Monstera Deliciosa"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none"
              />
            </div>

            {/* Light Zone */}
            <div className="mb-6 bg-amber-50 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Light Zone <span className="text-red-500">*</span>
              </label>
              
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWindowLight}
                  onChange={(e) => setHasWindowLight(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded"
                />
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm">Gets natural light from a window</span>
              </label>

              {hasWindowLight && (
                <div className="ml-6 mb-4">
                  <p className="text-xs text-gray-500 mb-2">Which direction?</p>
                  <div className="flex flex-wrap gap-2">
                    {DIRECTIONS.map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setDirection(dir)}
                        className={`px-4 py-2 text-sm rounded border transition-all ${
                          direction === dir
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-900'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usesGrowLights}
                  onChange={(e) => setUsesGrowLights(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded"
                />
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm">Uses grow lights</span>
              </label>

              <p className="text-xs text-gray-500 mb-2">Select your light zone:</p>
              <div className="space-y-2">
                {LIGHT_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setLightZone(zone.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      lightZone === zone.id
                        ? `${zone.color} text-white`
                        : 'bg-white border border-gray-200 hover:border-blue-900'
                    } ${zone.border && lightZone !== zone.id ? 'border border-gray-200' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${zone.dotColor}`} />
                      <span className="font-bold text-sm">{zone.label}</span>
                    </div>
                    <p className={`text-xs mt-1 ${lightZone === zone.id ? 'text-white/80' : 'text-gray-500'}`}>
                      {zone.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Average Temperature (°F)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  min={50}
                  max={95}
                  className="flex-1 accent-blue-900"
                />
                <span className="text-lg font-bold text-blue-900 w-16">{temperature}°F</span>
              </div>
            </div>

            {/* Humidity */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Average Humidity (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  min={20}
                  max={90}
                  step={5}
                  className="flex-1 accent-blue-900"
                />
                <span className="text-lg font-bold text-blue-900 w-16">{humidity}%</span>
              </div>
            </div>

            {/* Feeding Schedule */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Feeding Schedule</label>
              <div className="space-y-2">
                {FEEDING_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="feeding"
                      value={option.value}
                      checked={feedingSchedule === option.value}
                      onChange={(e) => setFeedingSchedule(e.target.value)}
                      className="w-4 h-4 text-blue-900"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Foliar Feed */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={foliarFeed}
                  onChange={(e) => setFoliarFeed(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded"
                />
                <span className="text-sm">I foliar feed</span>
              </label>
            </div>

            {/* Nutrients */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">What nutrients do you use?</label>
              <p className="text-xs text-gray-500 mb-2">
                Only Rousseau products (Aroid Food, Healthy Leaf, Healthy Root) appear on covers
              </p>
              <input
                type="text"
                value={nutrients}
                onChange={(e) => setNutrients(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-900 focus:outline-none"
              />
            </div>

            {/* Soil Mix */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">What&apos;s in your soil mix?</label>
              <div className="grid grid-cols-2 gap-2">
                {SOIL_INGREDIENTS.map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => toggleSoil(ingredient)}
                    className={`flex items-center gap-2 p-2 rounded border text-left text-sm transition-all ${
                      selectedSoil.includes(ingredient)
                        ? 'border-blue-900 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedSoil.includes(ingredient) && <Check className="w-4 h-4" />}
                    <span>{ingredient}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCover}
              disabled={!photo || !plantName || isGenerating}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all"
              style={{ fontFamily: 'Bungee, sans-serif' }}
            >
              {isGenerating ? 'Generating...' : 'Generate Cover'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Powered by <a href="https://rousseauplant.care" className="text-blue-900 hover:underline">Rousseau Plant Care</a>
            </p>
          </div>

          {/* Preview */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4" style={{ fontFamily: 'Bungee, sans-serif' }}>
                Preview
              </h3>
              {generatedCover ? (
                <div className="space-y-4">
                  <img src={generatedCover} alt="Generated cover" className="w-full rounded-lg shadow-xl" />
                  <button
                    onClick={downloadCover}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Download Cover
                  </button>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-400">
                    <Upload className="w-16 h-16 mx-auto mb-2" />
                    <p>Your cover will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
           alt="Generated cover"
                      className="w-full rounded-lg shadow-xl"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleShare}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Share
                      </button>
                      <button 
                        onClick={downloadCover}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-amber-50 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed border-amber-200">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-2 text-amber-300" />
                      <p>Your cover will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Products Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2" style={{ fontFamily: 'Bungee, sans-serif' }}>
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                  Step Up Your Plant Game
                </h3>
                <p className="text-gray-600 mb-4">
                  Get the nutrients and tools you need from Rousseau Plant Care.
                </p>
                <a
                  href="https://rousseauplant.care"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
                >
                  Visit Rousseau Plant Care
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Gallery */
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Bungee, sans-serif' }}>Community Gallery</h2>
            {covers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg border-2 border-amber-200">
                <Camera className="w-16 h-16 mx-auto mb-4 text-amber-300" />
                <p className="text-gray-500">No covers yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {covers.map((cover) => (
                  <div key={cover.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-amber-200 hover:border-green-400 transition-all">
                    <img
                      src={cover.cover_data_url || cover.image_url}
                      alt={cover.plant_name}
                      className="w-full aspect-[3/4] object-cover cursor-pointer"
                      onClick={() => setSelectedCover(cover)}
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 truncate" style={{ fontFamily: 'Bungee, sans-serif' }}>{cover.plant_name}</h3>
                      <p className="text-sm text-gray-500">
                        {LIGHT_ZONES.find(z => z.id === cover.light_zone)?.label}
                      </p>
                      <button
                        onClick={() => setSelectedCover(cover)}
                        className="text-green-600 text-sm mt-2 hover:underline font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Bungee, sans-serif' }}>Share Your Cover</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Your cover has been saved! Download it and share on social media with <span className="text-green-600 font-semibold">#RousseauReview</span>
            </p>
            <button 
              onClick={downloadCover}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
            >
              Download Cover
            </button>
          </div>
        </div>
      )}

      {/* Cover Detail Modal */}
      {selectedCover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Bungee, sans-serif' }}>{selectedCover.plant_name}</h3>
              <button onClick={() => setSelectedCover(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <img
                src={selectedCover.cover_data_url || selectedCover.image_url}
                alt={selectedCover.plant_name}
                className="w-full rounded-lg"
              />
              <div className="space-y-2 text-sm bg-amber-50 p-4 rounded-lg">
                <p><strong className="text-gray-700">Light:</strong> {LIGHT_ZONES.find(z => z.id === selectedCover.light_zone)?.label}</p>
                <p><strong className="text-gray-700">Watering:</strong> {WATERING_INTERVALS.find(w => w.value === selectedCover.watering_interval)?.label}</p>
                <p><strong className="text-gray-700">Temperature:</strong> {selectedCover.temperature}°F</p>
                <p><strong className="text-gray-700">Humidity:</strong> {selectedCover.humidity}%</p>
                <p><strong className="text-gray-700">Soil:</strong> {selectedCover.soil_mix}</p>
                {selectedCover.foliar_feed && <p><strong className="text-gray-700">Foliar feed:</strong> Recommended</p>}
                {selectedCover.nutrients && <p><strong className="text-gray-700">Nutrients:</strong> {selectedCover.nutrients}</p>}
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full text-red-500 border-2 border-red-200 hover:bg-red-50 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Report Cover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Bungee, sans-serif' }}>Report Cover</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Why are you reporting this cover?</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-green-500 focus:outline-none mb-4 h-24 resize-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={reportCover}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
