import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AVIF where the browser supports it (typically 20–30% smaller than WebP), WebP otherwise
    formats: ['image/avif', 'image/webp'],
    // The images only change with a deploy (and are named per product), so keep each optimised
    // size and format for 31 days instead of Next 15's 60 seconds: one transformation, not one per
    // cache expiry. Replacing an image under the same file name needs a new name to show at once.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
