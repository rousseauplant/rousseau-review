import { useState, useRef, useEffect } from 'react';
import { Upload, Zap, Droplets, Thermometer, RefreshCw, RotateCcw, Sparkles, Share2, Sun, Wind, ChevronLeft, Download, ExternalLink, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCovers } from '@/hooks/useCovers';
import type { Cover, LightZone, WateringInterval, WindowDirection } from '@/types';
// Shopify login disabled for now - anonymous only
import './App.css';

interface PlantData {
  photo: string | null;
  userName: string;
  plantName: string;
  lightZone: LightZone;
  usesGrowLight: boolean;
  getsNaturalLight: boolean;
  windowDirection: WindowDirection;
  wateringInterval: WateringInterval;
  temperature: number;
  humidity: number;
  applyPhotoFilter: boolean;
  soilComponents: string[];
  usesFoliarFeed: boolean;
  nutrients: string;
}

const defaultData: PlantData = {
  photo: null,
  userName: '',
  plantName: '',
  lightZone: 'high',
  usesGrowLight: false,
  getsNaturalLight: true,
  windowDirection: 'south',
  wateringInterval: 'every-other',
  temperature: 72,
  humidity: 60,
  applyPhotoFilter: true,
  soilComponents: [],
  usesFoliarFeed: false,
  nutrients: '',
};

const lightZoneInfo = {
  high: {
    label: 'HIGH GROWTH',
    coverLabel: 'HIGH GROWTH CONDITIONS',
    fullLabel: 'HIGH GROWTH ZONE',
    description: 'Bright enough for plants to actively thrive',
    detail: 'Plants use water faster → soil dries faster → watering is more forgiving. Supports bigger goals like larger leaves and faster growth.',
    fc: '200–1500 FC',
    par: '40–400 PPFD',
    dli: '1.75–17.5 DLI',
    color: '#22c55e',
  },
  low: {
    label: 'LOW GROWTH',
    coverLabel: 'LOW GROWTH CONDITIONS',
    fullLabel: 'LOW GROWTH ZONE',
    description: 'Enough for survival + slow growth',
    detail: 'Plants drink slowly → soil stays wet longer → root issues more likely without proper system. Pot size, soil, and airflow matter more.',
    fc: '20–200 FC',
    par: '4–40 PPFD',
    dli: '0.2–1.75 DLI',
    color: '#eab308',
  },
  no: {
    label: 'NO GROWTH',
    coverLabel: 'NO GROWTH CONDITIONS',
    fullLabel: 'NO GROWTH ZONE',
    description: 'Functionally too dark for real growth',
    detail: 'Best treated as "display/temporary holding," not a growth environment. Consider adding a grow light or moving to a brighter location.',
    fc: '0–20 FC',
    par: '0–4 PPFD',
    dli: '0–0.2 DLI',
    color: '#ef4444',
  },
};

const wateringIntervalLabels: Record<WateringInterval, string> = {
  'every': 'Every watering',
  'every-other': 'Every other watering',
  'every-third': 'Every 3rd watering',
  'monthly': 'Monthly',
};

const windowDirectionLabels: Record<WindowDirection, string> = {
  'east': 'East-facing',
  'west': 'West-facing',
  'north': 'North-facing',
  'south': 'South-facing',
  'idk': 'Not sure',
};

const soilOptions = [
  { id: 'perlite', label: 'Perlite' },
  { id: 'pumice', label: 'Pumice' },
  { id: 'orchid-bark', label: 'Orchid Bark' },
  { id: 'coco-coir', label: 'Coco Coir' },
  { id: 'coco-chunks', label: 'Coco Chunks' },
  { id: 'tree-fern', label: 'Tree Fern Fiber' },
  { id: 'charcoal', label: 'Horticultural Charcoal' },
  { id: 'bio-char', label: 'Bio Char' },
  { id: 'worm-castings', label: 'Worm Castings' },
  { id: 'rice-hulls', label: 'Rice Hulls' },
  { id: 'leca', label: 'LECA' },
  { id: 'pon', label: 'Pon (Lechuza)' },
  { id: 'zeolite', label: 'Zeolite' },
  { id: 'fluval-stratum', label: 'Fluval Stratum' },
  { id: 'potting-mix', label: 'Regular Potting Mix' },
  { id: 'sphagnum', label: 'Sphagnum Moss' },
  { id: 'lava-rock', label: 'Lava Rock' },
  { id: 'vermiculite', label: 'Vermiculite' },
];

