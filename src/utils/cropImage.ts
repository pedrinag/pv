// Função utilitária para crop de imagem (avatar) usando canvas
// Compatível com react-easy-crop

export default async function getCroppedImg(imageSrc: string, crop: { x: number, y: number, width: number, height: number }): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not found');

  // Usar diretamente os valores de crop (croppedAreaPixels)
  const { x, y, width, height } = crop;

  // O canvas terá o tamanho exato do crop
  canvas.width = width;
  canvas.height = height;

  // Crop circular
  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );
  ctx.restore();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/png');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
} 