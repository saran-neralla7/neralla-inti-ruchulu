export async function generateWhatsAppStatusImage(product: {
  name_en: string;
  name_te: string;
  gallery: string[];
  variants: { variantPrice: number; size: string }[];
}): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#3c1611'); // Maroon dark
  grad.addColorStop(0.5, '#501c15');
  grad.addColorStop(1, '#1f0705');  // Blackish maroon
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Decorative Circles (Subtle glows)
  ctx.fillStyle = 'rgba(245, 158, 11, 0.04)'; // Amber glow
  ctx.beginPath();
  ctx.arc(540, 600, 450, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(239, 68, 68, 0.03)'; // Red glow
  ctx.beginPath();
  ctx.arc(100, 1500, 300, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(980, 400, 250, 0, Math.PI * 2);
  ctx.fill();

  // Decorative border lines
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)'; // Amber line
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 1000, 1840);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 970, 1810);

  // 3. Draw Branding Logo Text at Top
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = '#f59e0b'; // Amber
  ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
  ctx.fillText('NERALLA INTI RUCHULU', 540, 180);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px "Inter", sans-serif';
  ctx.fillText('Premium Homemade Andhra Pickles & Foods', 540, 230);

  // 4. Product Image drawing logic
  const imgY = 750;
  const imgSize = 500;

  const drawProductImage = async (): Promise<void> => {
    return new Promise((resolve) => {
      if (product.gallery && product.gallery.length > 0) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          // Draw shadow/glow ring
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 15;

          // Draw gold ring
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.arc(540, imgY, (imgSize / 2) + 6, 0, Math.PI * 2);
          ctx.stroke();

          // Reset shadow for image clip
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Clip image to circle
          ctx.beginPath();
          ctx.arc(540, imgY, imgSize / 2, 0, Math.PI * 2);
          ctx.clip();

          // Draw the image scaled aspect fill
          const aspect = img.width / img.height;
          let drawW = imgSize;
          let drawH = imgSize;
          let drawX = 540 - imgSize / 2;
          let drawY = imgY - imgSize / 2;

          if (aspect > 1) {
            drawW = imgSize * aspect;
            drawX = 540 - drawW / 2;
          } else {
            drawH = imgSize / aspect;
            drawY = imgY - drawH / 2;
          }

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => {
          drawPlaceholderImage();
          resolve();
        };
        img.src = product.gallery[0];
      } else {
        drawPlaceholderImage();
        resolve();
      }
    });
  };

  const drawPlaceholderImage = () => {
    ctx.save();
    // Gold ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(540, imgY, (imgSize / 2) + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Fill with soft dark red
    ctx.fillStyle = '#501c15';
    ctx.beginPath();
    ctx.arc(540, imgY, imgSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Emoji in middle
    ctx.font = '160px serif';
    ctx.fillText('🌶️', 540, imgY);
    ctx.restore();
  };

  await drawProductImage();

  // 5. Product Details (Name English, Name Telugu, Price)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Outfit", "Inter", sans-serif';
  ctx.fillText(product.name_en, 540, 1150);

  ctx.fillStyle = '#f3f4f6';
  ctx.font = 'bold 48px "Inter", sans-serif';
  ctx.fillText(product.name_te, 540, 1230);

  // Price calculations
  const prices = product.variants.map((v) => v.variantPrice);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  
  if (minPrice > 0) {
    ctx.fillStyle = '#f59e0b'; // Amber/Gold
    ctx.font = 'bold 56px "Outfit", sans-serif';
    ctx.fillText(`Starting from ₹${minPrice}`, 540, 1340);
  }

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, 1450);
  ctx.lineTo(740, 1450);
  ctx.stroke();

  // 6. Bottom Banner
  ctx.fillStyle = 'rgba(93, 138, 60, 0.15)'; // Green glow border
  ctx.strokeStyle = '#5d8a3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(140, 1520, 800, 180, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Inter", sans-serif';
  ctx.fillText('📲 ORDER ON WHATSAPP', 540, 1580);

  ctx.fillStyle = '#a3e635'; // Lime green
  ctx.font = '30px "Inter", sans-serif';
  ctx.fillText('+91 8247843466', 540, 1645);

  // Handle download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NIR-Status-${product.name_en.replace(/\s+/g, '-')}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/png');
}
