import { getImageProps, type StaticImageData } from 'next/image';

/** A static import, or a path with the crop's dimensions (product images come from the database) */
type Source = StaticImageData | { src: string; width: number; height: number };

type Props = {
  /** The design's crop per breakpoint: mobile, tablet (md, 48rem), desktop (xl, 80rem) */
  mobile: Source;
  tablet: Source;
  desktop: Source;
  /** The rendered width per breakpoint, so each device downloads only the width it shows */
  sizes: string;
  /** The page's largest image: load it at once and first, instead of lazily */
  priority?: boolean;
  /** Cover the positioned parent (the hero) instead of sizing from the image */
  fill?: boolean;
  className?: string;
};

/**
 * One <picture> instead of three images hidden by CSS: the browser downloads only the crop for the
 * current breakpoint, even when it's loaded eagerly. Decorative (alt=""), like every product image
 * here: the product's name is always in the heading or link next to it.
 */
const ArtDirectedImage = ({
  mobile,
  tablet,
  desktop,
  sizes,
  priority = false,
  fill = false,
  className,
}: Props) => {
  const imageProps = (src: Source) =>
    getImageProps({
      src,
      alt: '',
      sizes,
      fill,
      priority,
      // getImageProps doesn't add the preload that <Image priority> does: ask for this request first
      ...(priority && { fetchPriority: 'high' as const }),
    }).props;
  const desktopProps = imageProps(desktop);
  const tabletProps = imageProps(tablet);
  const mobileProps = imageProps(mobile);

  // Each <source> carries `sizes` (without it the browser assumes 100vw) and its crop's dimensions.
  // `contents`: the <img> lays out as a direct child of the caller's element, as a plain image would
  // (a centring grid would otherwise shrink the <picture> and the image's w-full with it). The
  // sources are hidden, or they'd become empty grid items and add gaps; display doesn't affect which
  // source the browser picks.
  return (
    <picture className="contents">
      <source
        media="(min-width: 80rem)"
        className="hidden"
        srcSet={desktopProps.srcSet}
        sizes={sizes}
        width={desktopProps.width}
        height={desktopProps.height}
      />
      <source
        media="(min-width: 48rem)"
        className="hidden"
        srcSet={tabletProps.srcSet}
        sizes={sizes}
        width={tabletProps.width}
        height={tabletProps.height}
      />
      <img {...mobileProps} alt="" className={className} />
    </picture>
  );
};

export default ArtDirectedImage;
