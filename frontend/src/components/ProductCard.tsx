import { ShoppingCart, Leaf, Star, Flame } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import type { Product } from '@/types';
import { useTranslation } from 'react-i18next';
import { cn, getProductSpiceLevel } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { i18n } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const isTE = i18n.language === 'te';
  const name = isTE ? product.name_te : product.name_en;
  const description = isTE ? product.description_te : product.description_en;

  const variant = product.variants[selectedVariantIndex];
  const isAvailable = product.status === 'Available';

  const spiceInfo = getProductSpiceLevel(product.name_en);

  const handleAddToCart = () => {
    if (!variant || !isAvailable) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      name_en: product.name_en,
      name_te: product.name_te,
      size: variant.size,
      packaging: variant.packaging,
      price: variant.variantPrice + variant.packagingCharge,
      quantity: 1,
      image: product.gallery[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const labelColors: Record<string, string> = {
    Bestseller: 'bg-amber-100 text-amber-800 border-amber-200',
    'New Arrival': 'bg-green-100 text-green-800 border-green-200',
    Seasonal: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="relative h-52 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 block">
        {product.gallery[0] ? (
          <img
            src={product.gallery[0]}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Leaf className="h-16 w-16 text-primary/20" />
          </div>
        )}
        {/* Status/Label badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.label && (
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', labelColors[product.label] ?? 'bg-primary/10 text-primary border-primary/20')}>
              {product.label === 'Bestseller' && <Star className="inline h-3 w-3 mr-0.5 mb-0.5" />}
              {product.label}
            </span>
          )}
          {!isAvailable && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
              {product.status}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="space-y-1">
          <Link to={`/products/${product.id}`} className="hover:text-primary transition-colors block">
            <h3 className="font-headline font-semibold text-lg text-foreground leading-snug group-hover:text-primary transition-colors">{name}</h3>
          </Link>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>

        {/* Spice Level & Rating Stars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={cn('px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase flex items-center gap-1', spiceInfo.color)}>
              {spiceInfo.key === 'fire' && <Flame className="h-3.5 w-3.5 fill-current" />}
              {isTE ? spiceInfo.labelTe : spiceInfo.labelEn}
            </span>
          </div>

          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={cn('h-3.5 w-3.5', idx < Math.floor(spiceInfo.rating) ? 'fill-current' : 'text-zinc-200')}
              />
            ))}
            <span className="text-[11px] text-muted-foreground ml-1 font-bold">({spiceInfo.reviews})</span>
          </div>
        </div>

        {/* Variant selector */}
        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantIndex(i)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  i === selectedVariantIndex
                    ? 'bg-primary text-white border-primary'
                    : 'border-border/60 text-muted-foreground hover:border-primary/40'
                )}
              >
                {v.size} · {v.packaging}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            {variant && (
              <>
                <span className="text-xl font-bold text-primary">
                  ₹{(variant.variantPrice + variant.packagingCharge).toFixed(0)}
                </span>
                {variant.packagingCharge > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">incl. pkg</span>
                )}
              </>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!isAvailable || !variant}
            className={cn(
              'rounded-full gap-1.5 transition-all px-4',
              added ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-primary hover:bg-primary/90 text-white'
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            {added ? 'Added!' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  );
}
