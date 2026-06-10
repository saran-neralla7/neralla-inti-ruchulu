import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, Leaf, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import type { Product, Category } from '@/types';
import { getProductSpiceLevel } from '@/lib/utils';

export function Products() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isTE = i18n.language === 'te';

  // State filters
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpice, setSelectedSpice] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch products from backend
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  // Fetch categories from backend
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Handle category navigation passed via router state from Home page categories showcase
  useEffect(() => {
    if (location.state?.categoryName && categories.length > 0) {
      const nameToFind = location.state.categoryName.toLowerCase();
      const matched = categories.find((c) =>
        c.name_en.toLowerCase().includes(nameToFind) ||
        c.name_te.toLowerCase().includes(nameToFind)
      );
      if (matched) {
        setActiveCategoryId(matched.id);
      }
    }
  }, [location.state, categories]);

  // Handle spice checkbox toggle
  const toggleSpice = (key: string) => {
    setSelectedSpice((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Helper to get minimum price of a product
  const getCheapestPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v) => v.variantPrice + v.packagingCharge));
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    // 1. Category Filter
    const matchesCategory = activeCategoryId === 'all' || p.categoryId === activeCategoryId;

    // 2. Search Query Filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name_en.toLowerCase().includes(q) ||
      p.name_te.toLowerCase().includes(q) ||
      (p.description_en?.toLowerCase().includes(q) ?? false);

    // 3. Spice Level Filter
    const spiceInfo = getProductSpiceLevel(p.spice);
    const matchesSpice = selectedSpice.length === 0 || selectedSpice.includes(spiceInfo.key);

    // 4. Price range filter
    const cheapest = getCheapestPrice(p);
    const matchesPrice = cheapest <= maxPrice;

    return matchesCategory && matchesSearch && matchesSpice && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return getCheapestPrice(a) - getCheapestPrice(b);
    }
    if (sortBy === 'price-desc') {
      return getCheapestPrice(b) - getCheapestPrice(a);
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
    // 'popular' sorts by rating / reviews
    const ratingA = a.rating ?? getProductSpiceLevel(a.spice).rating;
    const reviewCountA = a.reviewCount ?? getProductSpiceLevel(a.spice).reviews;
    const ratingB = b.rating ?? getProductSpiceLevel(b.spice).rating;
    const reviewCountB = b.reviewCount ?? getProductSpiceLevel(b.spice).reviews;
    return ratingB * reviewCountB - ratingA * reviewCountA;
  });

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Premium Header & Banner from Stitch */}
      <div className="bg-[#fff1ed] border-b border-primary/10 py-12 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/5 rounded-full blur-xl pointer-events-none" />

        <div className="container relative z-10 text-center space-y-3">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">
            {isTE ? 'మా వంటశాల' : 'Artisanal Andhra Kitchen'}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm md:text-base font-normal">
            {isTE
              ? 'విశాఖపట్నం MVP కాలనీ నుండి సాంప్రదాయ రోటి పచ్చళ్లు మరియు దంచిన పొడులు.'
              : 'Bringing the authentic heat of Guntur and the richness of Visakhapatnam home foods directly to your doorstep.'}
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={isTE ? 'వెతకండి...' : 'Search pickles, powders...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-primary/20 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ─── SIDEBAR FILTERS (Desktop) ─── */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
            
            {/* Categories list */}
            <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <h3 className="font-headline text-base font-bold text-primary border-b border-primary/10 pb-2 uppercase tracking-wider text-[11px]">
                {isTE ? 'విభాగాలు' : 'Categories'}
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveCategoryId('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeCategoryId === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {isTE ? 'అన్ని ఉత్పత్తులు' : 'All Products'}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategoryId(c.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeCategoryId === c.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    {isTE ? c.name_te : c.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Spice Intensity */}
            <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <h3 className="font-headline text-base font-bold text-primary border-b border-primary/10 pb-2 uppercase tracking-wider text-[11px]">
                {isTE ? 'కారం తీవ్రత' : 'Spice Intensity'}
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'fire', label: isTE ? 'ఆంధ్రా ఫైర్ (కారం ఎక్కువ)' : 'Andhra Fire (High Heat)' },
                  { key: 'medium', label: isTE ? 'మధ్యమ కారం' : 'Medium Spicy' },
                  { key: 'mild', label: isTE ? 'కారం తక్కువ / తీపి' : 'Mild / Sweet' },
                ].map((spice) => (
                  <label key={spice.key} className="flex items-center gap-3 cursor-pointer group text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSpice.includes(spice.key)}
                      onChange={() => toggleSpice(spice.key)}
                      className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className={`transition-colors ${selectedSpice.includes(spice.key) ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-primary'}`}>
                      {spice.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <h3 className="font-headline text-base font-bold text-primary border-b border-primary/10 pb-2 uppercase tracking-wider text-[11px]">
                {isTE ? 'ధర పరిధి' : 'Price Range'}
              </h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>₹50</span>
                  <span className="text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/15">Up to ₹{maxPrice}</span>
                  <span>₹1000</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ─── PRODUCT LIST DISPLAY AREA ─── */}
          <div className="flex-grow space-y-6">
            
            {/* Toolbar: Count + Sort By */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-primary/10 rounded-2xl px-6 py-4 gap-4 shadow-sm">
              <p className="text-muted-foreground text-sm font-semibold italic">
                {isTE
                  ? `మొత్తం ${products.length} ఆంధ్రా ఉత్పత్తులలో ${sortedProducts.length} కనిపిస్తున్నాయి`
                  : `Showing ${sortedProducts.length} of ${products.length} Andhra treasures`}
              </p>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                {/* Mobile Filters Toggle Button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 text-sm font-semibold rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {isTE ? 'ఫిల్టర్లు' : 'Filters'}
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isTE ? 'సార్ట్:' : 'Sort By:'}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-background border border-primary/20 rounded-xl text-sm font-semibold py-1.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="popular">{isTE ? 'అత్యంత ప్రజాదరణ' : 'Most Popular'}</option>
                    <option value="price-asc">{isTE ? 'ధర: తక్కువ నుండి ఎక్కువ' : 'Price: Low to High'}</option>
                    <option value="price-desc">{isTE ? 'ధర: ఎక్కువ నుండి తక్కువ' : 'Price: High to Low'}</option>
                    <option value="newest">{isTE ? 'కొత్తవి' : 'Newest Arrival'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 rounded-2xl bg-zinc-100 animate-pulse border border-border" />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-white border border-primary/10 rounded-3xl p-8 shadow-inner flex flex-col items-center justify-center gap-4">
                <Leaf className="h-16 w-16 text-primary/20 animate-bounce" />
                <p className="text-lg font-headline font-semibold text-primary">{isTE ? 'ఉత్పత్తులు ఏవీ కనుగొనబడలేదు' : 'No Andhra treasures match your selection.'}</p>
                <p className="text-xs text-muted-foreground">{isTE ? 'దయచేసి మీ ఫిల్టర్లను మార్చండి.' : 'Try adjusting your search queries or spice intensity checkboxes.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE FILTERS DRAWERS (Mobile Only) ─── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative w-full max-w-xs bg-background h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col">
            
            <div className="flex justify-between items-center border-b border-primary/10 pb-3">
              <h2 className="font-headline text-lg font-bold text-primary">{isTE ? 'ఫిల్టర్లు' : 'Filters'}</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-6 w-6 text-primary" />
              </button>
            </div>

            {/* Category selection */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">{isTE ? 'విభాగాలు' : 'Categories'}</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setActiveCategoryId('all');
                    setMobileFiltersOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    activeCategoryId === 'all'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-primary/10 text-muted-foreground hover:bg-primary/5'
                  }`}
                >
                  {isTE ? 'అన్నీ' : 'All'}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCategoryId(c.id);
                      setMobileFiltersOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      activeCategoryId === c.id
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-primary/10 text-muted-foreground hover:bg-primary/5'
                    }`}
                  >
                    {isTE ? c.name_te : c.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Spice Selection */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">{isTE ? 'కారం తీవ్రత' : 'Spice Intensity'}</h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'fire', label: isTE ? 'ఆంధ్రా ఫైర్ (కారం ఎక్కువ)' : 'Andhra Fire (High)' },
                  { key: 'medium', label: isTE ? 'మధ్యమ కారం' : 'Medium Spicy' },
                  { key: 'mild', label: isTE ? 'కారం తక్కువ / తీపి' : 'Mild / Sweet' },
                ].map((spice) => (
                  <label key={spice.key} className="flex items-center gap-3 cursor-pointer group text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSpice.includes(spice.key)}
                      onChange={() => toggleSpice(spice.key)}
                      className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary accent-primary"
                    />
                    <span className={selectedSpice.includes(spice.key) ? 'text-primary font-bold' : 'text-muted-foreground'}>
                      {spice.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Selection */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">{isTE ? 'ధర పరిధి' : 'Price Range'}</h3>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>₹50</span>
                <span className="text-primary">Up to ₹{maxPrice}</span>
                <span>₹1000</span>
              </div>
            </div>
            
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-semibold text-sm mt-auto"
            >
              {isTE ? 'వర్తించు' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
