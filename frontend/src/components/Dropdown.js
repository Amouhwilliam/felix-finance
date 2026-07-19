import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({ label, options, value, onChange, align = 'center', testId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={testId}
        className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-surface hover:bg-surface-2 text-[14px] font-semibold text-ink transition-colors"
      >
        <span>{current?.label ?? label}</span>
        <ChevronDown size={14} strokeWidth={2.4} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute z-40 mt-1 min-w-[200px] rounded-2xl border hairline bg-white shadow-lg py-1 ${
            align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange?.(o.value); setOpen(false); }}
              className={`block w-full px-4 py-2.5 text-left text-[14px] hover:bg-surface ${
                o.value === value ? 'font-semibold' : ''
              }`}
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
