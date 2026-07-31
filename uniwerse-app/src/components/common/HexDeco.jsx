// Decorative hex line-art SVGs, ported from the original static demo.
// Kept as small standalone components so pages can drop them in without
// cluttering the JSX with inline SVG.

export function EntryLeftDeco(props) {
  return (
    <svg className="hex-deco tl" width="230" height="175" viewBox="0 0 195 145" fill="none" {...props}>
      <polygon points="74.5,19 74.5,45 52,58 29.5,45 29.5,19 52,6" stroke="#4B8B6B" strokeWidth="1.3" />
      <polygon points="119.5,19 119.5,45 97,58 74.5,45 74.5,19 97,6" stroke="#3E6FA6" strokeWidth="1.3" />
      <polygon points="164.6,19 164.6,45 142.1,58 119.6,45 119.6,19 142.1,6" stroke="#C74E63" strokeWidth="1.3" />
      <polygon points="52,58 52,84 29.5,97 7,84 7,58 29.5,45" stroke="#3E6FA6" strokeWidth="1.3" />
      <polygon points="97,58 97,84 74.5,97 52,84 52,58 74.5,45" stroke="#C74E63" strokeWidth="1.3" fill="#C74E63" fillOpacity="0.08" />
      <polygon points="142,58 142,84 119.5,97 97,84 97,58 119.5,45" stroke="#4B8B6B" strokeWidth="1.3" />
      <polygon points="187.1,58 187.1,84 164.6,97 142.1,84 142.1,58 164.6,45" stroke="#3E6FA6" strokeWidth="1.3" />
      <polygon points="74.5,97 74.5,123 52,136 29.5,123 29.5,97 52,84" stroke="#C74E63" strokeWidth="1.3" />
      <polygon points="119.5,97 119.5,123 97,136 74.5,123 74.5,97 97,84" stroke="#4B8B6B" strokeWidth="1.3" fill="#4B8B6B" fillOpacity="0.08" />
      <polygon points="164.6,97 164.6,123 142.1,136 119.6,123 119.6,97 142.1,84" stroke="#3E6FA6" strokeWidth="1.3" />
      <line x1="52" y1="32" x2="97" y2="32" stroke="#DAD6C9" strokeWidth="0.8" />
      <line x1="97" y1="32" x2="74.5" y2="71" stroke="#DAD6C9" strokeWidth="0.8" />
      <line x1="74.5" y1="71" x2="119.5" y2="71" stroke="#DAD6C9" strokeWidth="0.8" />
      <line x1="119.5" y1="71" x2="97" y2="110" stroke="#DAD6C9" strokeWidth="0.8" />
      <circle cx="52" cy="32" r="2.3" fill="#4B8B6B" />
      <circle cx="97" cy="32" r="2.3" fill="#3E6FA6" />
      <circle cx="74.5" cy="71" r="2.3" fill="#C74E63" />
      <circle cx="119.5" cy="71" r="2.3" fill="#4B8B6B" />
      <circle cx="97" cy="110" r="2.3" fill="#3E6FA6" />
    </svg>
  );
}

export function EntryRightDeco(props) {
  return (
    <svg className="hex-deco br" width="220" height="220" viewBox="0 0 220 220" fill="none" {...props}>
      <polygon points="150,120 182,138 182,174 150,192 118,174 118,138" stroke="#C74E63" strokeWidth="1.6" />
      <polygon points="70,150 96,164 96,192 70,206 44,192 44,164" stroke="#4B8B6B" strokeWidth="1.6" />
      <line x1="150" y1="120" x2="130" y2="90" stroke="#3E6FA6" strokeWidth="1.2" />
    </svg>
  );
}

export function SmallHex({ stroke = '#3E6FA6', className = 'hex-deco tl', ...props }) {
  return (
    <svg className={className} width="150" height="150" viewBox="0 0 150 150" fill="none" {...props}>
      <polygon points="35,4 62,20 62,52 35,68 8,52 8,20" stroke={stroke} strokeWidth="1.6" />
      <circle cx="35" cy="4" r="2.5" fill={stroke} />
    </svg>
  );
}

export function LoginDeco(props) {
  return (
    <svg className="hex-deco tl" width="150" height="150" viewBox="0 0 150 150" fill="none" {...props}>
      <polygon points="35,4 62,20 62,52 35,68 8,52 8,20" stroke="#4B8B6B" strokeWidth="1.6" />
      <polygon points="90,40 112,53 112,79 90,92 68,79 68,53" stroke="#C74E63" strokeWidth="1.4" />
    </svg>
  );
}

export function LoginRightDeco(props) {
  return (
    <svg className="hex-deco tr" width="180" height="180" viewBox="0 0 180 180" fill="none" {...props}>
      <polygon points="140,10 168,26 168,58 140,74 112,58 112,26" stroke="#3E6FA6" strokeWidth="1.6" />
    </svg>
  );
}

export function GuestDeco(props) {
  return (
    <svg className="hex-deco tl" width="140" height="140" viewBox="0 0 140 140" fill="none" {...props}>
      <polygon points="32,4 58,19 58,49 32,64 6,49 6,19" stroke="#C74E63" strokeWidth="1.6" />
    </svg>
  );
}

export function RoleTopRightDeco(props) {
  return (
    <svg className="hex-deco tr" width="180" height="180" viewBox="0 0 220 220" fill="none" {...props}>
      <polygon points="150,120 182,138 182,174 150,192 118,174 118,138" stroke="#C74E63" strokeWidth="1.6" />
    </svg>
  );
}
