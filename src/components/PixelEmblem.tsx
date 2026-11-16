import type { MinigameId } from '../game/types';

interface PixelEmblemProps {
  kind: MinigameId | 'brand';
  size?: number;
}

export function PixelEmblem({ kind, size = 36 }: PixelEmblemProps) {
  if (kind === 'brand') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="4" y="1" width="4" height="1" fill="#4B7366" />
        <rect x="2" y="2" width="2" height="1" fill="#4B7366" />
        <rect x="8" y="2" width="2" height="1" fill="#4B7366" />
        <rect x="1" y="4" width="1" height="4" fill="#6A78A3" />
        <rect x="10" y="4" width="1" height="4" fill="#6A78A3" />
        <rect x="4" y="4" width="4" height="4" fill="#6E9A8C" />
        <rect x="5" y="5" width="2" height="2" fill="#FAF9F5" />
        <rect x="2" y="9" width="2" height="1" fill="#4B7366" />
        <rect x="8" y="9" width="2" height="1" fill="#4B7366" />
        <rect x="4" y="10" width="4" height="1" fill="#4B7366" />
      </svg>
    );
  }

  if (kind === 'ecos') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="8" height="3" fill="#8AA999" />
        <rect x="8" y="8" width="2" height="1" fill="#DCE6E1" />
        <rect x="5" y="2" width="2" height="1" fill="#6E9A8C" />
        <rect x="4" y="3" width="4" height="2" fill="#9BBCAE" />
        <rect x="3" y="5" width="6" height="2" fill="#6E9A8C" />
        <rect x="5" y="4" width="2" height="2" fill="#FAF9F5" />
      </svg>
    );
  }

  if (kind === 'pulso') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="3" y="1" width="6" height="1" fill="#6A78A3" />
        <rect x="2" y="2" width="1" height="6" fill="#6A78A3" />
        <rect x="9" y="2" width="1" height="6" fill="#6A78A3" />
        <rect x="3" y="8" width="6" height="1" fill="#6A78A3" />
        <rect x="4" y="3" width="4" height="4" fill="#B8C4E3" />
        <rect x="5" y="4" width="2" height="2" fill="#FAF9F5" />
        <rect x="4" y="10" width="4" height="1" fill="#8AA999" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="5" y="1" width="2" height="1" fill="#7E6E63" />
      <rect x="3" y="2" width="6" height="6" fill="#C79B71" />
      <rect x="4" y="3" width="4" height="4" fill="#FAF9F5" />
      <rect x="5" y="4" width="2" height="2" fill="#E5C6A7" />
      <rect x="4" y="8" width="4" height="1" fill="#7E6E63" />
      <rect x="5" y="9" width="2" height="2" fill="#9E7856" />
    </svg>
  );
}
