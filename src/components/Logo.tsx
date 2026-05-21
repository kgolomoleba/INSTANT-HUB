import './Logo.css'

interface LogoProps {
  className?: string
  size?: number
  title?: string
}

export default function Logo({ className = '', size = 34, title = 'Instant Hub' }: LogoProps) {
  return (
    <svg
      className={`logo-mark ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="1" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="1" />
        </linearGradient>
      </defs>

      <polygon
        points="100,25 168,58 168,142 100,175 32,142 32,58"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1"
        opacity="0.25"
      />

      <line x1="100" y1="50" x2="148" y2="75" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="100" y1="50" x2="148" y2="125" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="100" y1="50" x2="100" y2="150" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="100" y1="50" x2="52" y2="125" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="100" y1="50" x2="52" y2="75" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="148" y1="75" x2="148" y2="125" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="148" y1="125" x2="100" y2="150" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="100" y1="150" x2="52" y2="125" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="52" y1="125" x2="52" y2="75" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />
      <line x1="52" y1="75" x2="100" y2="50" stroke="var(--gold)" strokeWidth="2" opacity="0.45" />

      <circle cx="100" cy="50" r="7" fill="url(#nodeGradient)" />
      <circle cx="148" cy="75" r="7" fill="url(#nodeGradient)" />
      <circle cx="148" cy="125" r="7" fill="url(#nodeGradient)" />
      <circle cx="100" cy="150" r="7" fill="url(#nodeGradient)" />
      <circle cx="52" cy="125" r="7" fill="url(#nodeGradient)" />
      <circle cx="52" cy="75" r="7" fill="url(#nodeGradient)" />

      <circle cx="100" cy="100" r="12" fill="url(#centerGradient)" />
      <circle cx="100" cy="100" r="6" fill="#fcd34d" opacity="0.8" />
    </svg>
  )
}
