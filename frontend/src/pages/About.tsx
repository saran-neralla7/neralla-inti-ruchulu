import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function About() {
  const { t, i18n } = useTranslation();
  const isTE = i18n.language === 'te';

  return (
    <div className={cn("w-full bg-background min-h-screen text-foreground", isTE && "leading-loose")}>
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center py-16 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5">
        <div className="absolute inset-0 z-0">
          <img
            src="/legacy-kitchen.jpg"
            alt="Spices background"
            className="w-full h-full object-cover opacity-10 filter sepia-[0.2] contrast-[1.1] brightness-[0.95]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center">
          <span className="font-semibold text-xs tracking-[0.2em] uppercase text-primary mb-3">
            {t('heritage.since')}
          </span>
          <h1 className="font-headline font-bold text-4xl md:text-6xl text-primary mb-6">
            {t('heritage.title')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {t('heritage.subtitle')}
          </p>
        </div>
      </section>

      {/* ─── Generational Story Section ─── */}
      <section className="py-20 container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Photos */}
          <div className="relative flex justify-center items-center">
            <div className="w-[85%] aspect-[4/5] bg-muted rounded-2xl overflow-hidden shadow-xl border border-border/50 rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
              <img
                src="/grandma_purple.jpg"
                alt="Grandmother mixing spices"
                className="w-full h-full object-cover filter sepia-[0.2] contrast-[1.1] brightness-[0.95]"
              />
            </div>
            <div className="absolute bottom-[-20px] right-2 w-[45%] aspect-square bg-background rounded-xl border-4 border-background shadow-2xl rotate-[5deg] overflow-hidden hidden md:block transition-transform duration-500 hover:rotate-0">
              <img
                src="/grandma_red.jpg"
                alt="Grandmother mixing pickles"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Story text */}
          <div className="space-y-6">
            <h2 className="font-headline font-bold text-3xl text-primary border-l-4 border-primary pl-5">
              {t('heritage.sec1_title')}
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
              {isTE && (
                <p className="font-semibold text-primary italic text-lg leading-relaxed">
                  'తరతరాలుగా వస్తున్న మా కుటుంబ సాంప్రదాయ వంటకాల రుచిని మీ ఇంటికి తీసుకువస్తున్నాము.'
                </p>
              )}
              <p>{t('heritage.sec1_p1')}</p>
              <p>{t('heritage.sec1_p2')}</p>
            </div>
            
            <div className="pt-2">
              <button className="inline-flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-full hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-95 group">
                <span className="font-semibold text-sm">{t('heritage.journal_cta')}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Process Gallery ─── */}
      <section className="py-20 bg-muted/30 border-y border-border/40">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl text-primary mb-3">
              {t('heritage.bento_title')}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {t('heritage.bento_desc')}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[750px] md:h-[550px]">
            {/* Orchard */}
            <div className="col-span-2 row-span-1 md:row-span-2 rounded-2xl overflow-hidden group border border-border/30 relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCUFKdgX3g3RH6SeM1gOg8-KEn9rkOrn46Xt8I-klbh97sVJB4el8P4xsOMjdFnvKBYnN8KrHwfPmOWoVRPeF8OdrcTNtKxtBHeXth3muIy4aOc8CnNNySoh0BDNfbwlSvkXgZfu8R77kmVqWe8bcDVb2kHksrUOl39jEsEXaLm0kwCdtmUTXYBNTwJI_nBS1anBsyb-6ohF-SehURkVqTTkws8L9LXUMs_5qGRmDTpmOV4ySHXrKVJovMNuVPd6fQTdFPjhZEsJeN"
                alt="Mango Orchard"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </div>

            {/* Spices */}
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden group border border-border/30 relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKdGUCWagXHVC1P9upSKZEe4lOPjwDHsxUdvbKqRn5Lsg8A3YnjVxA7YPLQ8hyZiYtEIJW_OD31LpK7WeS7KfuqSJWxPqNt2eIt0WXUODDAZcZo8r18qDhmlMwYK6IpmeELyZ-YqoWTYWmlKc46lfTzv-RsrjrNUEtomUfIG1i1Vi9p8dj0wQtBwRylQXB3I5OUx-j6i5SIzbbPlrbGy0gn2NnhAuiMuuDdGhaOdH9jb7htGWQeGphEyh5ePkqdO1Mc5Nq1WGpyqlz"
                alt="Spices"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Terraces */}
            <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden group border border-border/30 relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_w3_IzP4G2ZWTZFNvDbpr6txhPw24nRDkr2asSpX88rPiv5jeAcmDQMVhswHY1p5FvtpMp--Fm5dxsCW9jpxRc5qOAKF-_dLiQNVPXhw_vt01qDNX1IVc0oaJ4piagZCPUUmBtzVCYrdyexNObm7OyjIBK8V-zsx4kuT8DxmCHVPN9-kjnBKHLE8_MbhTK2YsQiAsePE3jzp_n0y5u1erqPeBTU9h8_9e7ioAxCfmIdeKQHVXJ_QVn1dO3qDFS8UdHvkqD_nere1p"
                alt="Terrace jars"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Thali */}
            <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden group border border-border/30 relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4A7kwENtnAA7kT7efiQ9KyDqi1iaJidvgroLzwgbMuX_mmyrAznLpNGbZHoXb-Vm_mrvuEiNHslyO1WTGz7cJhe3xJYAMiDtznWyBfisdAwp2VPgzqmEIPm-QpsezI5-ffltlhd10znEkyM2RPMEDkn71RhJZoNk_jEQgUCcA59W7_VGpUpi9uBRgF2nGeidV-UQDEg7D3XK2TaRjyW2BWndpA9S5lBs4YmK_6Jthd9krNADkhSMP0O8nmgFW7f_zBzaxEAES0e87"
                alt="Andhra Thali"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Location & Contact Section ─── */}
      <section className="py-20 container max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Contact Details */}
          <div className="space-y-8 order-2 md:order-1">
            <div>
              <h2 className="font-headline font-bold text-3xl text-primary mb-4">
                {t('heritage.visit_title')}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t('heritage.visit_desc')}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mt-1">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">Main Kitchen &amp; Store</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sector-2, MVP Colony, Visakhapatnam - 530017
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mt-1">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">Phone</p>
                  <p className="text-muted-foreground text-sm mt-1">+91 891 234 5678</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2.5 rounded-full bg-primary/10 text-primary mt-1">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">Email</p>
                  <p className="text-muted-foreground text-sm mt-1">neralla.intiruchulu@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Image Link */}
          <a
            href="https://maps.app.goo.gl/6fLrpno4gEKqSaaP8"
            target="_blank"
            rel="noopener noreferrer"
            className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-xl border border-border/50 order-1 md:order-2 bg-muted flex items-center justify-center group block cursor-pointer"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoj6ujwSCt1ZXvMmDKCZXMCWT_FVTEc2mPFq-BqcW9Z_On_gbXyoe1I4dDHFiN-sKY_7odDkXEGBzFFKk5muJUiCILkkyRHWNnWcwf4FzRris0Ej26qlqbGx0kROywOXB1-XmGaueRU-BL8vKM4JyCYmnxdPsOiOK0bITcMxnvLt-Z9VqrpYitC7gHw2g_6ciy6l4J3LE9tNDxQYlJSzeEIUTNtwT3cBNCWrzPKfWckjQxA8miEn0Cp0KvviBTU6gFdyKkUO0murJ6"
              alt="Map Visakhapatnam"
              className="w-full h-full object-cover opacity-75 filter grayscale group-hover:grayscale-0 transition-all duration-750"
            />
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute p-4 rounded-xl bg-background/95 backdrop-blur shadow-2xl flex flex-col items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
              <MapPin className="h-6 w-6 text-primary fill-primary/20 animate-bounce" />
              <span className="font-semibold text-xs text-primary uppercase tracking-wider">MVP Colony</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
