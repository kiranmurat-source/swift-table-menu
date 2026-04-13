interface AnimatedLogoProps {
  size?: number;
  message?: string;
  showText?: boolean;
}

const AnimatedLogo = ({ size = 80, message, showText = true }: AnimatedLogoProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes l1{0%,100%{fill:#1C1C1E}10%,30%{fill:#FF4F7A}}
          @keyframes l2{0%,100%{fill:#1C1C1E}35%,55%{fill:#FF4F7A}}
          @keyframes l3{0%,100%{fill:#1C1C1E}60%,80%{fill:#FF4F7A}}
          @keyframes l4{0%,100%{fill:#1C1C1E}85%,95%{fill:#FF4F7A}}
        `}</style>

        <rect x="20" y="20" width="80" height="80" rx="16" fill="none" stroke="#1C1C1E" strokeWidth="3"/>
        <line x1="40" y1="40" x2="80" y2="40" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="40" y1="80" x2="80" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="40" y1="40" x2="40" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <line x1="80" y1="40" x2="80" y2="80" stroke="#1C1C1E" strokeWidth="2.5"/>
        <circle cx="40" cy="40" r="7" style={{ animation: 'l1 2s ease-in-out infinite' }}/>
        <circle cx="80" cy="40" r="7" style={{ animation: 'l2 2s ease-in-out infinite' }}/>
        <circle cx="80" cy="80" r="7" style={{ animation: 'l3 2s ease-in-out infinite' }}/>
        <circle cx="40" cy="80" r="7" style={{ animation: 'l4 2s ease-in-out infinite' }}/>
      </svg>

      {showText && (
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: `${Math.max(18, size * 0.3)}px`,
          fontWeight: 700,
          color: '#1C1C1E',
          letterSpacing: '-0.5px'
        }}>
          Tab<span style={{ color: '#FF4F7A' }}>b</span>led
        </div>
      )}


    </div>
  );
};

export default AnimatedLogo;
