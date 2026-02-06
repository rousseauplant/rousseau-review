import { useState, useEffect, useRef } from 'react';
import { Camera, Droplets, Thermometer, Sun, Share2, Flag, ChevronDown, ChevronUp, ShoppingBag, Sparkles, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Cover } from './types';

const LIGHT_ZONES = [
  {
    id: 'high',
    label: 'HIGH GROWTH CONDITIONS',
    description: 'South or West facing windows with 6+ hours of direct sun',
    color: '#f59e0b'
  },
  {
    id: 'low',
    label: 'LOW GROWTH CONDITIONS',
    description: 'East facing or bright indirect light, 3-6 hours of sun',
    color: '#eab308'
  },
  {
    id: 'no',
    label: 'NO GROWTH CONDITIONS',
    description: 'North facing or low light, less than 3 hours of sun',
    color: '#94a3b8'
  }
];

const WATERING_INTERVALS = [
  { value: 'every', label: 'Every watering' },
  { value: 'every_other', label: 'Every other watering' },
  { value: 'monthly', label: 'Once a month' },
  { value: 'quarterly', label: 'Once a quarter' },
  { value: 'yearly', label: 'Once a year' }
];

const SOIL_INGREDIENTS = [
  'Potting Soil',
  'Coco Coir',
  'Perlite',
  'Vermiculite',
  'Peat Moss',
  'Compost',
  'Worm Castings',
  'Orchid Bark',
  'Charcoal',
  'Sand',
  'Lava Rock',
  'Pumice',
  'Sphagnum Moss',
  'Leaf Mold',
  'Other'
];

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [plantName, setPlantName] = useState('');
  const [lightZone, setLightZone] = useState<string>('');
  const [showLightDetails, setShowLightDetails] = useState(false);
  const [wateringInterval, setWateringInterval] = useState('every');
  const [temperature, setTemperature] = useState(72);
  const [humidity, setHumidity] = useState(50);
  const [selectedSoilIngredients, setSelectedSoilIngredients] = useState<string[]>([]);
  const [foliarFeed, setFoliarFeed] = useState(false);
  const [nutrients, setNutrients] = useState('');
  const [photoFilter, setPhotoFilter] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [selectedCover, setSelectedCover] = useState<Cover | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentDate = new Date();
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchCovers();
  }, []);

  const fetchCovers = async () => {
    const { data, error } = await supabase
      .from('covers')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setCovers(data);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSoilIngredient = (ingredient: string) => {
    setSelectedSoilIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const generateCover = async () => {
    if (!photo || !plantName || !lightZone) return;
    
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Magazine cover dimensions (portrait)
      canvas.width = 600;
      canvas.height = 800;

      // Cream/beige background
      ctx.fillStyle = '#FEF4E0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Inner border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Load and draw plant photo (centered, large)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo;
      });

      // Calculate photo dimensions (fill width, maintain aspect)
      const photoWidth = canvas.width - 80;
      const photoHeight = (img.height / img.width) * photoWidth;
      const photoY = 200;
      
      // Draw photo with rounded corners effect (clip)
      ctx.save();
      ctx.beginPath();
      ctx.rect(40, photoY, photoWidth, Math.min(photoHeight, 350));
      ctx.clip();
      
      // Draw photo
      ctx.drawImage(img, 40, photoY, photoWidth, photoHeight);
      
      // Apply filter if enabled
      if (photoFilter) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(40, photoY, photoWidth, Math.min(photoHeight, 350));
      }
      ctx.restore();

      // Draw magazine title at top
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 42px "Bungee", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ROUSSEAU', canvas.width / 2, 70);
      
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 32px "Bungee", Arial, sans-serif';
      ctx.fillText('REVIEW', canvas.width / 2, 110);

      // Month/Year badge
      ctx.fillStyle = '#d97706';
      ctx.fillRect(canvas.width - 120, 130, 80, 30);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.fillText(`${currentMonth} ${currentYear}`, canvas.width - 80, 150);

      // Plant name below photo
      const nameY = photoY + Math.min(photoHeight, 350) + 50;
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 28px "Bungee", Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // Wrap plant name
      const maxWidth = canvas.width - 80;
      const words = plantName.toUpperCase().split(' ');
      let line = '';
      let y = nameY;
      
      for (let i = 0; i < words.length && y < nameY + 80; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[i] + ' ';
          y += 35;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Care info section
      const careY = y + 50;
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      ctx.fillText('CARE GUIDE', canvas.width / 2, careY);

      ctx.fillStyle = '#4b5563';
      ctx.font = '12px Inter, Arial, sans-serif';
      
      const zoneLabel = LIGHT_ZONES.find(z => z.id === lightZone)?.label || '';
      ctx.fillText(`Light: ${zoneLabel}`, canvas.width / 2, careY + 25);
      ctx.fillText(`Feed: ${WATERING_INTERVALS.find(w => w.value === wateringInterval)?.label}`, canvas.width / 2, careY + 42);
      ctx.fillText(`${temperature}°F | ${humidity}% Humidity`, canvas.width / 2, careY + 59);
      
      if (selectedSoilIngredients.length > 0) {
        const soilText = selectedSoilIngredients.slice(0, 3).join(', ') + (selectedSoilIngredients.length > 3 ? '...' : '');
        ctx.fillText(`Soil: ${soilText}`, canvas.width / 2, careY + 76);
      }
      
      if (foliarFeed) {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('Foliar Feed Recommended', canvas.width / 2, careY + 93);
      }

      // Footer branding
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px Inter, Arial, sans-serif';
      ctx.fillText('Powered by Rousseau Plant Care', canvas.width / 2, canvas.height - 40);

      const coverDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setGeneratedCover(coverDataUrl);

      // Upload to Cloudinary
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', 'rousseau_covers');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.secure_url) {
          await supabase.from('covers').insert({
            plant_name: plantName,
            image_url: data.secure_url,
            light_zone: lightZone,
            watering_interval: wateringInterval,
            temperature,
            humidity,
            soil_mix: selectedSoilIngredients.join(', '),
            foliar_feed: foliarFeed,
            nutrients: nutrients || null,
            cover_data_url: coverDataUrl,
          } as any);
          fetchCovers();
        }
      }
    } catch (error) {
      console.error('Error generating cover:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (generatedCover) {
      try {
        const response = await fetch(generatedCover);
        const blob = await response.blob();
        const file = new File([blob], `rousseau-review-${plantName}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Rousseau Review - ${plantName}`,
            text: `Check out my plant cover for ${plantName}!`,
            files: [file],
          });
        } else {
          setShowShareModal(true);
        }
      } catch (error) {
        setShowShareModal(true);
      }
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

  const reportCover = async () => {
    if (selectedCover && reportReason) {
      await supabase.from('reports').insert({
        cover_id: selectedCover.id,
        reason: reportReason,
      } as any);
      
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('cover_id', selectedCover.id);
      
      if (count && count >= 2) {
        const coversTable = supabase.from('covers') as any;
        await coversTable.update({ is_hidden: true }).eq('id', selectedCover.id);
      }
      
      setShowReportModal(false);
      setReportReason('');
      setSelectedCover(null);
      fetchCovers();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEF4E0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="border-b-4 border-green-500" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Bungee, sans-serif' }}>R</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Bungee, sans-serif' }}>Rousseau Review</h1>
              <p className="text-sm text-gray-600">Plant Cover Generator</p>
            </div>
          </div>
          
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Create Cover
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'gallery'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Gallery
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'create' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Plant Photo</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    {photo ? (
                      <img src={photo} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                      <div className="text-gray-500">
                        <Camera className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                        <p>Click to upload plant photo</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Photo Filter Toggle */}
                <div className="flex items-center justify-between mb-6 p-4 bg-amber-50 rounded-lg">
                  <label className="text-gray-700 font-medium">Apply vintage plant filter</label>
                  <button
                    onClick={() => setPhotoFilter(!photoFilter)}
                    className={`w-12 h-6 rounded-full transition-colors ${photoFilter ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${photoFilter ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Plant Name */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Plant Name</label>
                  <input
                    type="text"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    placeholder="e.g., Monstera Deliciosa"
                    className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Light Zone */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Light Zone</label>
                  <div className="space-y-2">
                    {LIGHT_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => setLightZone(zone.id)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          lightZone === zone.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="w-5 h-5" style={{ color: zone.color }} />
                          <span className="font-medium text-gray-800">{zone.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowLightDetails(!showLightDetails)}
                    className="flex items-center gap-1 text-sm text-green-600 mt-2 hover:underline"
                  >
                    {showLightDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showLightDetails ? 'Hide details' : 'Show details'}
                  </button>
                  {showLightDetails && (
                    <div className="mt-2 p-3 bg-amber-50 rounded-lg text-sm text-gray-600">
                      {LIGHT_ZONES.map((zone) => (
                        <p key={zone.id} className="mb-1"><strong>{zone.label}:</strong> {zone.description}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Watering Interval */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Feeding Schedule</label>
                  <select
                    value={wateringInterval}
                    onChange={(e) => setWateringInterval(e.target.value)}
                    className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                  >
                    {WATERING_INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Temperature */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-amber-500" />
                    Temperature: {temperature}°F
                  </label>
                  <input
                    type="range"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    min={50}
                    max={95}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50°F</span>
                    <span>95°F</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    Humidity: {humidity}%
                  </label>
                  <input
                    type="range"
                    value={humidity}
                    onChange={(e) => setHumidity(Number(e.target.value))}
                    min={20}
                    max={90}
                    step={5}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20%</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* Soil Mix Ingredients */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Soil Mix Ingredients</label>
                  <p className="text-sm text-gray-500 mb-3">Select all that apply:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SOIL_INGREDIENTS.map((ingredient) => (
                      <button
                        key={ingredient}
                        onClick={() => toggleSoilIngredient(ingredient)}
                        className={`p-2 rounded-lg border-2 text-sm text-left transition-all ${
                          selectedSoilIngredients.includes(ingredient)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-amber-200 hover:border-amber-300 text-gray-700'
                        }`}
                      >
                        {selectedSoilIngredients.includes(ingredient) && '✓ '}
                        {ingredient}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Foliar Feed */}
                <div className="flex items-center justify-between mb-6 p-4 bg-amber-50 rounded-lg">
                  <label className="text-gray-700 font-medium flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Foliar feed recommended
                  </label>
                  <button
                    onClick={() => setFoliarFeed(!foliarFeed)}
                    className={`w-12 h-6 rounded-full transition-colors ${foliarFeed ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${foliarFeed ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Nutrients */}
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Nutrients (optional)</label>
                  <input
                    type="text"
                    value={nutrients}
                    onChange={(e) => setNutrients(e.target.value)}
                    placeholder="e.g., Rousseau Plant Food, worm castings..."
                    className="w-full p-3 border-2 border-amber-200 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateCover}
                  disabled={!photo || !plantName || !lightZone || isGenerating}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg shadow-lg transition-all"
                  style={{ fontFamily: 'Bungee, sans-serif' }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Cover'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Bungee, sans-serif' }}>Preview</h3>
                {generatedCover ? (
                  <div className="space-y-4">
                    <img
                      src={generatedCover}
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
