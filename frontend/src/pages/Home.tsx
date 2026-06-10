import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Leaf, Heart, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BusinessHoursBanner } from '@/components/BusinessHoursBanner';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import type { Product } from '@/types';

const FEATURED_FALLBACK: Product[] = [
  {
    id: 'p1', categoryId: '1',
    name_en: 'Avakaya (Raw Mango Pickle)', name_te: 'అవకాయ',
    description_en: 'Traditional spicy Andhra raw mango pickle, sun-dried with sesame oil.',
    description_te: 'సాంప్రదాయ ఆంధ్ర ముతక మామిడికాయ పచ్చడి, నువ్వుల నూనెతో.',
    status: 'Available', label: 'Bestseller', spice: 'fire', gallery: [], inventory: 50,
    variants: [
      { id: 'v1a', productId: 'p1', size: '250g', packaging: 'Bottle', variantPrice: 120, packagingCharge: 20 },
      { id: 'v1b', productId: 'p1', size: '500g', packaging: 'Bottle', variantPrice: 220, packagingCharge: 20 },
      { id: 'v1c', productId: 'p1', size: '1kg', packaging: 'Jar', variantPrice: 400, packagingCharge: 30 },
    ],
  },
  {
    id: 'p2', categoryId: '1',
    name_en: 'Gongura (Sorrel Leaves Pickle)', name_te: 'గోంగూర పచ్చడి',
    description_en: 'Sour and tangy sorrel leaves pickle — an Andhra classic.',
    description_te: 'పులుపు గోంగూర పచ్చడి — ఆంధ్ర సాంప్రదాయం.',
    status: 'Available', label: 'New Arrival', spice: 'fire', gallery: [], inventory: 30,
    variants: [{ id: 'v2a', productId: 'p2', size: '250g', packaging: 'Bottle', variantPrice: 130, packagingCharge: 20 }],
  },
  {
    id: 'p3', categoryId: '2',
    name_en: 'Kandi Podi (Toor Dal Powder)', name_te: 'కంది పొడి',
    description_en: 'Aromatic toor dal powder, perfect with hot rice and ghee.',
    description_te: 'సుగంధ కంది పొడి, వేడి అన్నం మరియు నెయ్యితో చాలా రుచిగా ఉంటుంది.',
    status: 'Available', label: 'Bestseller', spice: 'medium', gallery: [], inventory: 40,
    variants: [{ id: 'v3a', productId: 'p3', size: '200g', packaging: 'Packet', variantPrice: 80, packagingCharge: 10 }],
  },
];

const USP = [
  { icon: Leaf, title: 'No Preservatives', titleTE: 'సంరక్షకాలు లేవు', desc: 'Pure, natural ingredients only', descTE: 'సహజ పదార్థాలు మాత్రమే' },
  { icon: Heart, title: 'Made with Love', titleTE: 'ప్రేమతో తయారైనవి', desc: 'Authentic home-cooked taste', descTE: 'నిజమైన ఇంటి రుచి' },
  { icon: Star, title: 'Traditional Recipe', titleTE: 'సాంప్రదాయ పద్ధతి', desc: 'Passed down through generations', descTE: 'తరతరాలుగా వస్తున్న రుచి' },
  { icon: Truck, title: 'Door Delivery', titleTE: 'ఇంటికే డెలివరీ', desc: 'Fast, secure doorstep shipping', descTE: 'వేగవంతమైన హోమ్ డెలివరీ' }
];

const CATEGORIES_SHOWCASE = [
  {
    name_en: 'Pickles',
    name_te: 'పచ్చళ్లు',
    image: '/cat-pickles.jpg',
    searchName: 'Pickles'
  },
  {
    name_en: 'Powders / Podi',
    name_te: 'పొడులు',
    image: '/cat-powders.jpg',
    searchName: 'Powders'
  },
  {
    name_en: 'Chutneys',
    name_te: 'చట్నీలు',
    image: '/cat-chutneys.jpg',
    searchName: 'Chutneys'
  },
  {
    name_en: 'Seasonal Specials',
    name_te: 'సీజనల్ ప్రత్యేకాలు',
    image: '/cat-seasonal.jpg',
    searchName: 'Pickles' // Default to pickles if seasonal is empty
  }
];

