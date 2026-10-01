import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconName = 'anchor' | 'pause' | 'play' | 'book' | 'skin' | 'settings' | 'sound' | 'sound-off' | 'exit' | 'arrow' | 'check' | 'moon';

const iconGlyph: Record<IconName, string> = {
  anchor: '⚓',
  pause: 'Ⅱ',
  play: '▶',
  book: '▤',
  skin: '◒',
  settings: '⚙',
  sound: '◖))',
  'sound-off': '◖×',
  exit: '↗',
  arrow: '→',
  check: '✓',
  moon: '◐',
};

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <span className="icon" aria-hidden={label ? undefined : true} aria-label={label}>
      {iconGlyph[name]}
    </span>
  );
}

export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button className={`action-button action-${variant} action-${size} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ name, label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { name: IconName; label: string }) {
  return (
    <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      <Icon name={name} />
    </button>
  );
}

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {detail && <p className="section-detail">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'premium' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  labels,
  ariaLabel,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option}
          className={value === option ? 'segment is-active' : 'segment'}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-mark">~</span>
      <h2>{title}</h2>
      <p>{detail}</p>
      {action}
    </div>
  );
}
