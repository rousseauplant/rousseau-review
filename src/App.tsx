import { useState, useEffect, useRef } from 'react';
import { Camera, Droplets, Thermometer, Sun, Share2, Flag, ChevronDown, ChevronUp, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Slider } from './components/ui/slider';
import { Switch } from './components/ui/switch';
import { Card, CardContent } from './components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { supabase } from './lib/supabase';
import type { Cover, CoverInsert } from './types';

const LIGHT_ZONES = [
  {
    id: 'high',
    label: 'HIGH GROWTH CONDITIONS',
    description: 'South or West facing windows with 6+ hours of direct sun',
    icon: Sun,
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'low',
    label: 'LOW GROWTH CONDITIONS',
    description: 'East facing or bright indirect light, 3-6 hours of sun',
    icon: Sun,
    color: 'from-yellow-300 to-amber-400'
  },
  {
    id: 'no',
    label: 'NO GROWTH CONDITIONS',
    description: 'North facing or low light, less than 3 hours of sun',
    icon: Sun,
    color: 'from-slate-300 to-slate-400'
  }
];

const WATERING_INTERVALS = [
  { value: 'every', label: 'Every watering' },
  { value: 'every_other', label: 'Every other watering' },
  { value: 'monthly', label: 'Once a month' },
  { value: 'quarterly', label: 'Once a quarter' },
  { value: 'yearly', label: 'Once a year' }
];

