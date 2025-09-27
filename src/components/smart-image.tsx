"use client";

import React from "react";
import Image, { ImageProps } from "next/image";

export type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string;
  fallbackSrc?: string;
  forceUnoptimized?: boolean;
};

// A tiny blurred placeholder (1x1 PNG) – neutral light gray
const DEFAULT_BLUR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AApEBwO0aGxUAAAAASUVORK5CYII=";

export function SmartImage({
  src,
  alt,
  fallbackSrc = "https://placehold.co/1600x900/png?text=TripGenie",
  className,
  sizes,
  priority,
  placeholder = "blur",
  blurDataURL = DEFAULT_BLUR,
  forceUnoptimized = true,
  ...rest
}: SmartImageProps) {
  const [imgSrc, setImgSrc] = React.useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      className={className}
      sizes={sizes || "(max-width: 768px) 100vw, 800px"}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onError={() => setImgSrc(fallbackSrc)}
      unoptimized={forceUnoptimized}
    />
  );
}

export default SmartImage;
