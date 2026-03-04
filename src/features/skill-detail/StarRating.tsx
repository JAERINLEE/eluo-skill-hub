'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoveredStar || value);

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => !disabled && onChange(star)}
            className={`transition-transform hover:scale-125 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <Star
              className={`w-6 h-6 ${
                isFilled
                  ? 'text-[#00007F] fill-current'
                  : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