const rousseauProducts = [
  { name: 'Pendant Grow Light', description: 'Stylish, powerful grow lighting for any space', price: '$140', link: 'https://rousseauplant.care/products/pendant-grow-light-white-with-wall-timer' },
  { name: 'Starter Moss Pole', description: 'Support for climbing plants to reach their potential', price: '$35', link: 'https://rousseauplant.care/products/starter-moss-pole-june-2024-edition-1' },
  { name: 'Aroid Food', description: 'Complete nutrition for stunning growth', price: '$27', link: 'https://rousseauplant.care/collections/nutrients/products/plant-elixir-macros-micros-microbes-more' },
  { name: 'Curved Wall Mount', description: 'Elegant display for your grow lights', price: '$50', link: 'https://rousseauplant.care/products/curved-wood-wall-mount-2024' },
];

const rousseauNutrients = ['aroid food', 'healthy leaf', 'healthy root'];

type View = 'form' | 'cover' | 'gallery';

function App() {
  const [plantData, setPlantData] = useState<PlantData>(defaultData);
  const [view, setView] = useState<View>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [showZoneDetails, setShowZoneDetails] = useState(false);
  const [savedCover, setSavedCover] = useState<Cover | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCoverId, setReportingCoverId] = useState<string | null>(null);
  
  const { covers, loading, hasMore, fetchCovers, saveCover, report } = useCovers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverTopRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Load covers when gallery is viewed
  useEffect(() => {
    if (view === 'gallery' && covers.length === 0) {
      fetchCovers(true);
    }
  }, [view, covers.length, fetchCovers]);

  // Scroll to cover when view changes to cover
  useEffect(() => {
    if (view === 'cover' && coverTopRef.current) {
      setTimeout(() => {
        coverTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [view]);

  // Shopify login disabled - anonymous only for now

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlantData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCover = async () => {
    if (!plantData.photo) return;
    
    setIsGenerating(true);
    
    const cover = await saveCover({
      userName: plantData.userName,
      plantName: plantData.plantName,
      photo: plantData.photo,
      lightZone: plantData.lightZone,
      getsNaturalLight: plantData.getsNaturalLight,
      windowDirection: plantData.windowDirection,
      usesGrowLight: plantData.usesGrowLight,
      temperature: plantData.temperature,
      humidity: plantData.humidity,
      wateringInterval: plantData.wateringInterval,
      usesFoliarFeed: plantData.usesFoliarFeed,
      nutrients: plantData.nutrients,
      soilComponents: plantData.soilComponents,
    });
    
    setIsGenerating(false);
    
    if (cover) {
      setSavedCover(cover);
      setView('cover');
    } else {
      alert('Failed to save cover. Please try again.');
    }
  };

  const resetForm = () => {
    setPlantData(defaultData);
    setView('form');
    setShareMessage('');
    setShowZoneDetails(false);
    setSavedCover(null);
  };

  const handleShare = async () => {
    const cover = savedCover || covers[0];
    if (!cover) return;
    
    const shareText = `Check out my plant cover on Rousseau Review!\n\n${getCoverTitle(cover)}\nLight: ${lightZoneInfo[cover.light_zone].label}\nhttps://review.rousseauplant.care`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${getCoverTitle(cover)} - Rousseau Review`,
          text: shareText,
          url: `https://review.rousseauplant.care`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareMessage('Copied to clipboard!');
        setTimeout(() => setShareMessage(''), 3000);
      } catch (err) {
        setShareMessage('Unable to share. Try taking a screenshot!');
        setTimeout(() => setShareMessage(''), 3000);
      }
    }
  };

  const handleDownload = () => {
    alert('To save your cover, take a screenshot! On mobile: press volume + power. On desktop: use your screenshot tool.');
  };

  const getCoverTitle = (cover?: Cover) => {
    const c = cover || savedCover;
    if (!c) return 'PLANT COLLECTION';
    if (c.user_name && c.plant_name) {
      return `${c.user_name}'S ${c.plant_name}`;
    } else if (c.user_name) {
      return `${c.user_name}'S PLANTS`;
    } else if (c.plant_name) {
      return c.plant_name;
    }
    return 'PLANT COLLECTION';
  };

  const isRousseauNutrient = (nutrients?: string) => {
    if (!nutrients) return false;
    const nutrientLower = nutrients.toLowerCase().trim();
    return rousseauNutrients.some(n => nutrientLower.includes(n));
  };

  const toggleSoilComponent = (componentId: string) => {
    setPlantData(prev => ({
      ...prev,
      soilComponents: prev.soilComponents.includes(componentId)
        ? prev.soilComponents.filter(c => c !== componentId)
        : [...prev.soilComponents, componentId]
    }));
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const handleReport = async (coverId: string) => {
    setReportingCoverId(coverId);
    setReportDialogOpen(true);
  };

  const submitReport = async () => {
    if (!reportingCoverId) return;
    const success = await report(reportingCoverId);
    if (success) {
      alert('Thank you for reporting. This cover has been flagged for review.');
    }
    setReportDialogOpen(false);
    setReportingCoverId(null);
  };

  const loadMoreCovers = () => {
    fetchCovers();
  };

  // Cover view
  if (view === 'cover' && savedCover) {
    const cover = savedCover;
    return (
      <div className="min-h-screen bg-[#FEF4E0]">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-[#FEF4E0]/90 backdrop-blur-sm border-b border-[#e8dcc8]">
          <button onClick={() => setView('gallery')} className="flex items-center gap-2 text-[#375484] hover:text-[#d97706] transition-colors text-sm">
            <ChevronLeft size={18} /> Browse Gallery
          </button>
          <a href="https://rousseauplant.care" target="_blank" rel="noopener noreferrer">
            <img src="/logo.png" alt="Rousseau" className="h-6 w-auto" />
          </a>
          <button onClick={resetForm} className="text-[#375484] hover:text-[#d97706] transition-colors text-sm">
            New Cover
          </button>
        </nav>

        <div className="pt-20 pb-16 px-4">
          {/* Magazine Cover */}
          <div ref={coverTopRef} className="max-w-md mx-auto mb-8">
            <div className="relative aspect-[3/4] bg-[#1a1a1a] overflow-hidden shadow-2xl rounded-lg" id="cover-image">
              <img 
                src={cover.photo_url} 
                alt="Plant" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white/50 text-[9px] tracking-[0.4em]">ROUSSEAU REVIEW</p>
                <p className="text-white/30 text-[8px] tracking-[0.3em] mt-0.5">{getCurrentMonthYear()}</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-white font-black text-3xl sm:text-4xl leading-[0.9] tracking-tight uppercase mb-1">
                  {getCoverTitle(cover)}
                </h1>
                
                {isRousseauNutrient(cover.nutrients) && (
                  <p className="text-[#d97706] text-xs font-bold uppercase tracking-wider mb-3">
                    Fueled by {cover.nutrients}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded p-2 border-l-2" style={{ borderLeftColor: lightZoneInfo[cover.light_zone].color }}>
                    <p className="text-white/50 text-[8px] uppercase tracking-wider">Light</p>
                    <p className="font-bold text-[9px] uppercase leading-tight mt-0.5" style={{ color: lightZoneInfo[cover.light_zone].color }}>
                      {lightZoneInfo[cover.light_zone].coverLabel}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded p-2 border-l-2 border-[#d97706]">
                    <p className="text-white/50 text-[8px] uppercase tracking-wider">Temp</p>
                    <p className="text-white font-bold text-[10px]">{cover.temperature}°F</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded p-2 border-l-2 border-[#3b82f6]">
                    <p className="text-white/50 text-[8px] uppercase tracking-wider">Humidity</p>
                    <p className="text-white font-bold text-[10px]">{cover.humidity}%</p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {cover.gets_natural_light && (
                    <span className="bg-white/10 text-white/60 text-[8px] px-2 py-0.5 rounded-full">
                      {windowDirectionLabels[cover.window_direction || 'idk']}
                    </span>
                  )}
                  {cover.uses_grow_light && (
                    <span className="bg-white/10 text-white/60 text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap size={8} /> Grow lights
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mb-6">
            <Button onClick={handleShare} variant="outline" className="border-[#375484] text-[#375484]">
              <Share2 size={16} className="mr-2" /> Share
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-[#375484] text-[#375484]">
              <Download size={16} className="mr-2" /> Save
            </Button>
            <Button onClick={resetForm} className="bg-[#d97706] hover:bg-[#b45309] text-white">
              <RotateCcw size={16} className="mr-2" /> New Cover
            </Button>
          </div>
          
          {shareMessage && (
            <p className="text-center text-[#d97706] text-sm mb-8">{shareMessage}</p>
          )}

          {/* Growing Parameters Summary */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-[#e8dcc8]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#375484] font-['Bungee'] text-lg">Growing Parameters</h2>
                <button 
                  onClick={() => setShowZoneDetails(!showZoneDetails)}
                  className="text-[#d97706] text-sm hover:underline flex items-center gap-1"
                >
                  {showZoneDetails ? 'Hide details' : 'Learn more'}
                  {showZoneDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {showZoneDetails && (
                <div className="mb-4 space-y-3">
                  {(['high', 'low', 'no'] as LightZone[]).map((zone) => (
                    <div 
                      key={zone}
                      className="p-3 rounded-lg border-l-4"
                      style={{ 
                        backgroundColor: `${lightZoneInfo[zone].color}10`,
                        borderLeftColor: lightZoneInfo[zone].color 
                      }}
                    >
                      <p className="font-bold text-sm" style={{ color: lightZoneInfo[zone].color }}>
                        {lightZoneInfo[zone].fullLabel}
                      </p>
                      <p className="text-[#375484] text-xs mt-1">{lightZoneInfo[zone].detail}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-[#375484]/60">
                        <span>{lightZoneInfo[zone].fc}</span>
                        <span>•</span>
                        <span>{lightZoneInfo[zone].par}</span>
                        <span>•</span>
                        <span>{lightZoneInfo[zone].dli}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-[#FEF4E0] rounded-lg">
                  <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-1">Light Zone</p>
                  <p className="text-[#375484] font-bold text-sm" style={{ color: lightZoneInfo[cover.light_zone].color }}>
                    {lightZoneInfo[cover.light_zone].fullLabel}
                  </p>
                </div>
                <div className="p-3 bg-[#FEF4E0] rounded-lg">
                  <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-1">Lighting Setup</p>
                  <div className="flex flex-wrap gap-1">
                    {cover.gets_natural_light && (
                      <span className="text-[#375484] text-xs bg-white px-2 py-0.5 rounded">
                        {windowDirectionLabels[cover.window_direction || 'idk']} window
                      </span>
                    )}
                    {cover.uses_grow_light && (
                      <span className="text-[#375484] text-xs bg-white px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap size={10} className="text-[#d97706]" /> Grow lights
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-[#FEF4E0] rounded-lg">
                  <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-1">Avg Temperature</p>
                  <p className="text-[#375484] font-bold text-lg">{cover.temperature}°F</p>
                </div>
                <div className="p-3 bg-[#FEF4E0] rounded-lg">
                  <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-1">Avg Humidity</p>
                  <p className="text-[#375484] font-bold text-lg">{cover.humidity}%</p>
                </div>
              </div>

              <div className="p-3 bg-[#FEF4E0] rounded-lg mb-4">
                <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-1">Feeding Schedule</p>
                <p className="text-[#375484] text-sm">
                  {wateringIntervalLabels[cover.watering_interval]}
                  {cover.uses_foliar_feed && ' • Foliar feeding'}
                </p>
                {cover.nutrients && (
                  <p className="text-[#375484]/70 text-xs mt-1">Using: {cover.nutrients}</p>
                )}
              </div>

              {cover.soil_components.length > 0 && (
                <div className="p-3 bg-[#FEF4E0] rounded-lg mb-4">
                  <p className="text-[10px] text-[#375484]/60 uppercase tracking-wider mb-2">Soil Mix Components</p>
                  <div className="flex flex-wrap gap-1">
                    {cover.soil_components.map((label, i) => (
                      <span key={i} className="text-[#375484] text-xs bg-white px-2 py-1 rounded">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#e8dcc8] text-center">
                <a 
                  href="https://rousseauplant.care"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#375484] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#d97706] transition-colors"
                >
                  Shop Rousseau Plant Care <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Step Up Your Plant Game */}
          <div className="max-w-4xl mx-auto mb-10">
            <h2 className="text-[#375484] font-['Bungee'] text-xl text-center mb-6">STEP UP YOUR PLANT GAME</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rousseauProducts.map((product, index) => (
                <a key={index} href={product.link} target="_blank" rel="noopener noreferrer" className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all">
                  <div className="aspect-square bg-gradient-to-br from-[#FEF4E0] to-[#e8dcc8] flex items-center justify-center">
                    <div className="w-16 h-16 bg-[#d97706]/20 rounded-full flex items-center justify-center">
                      <Sparkles size={24} className="text-[#d97706]" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[#375484] font-bold text-sm group-hover:text-[#d97706] transition-colors">{product.name}</h3>
                    <p className="text-[#375484]/60 text-xs mt-1">{product.description}</p>
                    <p className="text-[#d97706] font-bold text-sm mt-2">{product.price}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* More Covers */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[#375484] font-['Bungee'] text-lg text-center mb-4">MORE FROM THE COMMUNITY</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {covers.slice(0, 6).map((c) => (
                <button key={c.id} onClick={() => setView('gallery')} className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow text-left">
                  <div className="aspect-[3/4] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center relative">
                    <img src={c.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="absolute bottom-1 left-1 right-1">
                      <div 
                        className="inline-block px-1 py-0.5 rounded text-[7px] font-bold uppercase"
                        style={{ backgroundColor: `${lightZoneInfo[c.light_zone].color}30`, color: lightZoneInfo[c.light_zone].color }}
                      >
                        {lightZoneInfo[c.light_zone].label}
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[#375484] font-bold text-[10px] truncate">{c.user_name || 'Anonymous'}'s {c.plant_name || 'Plant'}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              <button onClick={() => setView('gallery')} className="text-[#d97706] hover:text-[#b45309] text-sm font-medium">View Full Gallery →</button>
            </div>
          </div>
        </div>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report this cover?</DialogTitle>
              <DialogDescription>
                This will flag the cover for review. Covers are automatically hidden after 2 reports.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitReport} className="bg-red-500 hover:bg-red-600 text-white">
                <Flag size={16} className="mr-2" /> Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Gallery view
  if (view === 'gallery') {
    return (
      <div className="min-h-screen bg-[#FEF4E0]" ref={galleryRef}>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-[#FEF4E0]/90 backdrop-blur-sm border-b border-[#e8dcc8]">
          <a href="https://rousseauplant.care" target="_blank" rel="noopener noreferrer">
            <img src="/logo.png" alt="Rousseau" className="h-8 w-auto" />
          </a>
          <button onClick={() => setView('form')} className="bg-[#d97706] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#b45309] transition-colors">
            Create Your Cover
          </button>
        </nav>

        <div className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-[#375484] font-['Bungee'] text-3xl text-center mb-2">THE ROUSSEAU REVIEW GALLERY</h1>
            <p className="text-[#375484]/60 text-center mb-10">See what the community is growing</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {covers.map((cover) => (
                <div key={cover.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow relative group">
                  <div className="aspect-[3/4] relative">
                    <img src={cover.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div 
                        className="inline-block px-2 py-1 rounded text-[8px] font-bold uppercase"
                        style={{ backgroundColor: `${lightZoneInfo[cover.light_zone].color}30`, color: lightZoneInfo[cover.light_zone].color }}
                      >
                        {lightZoneInfo[cover.light_zone].label}
                      </div>
                      <p className="text-white font-bold text-sm mt-1">{cover.user_name || 'Anonymous'}'s {cover.plant_name || 'Plant'}</p>
                    </div>
                    {/* Report button */}
                    <button 
                      onClick={() => handleReport(cover.id)}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white/70 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Report"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#d97706]" />
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center mt-8">
                <button onClick={loadMoreCovers} className="bg-[#375484] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#d97706] transition-colors">
                  Load More
                </button>
              </div>
            )}

            <div className="text-center mt-10">
              <button onClick={() => setView('form')} className="bg-[#375484] text-white px-8 py-3 rounded-full font-medium hover:bg-[#d97706] transition-colors">
                Create Your Own Cover
              </button>
            </div>
          </div>
        </div>

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report this cover?</DialogTitle>
              <DialogDescription>
                This will flag the cover for review. Covers are automatically hidden after 2 reports.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitReport} className="bg-red-500 hover:bg-red-600 text-white">
                <Flag size={16} className="mr-2" /> Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-[#FEF4E0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-[#FEF4E0]/90 backdrop-blur-sm border-b border-[#e8dcc8]">
        <a href="https://rousseauplant.care" target="_blank" rel="noopener noreferrer">
          <img src="/logo.png" alt="Rousseau" className="h-8 w-auto" />
        </a>
        <button onClick={() => setView('gallery')} className="text-[#375484] hover:text-[#d97706] transition-colors text-sm font-medium">
          Browse Gallery
        </button>
      </nav>

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d97706]/10 rounded-full mb-4">
              <Sparkles size={12} className="text-[#d97706]" />
              <span className="text-[#d97706] text-xs font-['Bungee']">FREE TOOL</span>
            </div>
            <h1 className="text-[#375484] font-['Bungee'] text-3xl sm:text-4xl mb-2">CREATE YOUR COVER</h1>
            <p className="text-[#375484]/60">Feature your plant in the Rousseau Review</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#e8dcc8]">
            {/* Photo Upload */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-2 block">Plant Photo *</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#375484]/30 rounded-lg p-6 text-center cursor-pointer hover:border-[#d97706] hover:bg-[#d97706]/5 transition-all overflow-hidden relative"
              >
                {plantData.photo ? (
                  <div className="relative">
                    <img 
                      src={plantData.photo} 
                      alt="Preview" 
                      className={`w-full h-40 object-cover rounded ${plantData.applyPhotoFilter ? 'plant-photo-filter' : ''}`} 
                    />
                  </div>
                ) : (
                  <div className="text-[#375484]/50">
                    <Upload size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Click to upload your plant photo</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              {plantData.photo && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={plantData.applyPhotoFilter}
                    onChange={(e) => setPlantData(prev => ({ ...prev, applyPhotoFilter: e.target.checked }))}
                    className="w-4 h-4 accent-[#d97706]"
                  />
                  <span className="text-[#375484]/70 text-sm">Apply photo filter (preview above)</span>
                </label>
              )}
            </div>

            {/* Name */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-1 block">Your Name</Label>
              <p className="text-[#375484]/50 text-xs mb-2">Appears on your cover (e.g., "SARAH'S MONSTERA")</p>
              <Input 
                value={plantData.userName}
                onChange={(e) => setPlantData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="e.g., Sarah"
                className="border-[#375484]/30 focus:border-[#d97706]"
              />
            </div>

            {/* Plant Name */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-1 block">Plant Name</Label>
              <p className="text-[#375484]/50 text-xs mb-2">What plant are you featuring?</p>
              <Input 
                value={plantData.plantName}
                onChange={(e) => setPlantData(prev => ({ ...prev, plantName: e.target.value }))}
                placeholder="e.g., Monstera Deliciosa"
                className="border-[#375484]/30 focus:border-[#d97706]"
              />
            </div>

            {/* Light Zone - All in one box */}
            <div className="mb-6 p-4 bg-[#FEF4E0] rounded-lg border border-[#e8dcc8]">
              <Label className="text-[#375484] font-semibold text-sm mb-3 block">Light Zone *</Label>
              
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={plantData.getsNaturalLight}
                  onChange={(e) => setPlantData(prev => ({ ...prev, getsNaturalLight: e.target.checked }))}
                  className="w-4 h-4 accent-[#d97706]"
                />
                <Sun size={18} className="text-[#d97706]" />
                <span className="text-[#375484] text-sm">Gets natural light from a window</span>
              </label>

              {plantData.getsNaturalLight && (
                <div className="ml-7 mb-4">
                  <p className="text-[#375484]/60 text-xs mb-2">Which direction?</p>
                  <RadioGroup 
                    value={plantData.windowDirection}
                    onValueChange={(value) => setPlantData(prev => ({ ...prev, windowDirection: value as WindowDirection }))}
                    className="grid grid-cols-3 sm:grid-cols-5 gap-2"
                  >
                    {(['east', 'west', 'north', 'south', 'idk'] as WindowDirection[]).map((dir) => (
                      <div key={dir}>
                        <RadioGroupItem value={dir} id={dir} className="peer sr-only" />
                        <Label htmlFor={dir} className="flex items-center justify-center p-2 rounded border border-[#375484]/20 cursor-pointer peer-data-[state=checked]:bg-[#375484] peer-data-[state=checked]:text-[#FEF4E0] text-xs text-center bg-white">
                          {dir.charAt(0).toUpperCase() + dir.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={plantData.usesGrowLight}
                  onChange={(e) => setPlantData(prev => ({ ...prev, usesGrowLight: e.target.checked }))}
                  className="w-4 h-4 accent-[#d97706]"
                />
                <Zap size={18} className="text-[#d97706]" />
                <span className="text-[#375484] text-sm">Uses grow lights</span>
              </label>

              <div className="border-t border-[#e8dcc8] pt-4">
                <p className="text-[#375484]/60 text-xs mb-2">Select your light zone:</p>
                <RadioGroup 
                  value={plantData.lightZone}
                  onValueChange={(value) => setPlantData(prev => ({ ...prev, lightZone: value as LightZone }))}
                  className="grid grid-cols-1 gap-2"
                >
                  {(['high', 'low', 'no'] as LightZone[]).map((zone) => (
                    <div key={zone}>
                      <RadioGroupItem value={zone} id={zone} className="peer sr-only" />
                      <Label htmlFor={zone} className="flex items-center gap-3 p-3 rounded-lg border border-[#375484]/20 cursor-pointer peer-data-[state=checked]:bg-[#375484] peer-data-[state=checked]:text-[#FEF4E0] hover:bg-[#375484]/5 bg-white">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lightZoneInfo[zone].color }} />
                        <div>
                          <p className="font-['Bungee'] text-xs">{lightZoneInfo[zone].fullLabel}</p>
                          <p className="text-[10px] opacity-70">{lightZoneInfo[zone].description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Temperature & Humidity */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-2 block">Average Temperature (°F)</Label>
              <div className="flex items-center gap-4">
                <Thermometer size={18} className="text-[#375484]/50" />
                <Slider 
                  value={[plantData.temperature]}
                  onValueChange={(value) => setPlantData(prev => ({ ...prev, temperature: value[0] }))}
                  min={60}
                  max={95}
                  step={1}
                  className="flex-1"
                />
                <span className="text-[#375484] font-bold w-14 font-['Bungee']">{plantData.temperature}°F</span>
              </div>
            </div>

            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-2 block">Average Humidity (%)</Label>
              <div className="flex items-center gap-4">
                <Droplets size={18} className="text-[#375484]/50" />
                <Slider 
                  value={[plantData.humidity]}
                  onValueChange={(value) => setPlantData(prev => ({ ...prev, humidity: value[0] }))}
                  min={20}
                  max={90}
                  step={5}
                  className="flex-1"
                />
                <span className="text-[#375484] font-bold w-12 font-['Bungee']">{plantData.humidity}%</span>
              </div>
            </div>

            {/* Feeding */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-2 block">Feeding Schedule</Label>
              <RadioGroup 
                value={plantData.wateringInterval}
                onValueChange={(value) => setPlantData(prev => ({ ...prev, wateringInterval: value as WateringInterval }))}
                className="grid grid-cols-2 gap-2"
              >
                {(Object.keys(wateringIntervalLabels) as WateringInterval[]).map((interval) => (
                  <div key={interval}>
                    <RadioGroupItem value={interval} id={interval} className="peer sr-only" />
                    <Label htmlFor={interval} className="flex items-center justify-center p-3 rounded border border-[#375484]/20 cursor-pointer peer-data-[state=checked]:bg-[#375484] peer-data-[state=checked]:text-[#FEF4E0] text-sm text-center">
                      {wateringIntervalLabels[interval]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Foliar Feed */}
            <div className="mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#375484]/20 cursor-pointer hover:bg-[#375484]/5">
                <input 
                  type="checkbox"
                  checked={plantData.usesFoliarFeed}
                  onChange={(e) => setPlantData(prev => ({ ...prev, usesFoliarFeed: e.target.checked }))}
                  className="w-4 h-4 accent-[#d97706]"
                />
                <Wind size={18} className="text-[#d97706]" />
                <span className="text-[#375484] text-sm">I foliar feed</span>
              </label>
            </div>

            {/* Nutrients */}
            <div className="mb-6">
              <Label className="text-[#375484] font-semibold text-sm mb-1 block">What nutrients do you use?</Label>
              <p className="text-[#375484]/50 text-xs mb-2">Only Rousseau products (Aroid Food, Healthy Leaf, Healthy Root) appear on covers</p>
              <Input 
                value={plantData.nutrients}
                onChange={(e) => setPlantData(prev => ({ ...prev, nutrients: e.target.value }))}
                placeholder="e.g., Aroid Food"
                className="border-[#375484]/30 focus:border-[#d97706]"
              />
            </div>

            {/* Soil Mix */}
            <div className="mb-8">
              <Label className="text-[#375484] font-semibold text-sm mb-3 block">What's in your soil mix?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {soilOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 p-2 rounded border border-[#375484]/20 cursor-pointer hover:bg-[#375484]/5">
                    <Checkbox 
                      checked={plantData.soilComponents.includes(option.id)}
                      onCheckedChange={() => toggleSoilComponent(option.id)}
                      className="accent-[#d97706]"
                    />
                    <span className="text-[#375484] text-xs">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateCover}
              disabled={isGenerating || !plantData.photo}
              className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-['Bungee'] py-6 text-base rounded-full disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw size={20} className="mr-2 animate-spin" />
              ) : (
                <Sparkles size={20} className="mr-2" />
              )}
              {isGenerating ? 'Saving...' : 'Generate Cover'}
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-8 border-t border-[#e8dcc8]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <a href="https://rousseauplant.care" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#375484]/50 hover:text-[#d97706]">
            <img src="/logo.png" alt="Rousseau" className="h-5 w-auto opacity-50" />
            <span className="text-sm">Powered by Rousseau Plant Care</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;