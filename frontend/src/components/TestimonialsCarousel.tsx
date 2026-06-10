import { useEffect, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  customer_name: string;
  location?: string | null;
  text: string;
  rating: number;
}

export function TestimonialsCarousel() {
  const { i18n } = useTranslation();
  const isTe = i18n.language === 'te';

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const { data: testimonials = [], isLoading, isError } = useQuery<Testimonial[]>({
    queryKey: ['testimonials-active'],
    queryFn: async () => {
      const res = await api.get('/testimonials');
      return res.data;
    },
    retry: 1,
    staleTime: 60000,
  });

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Auto scroll effect
  useEffect(() => {
    if (!emblaApi || testimonials.length <= 1) return;
    
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [emblaApi, testimonials.length]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // If there is a loading delay, show a beautiful shimmer matching our layout
  if (isLoading && !isError) {
    return (
      <section className="py-16 bg-gradient-to-b from-amber-50/30 to-orange-50/10 border-y border-amber-100/20">
        <div className="container px-4 mx-auto max-w-6xl">
          {/* Header Shimmer */}
          <div className="text-center mb-12 space-y-3">
            <div className="h-8 w-64 bg-zinc-200/60 rounded-xl animate-pulse mx-auto" />
            <div className="h-1 w-16 bg-amber-200 rounded-full mx-auto" />
          </div>
          
          {/* Cards Shimmer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-white rounded-2xl p-6 border border-amber-50/50 shadow-sm space-y-5 h-56 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Stars Row */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <div key={s} className="w-4 h-4 bg-zinc-200/60 rounded-full animate-pulse" />
                    ))}
                  </div>
                  {/* Paragraph lines */}
                  <div className="space-y-2">
                    <div className="h-3.5 bg-zinc-100 rounded-lg animate-pulse w-full" />
                    <div className="h-3.5 bg-zinc-100 rounded-lg animate-pulse w-5/6" />
                    <div className="h-3.5 bg-zinc-100 rounded-lg animate-pulse w-2/3" />
                  </div>
                </div>
                {/* Author Info */}
                <div className="space-y-2 pt-4 border-t border-zinc-50">
                  <div className="h-4 bg-zinc-200/60 rounded-md animate-pulse w-1/3" />
                  <div className="h-3 bg-zinc-100 rounded-md animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Hide the section completely if there are no testimonials or if the backend request failed
  if (isError || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-amber-50/70 to-orange-50/40 border-y border-amber-100/40 relative overflow-hidden">
      {/* Decorative background vectors */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-52 h-52 bg-orange-200/10 rounded-full blur-2xl pointer-events-none" />

      <div className="container px-4 mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-3">
            {isTe ? 'మా కస్టమర్లు ఏమి చెప్తున్నారు' : 'What Our Customers Say'}
          </h2>
          <div className="h-1 w-20 bg-amber-500 mx-auto rounded-full" />
        </div>

        {/* Carousel Viewport */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-4 md:-ml-6">
              {testimonials.map((t) => (
                <div 
                  key={t.id} 
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] pl-4 md:pl-6 min-w-0 py-2"
                >
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-lg border border-amber-100/50 flex flex-col justify-between h-full min-h-[240px] transition-all duration-300 transform hover:-translate-y-1">
                    <div>
                      {/* Quote Icon */}
                      <span className="text-primary/10 font-serif text-7xl leading-none absolute -top-4 -left-2 pointer-events-none select-none">
                        “
                      </span>
                      
                      {/* Rating Stars */}
                      <div className="flex gap-0.5 mb-4 relative z-10">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4.5 w-4.5 ${
                              i < t.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'
                            }`} 
                          />
                        ))}
                      </div>

                      {/* Text */}
                      <p className="text-zinc-700 italic text-sm md:text-base leading-relaxed mb-6 font-sans line-clamp-5">
                        "{t.text}"
                      </p>
                    </div>

                    {/* Author Details */}
                    <div className="border-t border-zinc-100 pt-4 flex flex-col">
                      <span className="font-bold text-zinc-900 text-sm md:text-base truncate">
                        {t.customer_name}
                      </span>
                      {t.location && (
                        <span className="text-xs text-zinc-500 truncate">
                          {t.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute top-1/2 -left-4 md:-left-8 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center hover:bg-zinc-50 text-zinc-700 active:scale-95 transition-all z-20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute top-1/2 -right-4 md:-right-8 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 flex items-center justify-center hover:bg-zinc-50 text-zinc-700 active:scale-95 transition-all z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dot Indicators */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex ? 'w-6 bg-primary' : 'w-2 bg-amber-200 hover:bg-amber-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