export function Home() {
  const { t, i18n } = useTranslation();
  const isTE = i18n.language === 'te';

  // Dynamic Query for Products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const displayProducts = products.length > 0
    ? products.filter(p => p.status === 'Available').slice(0, 3)
    : FEATURED_FALLBACK;

  return (
    <div className="flex flex-col w-full bg-background selection:bg-secondary/20">
      <BusinessHoursBanner />

      {/* ─── Hero Section with High-Fidelity Background ─── */}
      <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image from Stitch */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/aida/AP1WRLt4J1vR2-7cKxynLdCRlBayFAt0ltLJLdPmRjlouqvEKFxiwYgV-9bI-06LuQa7nr8ihrgoC9xVJmGTHFEKn611PtAIxsbPd6hsvoGj8nYIa5j7MvNsbvthiGSaVLeUCAaG1Nb2_dhi9jirMK-xqxIhPq81uBM1S85TkWGZeokkAZspw5Ye5ro5rn0viMaUFtbCZQyAnDHx3AZnx2JGm3m0T-we2Ky36nDUWUZFoOWN0ESVzvdUu6Wy3RA5"
            alt="Neralla Inti Ruchulu Heritage Background"
            className="w-full h-full object-cover object-center transform scale-105"
          />
          {/* Subtle gradient overlay to make typography legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        </div>

        <div className="container relative z-10 py-24 md:py-32 flex items-center">
          <div className="max-w-2xl text-left text-white space-y-6">
            {/* Logo Watermark Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-secondary-container/30 bg-white/10 backdrop-blur-md shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-semibold text-xs tracking-wider uppercase text-secondary-container">
                {isTE ? 'సాంప్రదాయ తెలుగు రుచులు' : 'TRADITIONAL TELUGU TASTE'}
              </span>
            </div>

            <h1 className="font-headline font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-2 leading-[1.1]">
              {isTE ? 'నేరెళ్ల ఇంటి రుచులు' : 'Neralla Inti Ruchulu'}
            </h1>
            
            <h2 className="font-headline text-2xl md:text-4xl text-secondary-container font-semibold tracking-wide">
              {isTE ? 'మా ఇంటి వంట... మీ ఇంటి ఆనందం' : 'Ma Inti Vanta... Mee Inti Aanandam'}
            </h2>

            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-xl font-normal">
              {isTE 
                ? 'విశాఖపట్నం ఎమ్‌విపి కాలనీ నుండి మూడు తరాల ప్రేమ, అనుభవం మరియు సాంప్రదాయ పద్ధతులతో తయారు చేసిన ఆంధ్ర పచ్చళ్లు.'
                : 'Experience the authentic, premium home-cooked Andhra pickles and powders, handcrafted with love and sun-dried to perfection in MVP Colony, Visakhapatnam.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-10 h-14 text-base font-semibold shadow-2xl transition-all hover:scale-[1.03]"
                asChild
              >
                <Link to="/products">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-[#22c35e] text-white rounded-xl px-10 h-14 text-base font-semibold shadow-2xl transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
                asChild
              >
                <a href="https://wa.me/918247843466" target="_blank" rel="noreferrer">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.041-.534c.957.643 1.96 1.026 3.247 1.027 3.18 0 5.767-2.587 5.768-5.767 0-3.18-2.587-5.766-5.768-5.766zM15.43 14.86c-.149.42-.741.764-1.21.826-.356.046-.78.077-2.316-.549-1.963-.801-3.23-2.793-3.328-2.923-.098-.13-.801-1.066-.801-2.034 0-.969.508-1.445.688-1.642.18-.198.393-.247.525-.247s.262.001.377.006c.12.006.281-.045.441.336.162.387.557 1.356.606 1.455.049.098.082.213.016.344-.066.13-.098.213-.197.328-.098.114-.207.255-.295.344-.098.098-.201.205-.086.402.114.197.511.844 1.102 1.368.761.676 1.401.884 1.598.982.197.098.311.082.426-.049s.492-.574.623-.77c.131-.197.262-.164.443-.098.18.066 1.148.541 1.344.64.197.098.328.148.377.23.05.082.05.474-.098.893z"/></svg>
                  {isTE ? 'వాట్సాప్‌లో కొనండి' : 'ORDER ON WHATSAPP'}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── USP Strip ─── */}
      <section className="w-full bg-primary text-white py-10 shadow-lg">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8">
          {USP.map(({ icon: Icon, title, titleTE, desc, descTE }) => (
            <div key={title} className="flex flex-col items-center text-center gap-2 group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-secondary-container" />
              </div>
              <p className="font-headline font-semibold text-base md:text-lg">{isTE ? titleTE : title}</p>
              <p className="text-xs text-white/70">{isTE ? descTE : desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories Showcase Section ─── */}
      <section className="w-full py-24 bg-background relative">
        <div className="container text-center">
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-3">
            {isTE ? 'నేరెళ్ల ఇంటి రుచులు' : 'Explore Our Treasures'}
          </h2>
          <div className="w-24 h-1 bg-secondary-container mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground italic max-w-lg mx-auto mb-16 font-body text-base">
            {isTE ? 'మా ఇంటి వంట... మీ ఇంటి ఆనందం' : 'Pure Andhra homemade goodness for every craving'}
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {CATEGORIES_SHOWCASE.map((cat, idx) => (
              <Link
                key={idx}
                to="/products"
                state={{ categoryName: cat.searchName }}
                className="group flex flex-col items-center cursor-pointer"
              >
                <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-full mb-6 border-4 border-primary/10 group-hover:border-primary transition-all p-2 bg-white shadow-md group-hover:shadow-xl">
                  <img
                    alt={cat.name_en}
                    className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
                    src={cat.image}
                  />
                </div>
                <h3 className="font-headline font-bold text-lg text-primary group-hover:text-accent transition-colors leading-tight">
                  {cat.name_en}
                </h3>
                <p className="text-muted-foreground text-xs font-semibold mt-1">
                  {cat.name_te}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Family Recipe Legacy Section ─── */}
      <section className="w-full py-24 bg-[#fff1ed] border-y border-primary/10 relative overflow-hidden">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <img
              alt="Traditional Andhra Kitchen"
              className="rounded-2xl shadow-2xl border-4 border-primary/10 relative z-10 w-full object-cover aspect-[4/3]"
              src="/heritage-kitchen-pickles.png"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-6 shadow-xl rounded-xl z-20 border border-primary/10">
              <p className="font-headline text-primary text-2xl font-bold">Since 1974</p>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Three Generations of Taste</p>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <h2 className="font-headline font-bold text-3xl md:text-4xl text-primary leading-tight">
              {isTE ? 'సంప్రదాయ ఆంధ్ర రుచులు' : 'A Legacy of Pure Flavors'}
            </h2>
            <h3 className="font-headline text-xl text-secondary font-medium italic">
              నేరెళ్ల ఇంటి రుచులు - మా ప్రయాణం
            </h3>
            <div className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
              <p>
                {isTE
                  ? "ఆంధ్రప్రదేశ్ నడిబొడ్డున విశాఖపట్నంలో శ్రీమతి నేరెళ్ల లక్ష్మి గారు స్థాపించిన 'నేరెళ్ల ఇంటి రుచులు' కేవలం ఒక బ్రాండ్ మాత్రమే కాదు — ఇది ఒక పవిత్రమైన కుటుంబ విశ్వాసం. మూడు తరాలుగా, నేరెళ్ల కుటుంబం సంప్రదాయ పద్ధతులలో పచ్చళ్ల తయారీ కళను కాపాడుకుంటూ వస్తోంది."
                  : "Founded in the heart of Visakhapatnam by Smt. Neralla Lakshmi, 'Neralla Inti Ruchulu' is more than a brand—it is a sacred family trust. For three generations, the Neralla family has meticulously preserved the art of traditional Andhra pickling, ensuring that every jar captures the authentic soul of our ancestral kitchen."}
              </p>
              <p>
                {isTE
                  ? "మేము రోటి పచ్చళ్ల రుచిని మరియు సాంప్రదాయ పొడులను మీ ముందుకు తెస్తున్నాము. ఎలాంటి కృత్రిమ రంగులు లేదా నిల్వ ఉంచే కెమికల్స్ లేకుండా సహజ సిద్ధంగా ఎండబెట్టిన పదార్ధాలతో మాత్రమే వీటిని తయారుచేస్తాము."
                  : "We use only stone-ground spices and cold-pressed oils, avoiding any artificial preservatives. What began as a humble home endeavor in Vizag's MVP Colony is now a celebrated legacy of purity and taste, shared with families across India."}
              </p>
            </div>
            
            <div className="p-6 bg-white/60 backdrop-blur-sm rounded-xl border-l-4 border-secondary shadow-sm italic text-foreground text-base md:text-lg">
              {isTE 
                ? '"మేము కేవలం పచ్చళ్లను అమ్మడం లేదు; ప్రతి ముక్కలోనూ మా కుటుంబ చరిత్రను మరియు మా సంస్కృతిని పంచుకుంటున్నాము."'
                : '"We don\'t just sell pickles; we share a piece of our family history and our culture through every bite."'}
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <div className="flex flex-col">
                <p className="text-sm font-bold text-primary tracking-widest uppercase">THE NERALLA FAMILY</p>
                <p className="text-xs text-muted-foreground">Guarding Traditions in Vizag</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Products (Signature Blends) ─── */}
      <section className="w-full py-24 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-left">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">
                {isTE ? 'మా ప్రత్యేకతలు' : 'Signature Blends'}
              </h2>
              <div className="w-20 h-1 bg-secondary-container mt-2 rounded-full mb-3" />
              <p className="text-muted-foreground text-sm font-body">
                {isTE ? 'మా వంటగది నుండి అత్యంత ప్రజాదరణ పొందిన రుచులు, మీ కోసం తాజాగా సిద్ధం చేయబడ్డాయి.' : 'The most loved flavors from our kitchen, freshly prepared for you.'}
              </p>
            </div>
            <Button variant="outline" className="rounded-xl px-8 h-12 border-primary/30 text-primary hover:bg-primary/5 font-semibold" asChild>
              <Link to="/products">
                {isTE ? 'అన్ని ఉత్పత్తులు' : 'VIEW FULL SHOP'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded-2xl bg-zinc-100 animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              {displayProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* ─── CTA Banner ─── */}
      <section className="w-full py-20 bg-gradient-to-r from-primary to-primary/80 text-white shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 heritage-pattern pointer-events-none" />
        <div className="container text-center relative z-10 space-y-6">
          <h2 className="font-headline text-4xl md:text-5xl font-bold">
            {isTE ? 'WhatsApp లో ఆర్డర్ చేయండి' : 'Order via WhatsApp'}
          </h2>
          <p className="text-white/80 max-w-lg mx-auto leading-relaxed text-sm md:text-base font-normal">
            {isTE
              ? 'మా WhatsApp నంబర్‌కు మెసేజ్ చేసి మీ ఆర్డర్ పెట్టండి. మేము వెంటనే స్పందిస్తాం!'
              : 'Message us on WhatsApp and we\'ll confirm your order within minutes. No complex checkout needed!'}
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-10 h-14 text-base font-bold shadow-2xl transition-transform hover:scale-105 flex items-center justify-center mx-auto"
            asChild
          >
            <a href="https://wa.me/918247843466" target="_blank" rel="noreferrer">
              <svg className="h-5 w-5 mr-2.5 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              +91 82478 43466
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
