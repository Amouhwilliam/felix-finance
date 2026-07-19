import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Minimal dropdown that opens a small sheet below its trigger.
// The dropdown is intentionally non-functional beyond visual selection state
// (as specified by the product brief).

export default function Dropdown({ label, options, value, onChange, align = 'center', testId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={testId}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-mint active:opacity-70"
      >
        <span>{current?.label ?? label}</span>
        <ChevronDown size={14} strokeWidth={2.4} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute z-40 mt-1 min-w-[180px] rounded-2xl border hairline bg-[#0B0B0B] py-1 ${
            align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange?.(o.value);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm ${
                o.value === value ? 'text-mint font-semibold' : 'text-white/85'
              } hover:bg-white/5`}
              data-testid={`${testId}-option-${o.value}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
