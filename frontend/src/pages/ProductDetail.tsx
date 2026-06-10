import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Leaf, Flame, Clock, ShieldCheck, Heart, Sparkles, AlertCircle, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { cn, getProductSpiceLevel } from '@/lib/utils';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const isTE = i18n.language === 'te';

  // Fetch product from PostgreSQL API
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Gallery active index state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedPkg, setSelectedPkg] = useState<string>('');
  const [added, setAdded] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">
          {isTE ? 'వివరాలను లోడ్ చేస్తోంది...' : 'Loading product details...'}
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="h-12 w-12 text-destructive opacity-80" />
        <h2 className="text-xl font-bold text-primary">
          {isTE ? 'వస్తువు కనుగొనబడలేదు' : 'Product Not Found'}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {isTE ? 'క్షమించండి, మీరు వెతుకుతున్న పచ్చడి వివరాలు అందుబాటులో లేవు.' : "Sorry, we couldn't load the product you are looking for."}
        </p>
        <Button asChild className="rounded-full bg-primary mt-4">
          <Link to="/products">{isTE ? 'తిరిగి షాపుకు వెళ్ళు' : 'Back to Shop'}</Link>
        </Button>
      </div>
    );
  }

  // Group variants
  const variants = product.variants || [];
  const uniqueSizes = Array.from(new Set(variants.map((v) => v.size)));
  
  // Set default selection
  if (uniqueSizes.length > 0 && !selectedSize) {
    setSelectedSize(uniqueSizes[0]);
  }

  const availablePackagings = variants
    .filter((v) => v.size === selectedSize)
    .map((v) => v.packaging);

  if (availablePackagings.length > 0 && !selectedPkg) {
    setSelectedPkg(availablePackagings[0]);
  } else if (selectedPkg && !availablePackagings.includes(selectedPkg)) {
    setSelectedPkg(availablePackagings[0]);
  }

  // Active variant logic
  const activeVariant = variants.find(
    (v) => v.size === selectedSize && v.packaging === selectedPkg
  );

  const isAvailable = product.status === 'Available';
  const name = isTE ? product.name_te : product.name_en;
  const spiceInfo = getProductSpiceLevel(product.spice);

  const handleAddToCart = () => {
    if (!activeVariant || !isAvailable) return;
    addItem({
      productId: product.id,
      variantId: activeVariant.id,
      name_en: product.name_en,
      name_te: product.name_te,
      size: activeVariant.size,
      packaging: activeVariant.packaging,
      price: activeVariant.variantPrice + activeVariant.packagingCharge,
      quantity: 1,
      image: product.gallery[0] || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWhatsAppOrder = () => {
    if (!activeVariant) return;
    const finalPrice = activeVariant.variantPrice + activeVariant.packagingCharge;
    const message = `🌶️ *Inquiry - Neralla Inti Ruchulu*\n\nHi! I'm interested in ordering:\n*${product.name_en}*\nSize: ${activeVariant.size}\nPackaging: ${activeVariant.packaging}\nPrice: ₹${finalPrice.toFixed(0)}\n\nPlease let me know if this is available for delivery. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/918247843466?text=${encoded}`, '_blank');
  };

  // Mock prep steps
  const prepSteps = [
    {
      num: '01',
      title: isTE ? 'నైతిక సేకరణ' : 'Ethical Sourcing',
      desc: isTE ? 'ఉత్తమ నాణ్యమైన మామిడి మరియు కాయలను తోటల నుండి నేరుగా సేకరిస్తాము.' : 'We harvest raw green mangoes directly from local orchards at peak tartness.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKBlrwwz0BxXbYsdspRiF_rOaJ6LdKnUgF6hRs5_rTL_ZwCMYOWOEacEU-7bOjzugt25TUHSQ4sOrDCQnlYiYpIX3pk2fVws0Y1Pbp5CKSzweto0uyG2zQnoy7aW7rf6X94U-iLHXD9yohJ5j0byzGUJ9yuRX0KcyNCBMNng_GVZHGJQK8FAGmDGSB7UExz1h3aYbBBgfXfTxNpiIvngVuDlu10_LSHroQ9_lRMxD02mc6kPhRljX-VXE4y4ZoApcgudRRcWYUSOOW'
    },
    {
      num: '02',
      title: isTE ? 'స్వచ్ఛమైన శుభ్రత' : 'Pure Cleaning',
      desc: isTE ? 'సేకరించిన వాటిని పరిశుభ్రమైన వాతావరణంలో కడిగి, శుభ్రపరుస్తాము.' : 'Each slice is carefully washed, sundried on cotton sheets, and salt-cured.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiDoE3DWjvGxFW05pUDj5yW0Aen4yUBIfAXJLMOIEoiL0jQ6B9esIOdOclCImZrCyD_her_eF0qlxsBhAhhYlQHdTl4PnRJhj5fjYro1qPe2IbRTPO7k-pVhbArXrxJqGaY0ny_zpEi2uEv4g4C-lS4437em-pu31sce5vw3Zc6jp1DBQ6r1tZDCrFW5kDdAMODlyz6fleTPjAs3WtuMuDjnTCGmYupEuHu4JyD9PJ40Ompr2kLPuMmq6_nWuaebINb8j5M3dHq3Bj'
    },
    {
      num: '03',
      title: isTE ? 'మసాలా మిశ్రమం' : 'Spice Blending',
      desc: isTE ? 'సాంప్రదాయ పద్ధతిలో మసాలాలు దంచి పచ్చడి తయారుచేస్తాము.' : 'Combined with freshly ground Guntur mustard, fenugreek, and cold-pressed sesame oil.',
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGr2hi3NrTjondwC_LWM2EHwXrI-Q8QTSFJoTOu4LBzY-nsV5M2Taikrj1yhY68TiWMdf46wov_1FeVZvlAJ7ryF2mE4jzrK9dzAtBBXTTSG31Cy1IEPOT5m_ylXBgqR9_5ENpwOgmJcA_pwK0HDWhJQixPoYFLRxBk_q8r8Tmi3-3GiQG-NkpCXLnInisxPeyKxUzSAQyZC7KAOFHClcOeCHoDKgwkOWHdLZQPXBsFyKOJ3Ac5oDnnxxov9cGGbX2UEBFmdBBZbAn'
    }
  ];

  return (
    <div className={cn("w-full bg-background min-h-screen py-8 md:py-16 container max-w-7xl mx-auto px-6 text-foreground", isTE && "leading-loose")}>
      
      {/* ─── Breadcrumbs ─── */}
      <nav className="mb-8 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Link to="/" className="hover:text-primary transition-colors">{isTE ? 'హోమ్' : 'Home'}</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition-colors">{isTE ? 'పచ్చళ్లు' : 'Pickles'}</Link>
        <span>/</span>
        <span className="text-primary font-bold">{name}</span>
      </nav>

      {/* ─── Product Hero Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted/40 border border-border/40 shadow-md group relative">
            {product.gallery[activeImageIndex] ? (
              <img
                src={product.gallery[activeImageIndex]}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                <Leaf className="h-20 w-20" />
                <span className="text-xs mt-2">{isTE ? 'చిత్రం లేదు' : 'No image available'}</span>
              </div>
            )}
            {product.label && (
              <div className="absolute top-4 left-4 bg-amber-500/90 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {product.label}
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    'w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0',
                    idx === activeImageIndex
                      ? 'border-primary shadow-md scale-95'
                      : 'border-border/40 hover:border-primary/50'
                  )}
                >
                  <img src={imgUrl} alt={`${name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border-t-8 border-primary pt-6">
            <h1 className="font-headline font-bold text-3xl md:text-4xl text-primary leading-tight">
              {name}
            </h1>
            
            {/* Dynamic Rating Stars */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center text-amber-500 gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={cn('h-4 w-4', idx < Math.floor(spiceInfo.rating) ? 'fill-current' : 'text-zinc-200')}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground/80">{spiceInfo.rating}</span>
              <span className="text-xs text-muted-foreground">({spiceInfo.reviews} {isTE ? 'సమీక్షలు' : 'customer reviews'})</span>
            </div>

            {product.description_en && (
              <p className="text-muted-foreground italic text-sm mt-3 leading-relaxed">
                {isTE ? product.description_te : product.description_en}
              </p>
            )}
          </div>

          {/* Price display */}
          <div className="flex items-center gap-4 py-2 border-y border-border/40">
            {activeVariant ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  ₹{(activeVariant.variantPrice + activeVariant.packagingCharge).toFixed(0)}
                </span>
                {activeVariant.packagingCharge > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({t('product.incl_pkg')} ₹{activeVariant.packagingCharge})
                  </span>
                )}
              </>
            ) : (
              <span className="text-lg text-muted-foreground italic">
                {isTE ? 'ధర అందుబాటులో లేదు' : 'Price unavailable'}
              </span>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              {t('product.homemade')}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <Leaf className="h-4.5 w-4.5 text-primary" />
              {t('product.veg')}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <Heart className="h-4.5 w-4.5 text-primary" />
              {t('product.traditional')}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              {t('product.no_preservatives')}
            </div>
          </div>

          {/* Attribute Stack */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('product.spice_level')}
              </span>
              <div className="flex text-primary gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const numFlames = spiceInfo.key === 'fire' ? 5 : spiceInfo.key === 'medium' ? 3 : 1;
                  return (
                    <Flame
                      key={idx}
                      className={cn('h-4.5 w-4.5', idx < numFlames ? 'fill-current text-primary' : 'opacity-30')}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('product.shelf_life')}
              </span>
              <span className="text-xs font-bold flex items-center gap-1.5 text-foreground/85">
                <Clock className="h-4 w-4 text-primary" />
                12 {isTE ? 'నెలలు' : 'Months'}
              </span>
            </div>
          </div>

          {/* Weight Selection */}
          {uniqueSizes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('product.select_weight')}
              </span>
              <div className="flex gap-2">
                {uniqueSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={cn(
                      'flex-1 py-2 rounded-full border text-xs font-bold transition-all duration-300',
                      selectedSize === sz
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-border/60 text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Packaging Selection */}
          {availablePackagings.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t('product.select_pkg')}
              </span>
              <div className="flex gap-2">
                {availablePackagings.map((pkg) => (
                  <button
                    key={pkg}
                    onClick={() => setSelectedPkg(pkg)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300',
                      selectedPkg === pkg
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-border/60 text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <PackageIcon className="h-4.5 w-4.5" />
                    {pkg === 'Bottle' || pkg === 'Jar' ? t('product.ceramic_jar') : t('product.eco_refill')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className={cn(
                'w-full h-12 rounded-xl text-base font-bold transition-all shadow-md active:scale-95',
                added ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-primary hover:bg-primary/95 text-white'
              )}
              onClick={handleAddToCart}
              disabled={!isAvailable || !activeVariant}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {added ? (isTE ? 'కార్ట్‌కి చేర్చబడింది!' : 'Added to Cart!') : t('product.add_to_cart')}
            </Button>
            
            <button
              onClick={handleWhatsAppOrder}
              className="w-full h-12 bg-[#25D366] text-white hover:bg-[#20ba5a] py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg active:scale-95 text-base"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.404.835 3.084 1.277 4.795 1.278 5.203 0 9.432-4.23 9.435-9.432.001-2.522-.982-4.893-2.767-6.68-1.786-1.786-4.157-2.77-6.681-2.771-5.204 0-9.432 4.231-9.433 9.432-.001 1.868.55 3.69 1.589 5.253l-1.019 3.714 3.812-1.001zm11.705-6.915c-.322-.161-1.899-.937-2.199-1.047-.3-.109-.519-.163-.739.163-.22.329-.855 1.071-1.048 1.291-.192.221-.385.249-.706.088-.322-.161-1.359-.501-2.588-1.598-.959-.855-1.606-1.912-1.794-2.234-.188-.322-.02-.497.141-.657.144-.144.322-.376.483-.563.16-.188.214-.322.322-.536.107-.214.053-.402-.027-.563-.08-.161-.739-1.781-.989-2.385-.244-.592-.492-.511-.676-.521-.175-.008-.376-.01-.577-.01-.201 0-.528.075-.803.376-.276.301-1.054 1.03-1.054 2.512s1.079 2.912 1.229 3.112c.15.201 2.124 3.242 5.143 4.542.718.309 1.279.494 1.716.633.721.23 1.376.198 1.893.121.576-.085 1.899-.777 2.164-1.527.265-.75.265-1.392.186-1.527-.079-.136-.291-.217-.613-.378z" />
              </svg>
              {t('product.order_whatsapp')}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Detailed Sections (Heritage Recipe, Ingredients, Storage) ─── */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Heritage Story block */}
        <div className="p-8 md:p-10 rounded-3xl bg-muted/20 border border-border/30 relative overflow-hidden flex flex-col justify-center">
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />
          <div className="relative z-10 space-y-4">
            <span className="text-primary font-bold text-xs uppercase tracking-widest block">
              {isTE ? 'వారసత్వ రుచి' : 'Our Heritage'}
            </span>
            <h2 className="font-headline font-bold text-2xl text-foreground">
              {isTE ? 'నేరెళ్ల కుటుంబ సాంప్రదాయం' : 'The Neralla Family Recipe'}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isTE 
                ? 'తరం నుండి తరానికి అందించబడిన శ్రీమతి నేరెళ్ల గారి ఆవకాయ వంటకం కేవలం ఆహారం కాదు, అది మా చరిత్ర. ప్రతి పచ్చడి తయారీలో తాజా మరియు ఉత్తమమైన కాయలను మాత్రమే ఉపయోగిస్తాము.'
                : "Crafted using a recipe passed down through four generations of the Neralla family, our Avakaya is more than just a pickle; it's a piece of our history. Each batch starts with hand-selected green mangoes, harvested at the peak of their tartness."}
            </p>
          </div>
        </div>

        {/* Ingredients & Storage Stack */}
        <div className="grid grid-rows-2 gap-6">
          {/* Ingredients */}
          <div className="p-6 md:p-8 rounded-3xl bg-primary text-white flex flex-col justify-center shadow-lg">
            <h3 className="font-headline font-bold text-xl mb-3 flex items-center gap-2">
              <Leaf className="h-5 w-5 fill-current" />
              {t('product.ingredients')}
            </h3>
            <p className="text-sm opacity-90 leading-relaxed">
              {product.ingredients || (isTE 
                ? 'మామిడి కాయ ముక్కలు, ఆవ పొడి, మెంతులు, స్వచ్ఛమైన నువ్వుల నూనె, సముద్రపు ఉప్పు, పసుపు, గుంటూరు కారం పొడి.'
                : 'Raw Mango Pieces, Mustard Powder, Fenugreek Seeds, Cold-Pressed Gingelly (Sesame) Oil, Sea Salt, Turmeric, Guntur Red Chili Powder.')}
            </p>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-90">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('product.pure_handcrafted')}
            </div>
          </div>

          {/* Storage instructions */}
          <div className="p-6 md:p-8 rounded-3xl border border-border/40 bg-background flex flex-col justify-center shadow-sm">
            <h3 className="font-headline font-bold text-xl text-primary mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t('product.storage')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span> 
                {isTE ? 'సూర్యరశ్మి తగలని చల్లని, పొడి ప్రదేశంలో నిల్వ చేయండి.' : 'Store in a cool, dry place away from direct sunlight.'}
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span> 
                {isTE ? 'పచ్చడి తీయడానికి ఎల్లప్పుడూ పొడి చెంచాను వాడండి.' : 'Always use a dry spoon to serve.'}
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span> 
                {isTE ? 'ఎక్కువ కాలం నిల్వ ఉండటానికి పైన నూనె తేలేలా చూసుకోండి.' : 'Keep the oil layer floating on top for longer shelf life.'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── Preparation Process Gallery Slider ─── */}
      <div className="mt-20">
        <h2 className="font-headline font-bold text-2xl text-center mb-10 text-primary">
          {isTE ? 'అసలైన రుచిని అందించే ప్రక్రియ' : 'Crafting the Authentic Flavor'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prepSteps.map((step) => (
            <div key={step.num} className="rounded-2xl overflow-hidden border border-border/30 bg-muted/10 relative group shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={step.img}
                  alt={step.title}
                  className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-105"
                />
              </div>
              <div className="p-5 space-y-2 bg-background">
                <span className="text-primary font-bold text-xs tracking-widest">{step.num}. {step.title}</span>
                <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Package icon helper
function PackageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
