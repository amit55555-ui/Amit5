'use client';

import { useRef, type RefObject } from 'react';
import { SwipeCard, type SwipeCardHandle } from './SwipeCard';
import type { Product, SwipeDirection } from '@/types';

interface Props {
  products: Product[];
  onSwipe: (dir: SwipeDirection) => void;
  topRef: RefObject<SwipeCardHandle | null>;
}

export default function CardStack({ products, onSwipe, topRef }: Props) {
  const visible = products.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      {[...visible].reverse().map((product, revIdx) => {
        const stackIdx = visible.length - 1 - revIdx; // 0=top, 1=mid, 2=back
        const isTop = stackIdx === 0;

        return (
          <div
            key={product.id}
            className="absolute inset-0 transition-transform duration-200"
            style={{
              transform: `translateY(${stackIdx * 12}px) scale(${1 - stackIdx * 0.05})`,
              zIndex: visible.length - stackIdx,
            }}
          >
            <SwipeCard
              ref={isTop ? topRef : undefined}
              product={product}
              isTop={isTop}
              onSwipe={onSwipe}
            />
          </div>
        );
      })}
    </div>
  );
}
