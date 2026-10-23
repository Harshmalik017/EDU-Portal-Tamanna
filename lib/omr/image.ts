/** Rotate an image file 90° clockwise. */
export async function rotate90(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = bmp.height; c.height = bmp.width;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.92));
  return new File([blob], file.name.replace(/\.\w+$/, "") + "-r.jpg", { type: "image/jpeg" });
}

/** Downscale + re-encode before upload so 200 students stay well inside the free 1 GB storage. */
export async function compress(file: File, max = 1800): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((r) => c.toBlob((b) => r(b!), "image/jpeg", 0.8));
}