const SOIL_MIXES = [
  'Rousseau Tropical Mix',
  'Rousseau Succulent Mix',
  'Rousseau Cactus Mix',
  'Rousseau Orchid Mix',
  'Rousseau African Violet Mix',
  'Rousseau Fern Mix',
  'Rousseau Bonsai Mix',
  'Rousseau Carnivorous Plant Mix',
  'Rousseau Seed Starting Mix',
  'Rousseau General Purpose Mix',
  'Custom Mix',
  'Potting Soil',
  'Coco Coir',
  'Perlite Mix',
  'Vermiculite Mix',
  'Peat Moss',
  'Compost',
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
  const [soilMix, setSoilMix] = useState(SOIL_MIXES[0]);
  const [foliarFeed, setFoliarFeed] = useState(false);
  const [nutrients, setNutrients] = useState('');
  const [photoFilter, setPhotoFilter] = useState(false);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [selectedCover, setSelectedCover] = useState<Cover | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
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
      .eq('hidden', false)
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

  const generateCover = async () => {
    if (!photo || !plantName || !lightZone) return;
    
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (magazine cover proportions)
      canvas.width = 800;
      canvas.height = 1000;

      // Load and draw plant photo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo;
      });

      // Draw photo (bottom portion)
      const photoHeight = canvas.height * 0.65;
      ctx.drawImage(img, 0, canvas.height - photoHeight, canvas.width, photoHeight);

      // Apply filter if enabled
      if (photoFilter) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.fillRect(0, canvas.height - photoHeight, canvas.width, photoHeight);
        ctx.restore();
      }

      // Draw header background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height - photoHeight + 50);

      // Draw gradient transition
      const gradient = ctx.createLinearGradient(0, canvas.height - photoHeight, 0, canvas.height - photoHeight + 100);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - photoHeight, canvas.width, 100);

      // Draw magazine title
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ROUSSEAU', canvas.width / 2, 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('REVIEW', canvas.width / 2, 115);

      // Draw month/year
      ctx.fillStyle = '#888888';
      ctx.font = '18px Arial';
      ctx.fillText(`${currentMonth} ${currentYear}`, canvas.width / 2, 150);

      // Draw plant name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'left';
      const maxWidth = canvas.width - 80;
      const words = plantName.toUpperCase().split(' ');
      let line = '';
      let y = 220;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 40, y);
          line = words[i] + ' ';
          y += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 40, y);

      // Draw care info
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('CARE GUIDE', 40, y + 60);

      ctx.fillStyle = '#cccccc';
      ctx.font = '16px Arial';
      const zoneLabel = LIGHT_ZONES.find(z => z.id === lightZone)?.label || '';
      ctx.fillText(`Light: ${zoneLabel}`, 40, y + 90);
      ctx.fillText(`Water: ${WATERING_INTERVALS.find(w => w.value === wateringInterval)?.label}`, 40, y + 115);
      ctx.fillText(`Temp: ${temperature}°F | Humidity: ${humidity}%`, 40, y + 140);
      ctx.fillText(`Soil: ${soilMix}`, 40, y + 165);
      if (foliarFeed) {
        ctx.fillText('Foliar feed recommended', 40, y + 190);
      }

      // Draw Rousseau branding
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by Rousseau Plant Care', canvas.width / 2, canvas.height - 20);

      const coverDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setGeneratedCover(coverDataUrl);

      // Upload to Cloudinary
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', 'rousseau_covers');
        formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.secure_url) {
          // Save to Supabase
          const coverData: CoverInsert = {
            plant_name: plantName,
            image_url: data.secure_url,
            light_zone: lightZone,
            watering_interval: wateringInterval,
            temperature,
            humidity,
            soil_mix: soilMix,
            foliar_feed: foliarFeed,
            nutrients: nutrients || null,
            cover_data_url: coverDataUrl,
          };

          await supabase.from('covers').insert(coverData as any);
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
          setShareDialogOpen(true);
        }
      } catch (error) {
        setShareDialogOpen(true);
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
      
      // Check report count
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact' })
        .eq('cover_id', selectedCover.id);
      
      if (count && count >= 2) {
        await supabase.from('covers').update({ hidden: true } as any).eq('id', selectedCover.id);
      }
      
      setReportDialogOpen(false);
      setReportReason('');
      setSelectedCover(null);
      fetchCovers();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rousseau Review</h1>
              <p className="text-xs text-neutral-400">Plant Cover Generator</p>
            </div>
          </div>
          
          <nav className="flex gap-2">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className={activeTab === 'create' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Create Cover
            </Button>
            <Button
              variant={activeTab === 'gallery' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('gallery')}
              className={activeTab === 'gallery' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Gallery
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'create' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6 space-y-6">
                  {/* Photo Upload */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Plant Photo</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                    >
                      {photo ? (
                        <img src={photo} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <div className="text-neutral-500">
                          <Camera className="w-12 h-12 mx-auto mb-2" />
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
                  <div className="flex items-center justify-between">
                    <Label className="text-neutral-300">Apply photo filter</Label>
                    <Switch checked={photoFilter} onCheckedChange={setPhotoFilter} />
                  </div>

                  {/* Plant Name */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Plant Name</Label>
                    <Input
                      value={plantName}
                      onChange={(e) => setPlantName(e.target.value)}
                      placeholder="e.g., Monstera Deliciosa"
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  {/* Light Zone */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Light Zone</Label>
                    <div className="space-y-2">
                      {LIGHT_ZONES.map((zone) => (
                        <button
                          key={zone.id}
                          onClick={() => setLightZone(zone.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            lightZone === zone.id
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-neutral-700 hover:border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <zone.icon className={`w-5 h-5 ${lightZone === zone.id ? 'text-green-500' : 'text-neutral-400'}`} />
                            <span className="font-medium">{zone.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowLightDetails(!showLightDetails)}
                      className="flex items-center gap-1 text-sm text-green-500 mt-2"
                    >
                      {showLightDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showLightDetails ? 'Hide details' : 'Show details'}
                    </button>
                    {showLightDetails && (
                      <div className="mt-2 p-3 bg-neutral-800 rounded-lg text-sm text-neutral-400">
                        {LIGHT_ZONES.map((zone) => (
                          <p key={zone.id} className="mb-1"><strong>{zone.label}:</strong> {zone.description}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Watering Interval */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Feeding Schedule</Label>
                    <select
                      value={wateringInterval}
                      onChange={(e) => setWateringInterval(e.target.value)}
                      className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
                    >
                      {WATERING_INTERVALS.map((interval) => (
                        <option key={interval.value} value={interval.value}>
                          {interval.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <Label className="text-neutral-300 mb-2 flex items-center gap-2">
                      <Thermometer className="w-4 h-4" />
                      Temperature: {temperature}°F
                    </Label>
                    <Slider
                      value={[temperature]}
                      onValueChange={(v) => setTemperature(v[0])}
                      min={50}
                      max={95}
                      step={1}
                      className="py-2"
                    />
                  </div>

                  {/* Humidity */}
                  <div>
                    <Label className="text-neutral-300 mb-2 flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      Humidity: {humidity}%
                    </Label>
                    <Slider
                      value={[humidity]}
                      onValueChange={(v) => setHumidity(v[0])}
                      min={20}
                      max={90}
                      step={5}
                      className="py-2"
                    />
                  </div>

                  {/* Soil Mix */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Soil Mix</Label>
                    <select
                      value={soilMix}
                      onChange={(e) => setSoilMix(e.target.value)}
                      className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
                    >
                      {SOIL_MIXES.map((mix) => (
                        <option key={mix} value={mix}>
                          {mix}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Foliar Feed */}
                  <div className="flex items-center justify-between">
                    <Label className="text-neutral-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Foliar feed recommended
                    </Label>
                    <Switch checked={foliarFeed} onCheckedChange={setFoliarFeed} />
                  </div>

                  {/* Nutrients */}
                  <div>
                    <Label className="text-neutral-300 mb-2 block">Nutrients (optional)</Label>
                    <Input
                      value={nutrients}
                      onChange={(e) => setNutrients(e.target.value)}
                      placeholder="e.g., Rousseau Plant Food, worm castings..."
                      className="bg-neutral-800 border-neutral-700"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateCover}
                    disabled={!photo || !plantName || !lightZone || isGenerating}
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Cover'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  {generatedCover ? (
                    <div className="space-y-4">
                      <img
                        src={generatedCover}
                        alt="Generated cover"
                        className="w-full rounded-lg shadow-xl"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleShare} className="flex-1 bg-green-600 hover:bg-green-700">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        <Button onClick={downloadCover} variant="outline" className="flex-1">
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/5] bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500">
                      <p>Your cover will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products Section */}
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-800/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-500" />
                    Step Up Your Plant Game
                  </h3>
                  <p className="text-neutral-400 mb-4">
                    Get the nutrients and tools you need from Rousseau Plant Care.
                  </p>
                  <a
                    href="https://rousseauplant.care"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-500 hover:text-green-400"
                  >
                    Visit Rousseau Plant Care
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Gallery */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Community Gallery</h2>
            {covers.length === 0 ? (
              <p className="text-neutral-500 text-center py-12">No covers yet. Be the first to create one!</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {covers.map((cover) => (
                  <Card key={cover.id} className="bg-neutral-900 border-neutral-800 overflow-hidden">
                    <img
                      src={cover.cover_data_url || cover.image_url}
                      alt={cover.plant_name}
                      className="w-full aspect-[4/5] object-cover cursor-pointer"
                      onClick={() => setSelectedCover(cover)}
                    />
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{cover.plant_name}</h3>
                      <p className="text-sm text-neutral-500">
                        {LIGHT_ZONES.find(z => z.id === cover.light_zone)?.label}
                      </p>
                      <button
                        onClick={() => setSelectedCover(cover)}
                        className="text-green-500 text-sm mt-2 hover:underline"
                      >
                        View Details
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle>Share Your Cover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-400">
              Your cover has been saved! Download it and share on social media with #RousseauReview
            </p>
            <Button onClick={downloadCover} className="w-full bg-green-600 hover:bg-green-700">
              Download Cover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cover Detail Dialog */}
      <Dialog open={!!selectedCover} onOpenChange={() => setSelectedCover(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCover?.plant_name}</DialogTitle>
          </DialogHeader>
          {selectedCover && (
            <div className="space-y-4">
              <img
                src={selectedCover.cover_data_url || selectedCover.image_url}
                alt={selectedCover.plant_name}
                className="w-full rounded-lg"
              />
              <div className="space-y-2 text-sm">
                <p><strong>Light:</strong> {LIGHT_ZONES.find(z => z.id === selectedCover.light_zone)?.label}</p>
                <p><strong>Watering:</strong> {WATERING_INTERVALS.find(w => w.value === selectedCover.watering_interval)?.label}</p>
                <p><strong>Temperature:</strong> {selectedCover.temperature}°F</p>
                <p><strong>Humidity:</strong> {selectedCover.humidity}%</p>
                <p><strong>Soil:</strong> {selectedCover.soil_mix}</p>
                {selectedCover.foliar_feed && <p><strong>Foliar feed:</strong> Recommended</p>}
                {selectedCover.nutrients && <p><strong>Nutrients:</strong> {selectedCover.nutrients}</p>}
              </div>
              <Button
                onClick={() => setReportDialogOpen(true)}
                variant="outline"
                className="w-full text-red-500 border-red-500/50 hover:bg-red-500/10"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Cover
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle>Report Cover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-neutral-400">Why are you reporting this cover?</p>
            <Input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason..."
              className="bg-neutral-800 border-neutral-700"
            />
            <div className="flex gap-2">
              <Button onClick={() => setReportDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={reportCover} className="flex-1 bg-red-600 hover:bg-red-700">
                Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
