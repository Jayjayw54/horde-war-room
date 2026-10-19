// The scene behind every page: dusk over a mountain frontier. A stone keep and wall hold the ridge,
// a crimson banner on the tower, a few embers drifting up from the watch fires.
// Faction-neutral, original artwork drawn in SVG (nothing to download). Kept dark so text stays readable.

// Embers: [x, y, radius, seconds, delay]. A handful only: atmosphere, not a light show.
const EMBERS: [number, number, number, number, number][] = [
  [410, 640, 1.8, 15, -11],
  [598, 590, 1.6, 13, -4],
  [640, 610, 2.0, 16, -9],
  [700, 700, 1.4, 12, -2],
  [980, 720, 1.6, 14, -7],
  [1180, 760, 1.9, 13, -12],
  [1420, 700, 1.5, 15, -5],
  [260, 780, 1.6, 12, -8],
]

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c0e10" />
            <stop offset="0.42" stopColor="#16191c" />
            <stop offset="0.6" stopColor="#2c2326" />
            <stop offset="0.72" stopColor="#5a3027" />
            <stop offset="0.78" stopColor="#7a4029" />
          </linearGradient>
          <radialGradient id="glow" cx="0.36" cy="0.7" r="0.4">
            <stop offset="0" stopColor="#c47a42" stopOpacity="0.4" />
            <stop offset="0.45" stopColor="#963f43" stopOpacity="0.16" />
            <stop offset="1" stopColor="#762f32" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="peaks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#25272a" />
            <stop offset="1" stopColor="#17191b" />
          </linearGradient>
          <linearGradient id="farpeaks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3033" />
            <stop offset="1" stopColor="#2a2325" />
          </linearGradient>
          <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141618" />
            <stop offset="1" stopColor="#0e1012" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <rect width="1600" height="900" fill="url(#glow)" />

        {/* far range, hazy in the dusk */}
        <path
          fill="url(#farpeaks)"
          opacity="0.8"
          d="M0,610 L60,585 L110,598 L180,540 L215,556 L250,520 L300,566 L360,548 L420,590 L500,560 L560,578 L650,530 L700,552 L760,515 L800,540 L870,526 L940,566 L1010,540 L1080,572 L1150,524 L1190,540 L1240,498 L1290,535 L1360,520 L1420,560 L1490,540 L1560,575 L1600,560 L1600,900 L0,900 Z"
        />
        {/* near mountains: jagged */}
        <path
          fill="url(#peaks)"
          d="M0,660 L70,600 L105,622 L150,575 L190,604 L240,548 L272,570 L300,530 L338,584 L372,566 L410,610 L470,640 L560,640 L640,604 L690,622 L740,580 L790,610 L850,560 L885,588 L930,574 L990,630 L1050,598 L1095,618 L1160,560 L1205,586 L1262,520 L1300,560 L1338,546 L1390,598 L1450,576 L1520,630 L1600,605 L1600,900 L0,900 Z"
        />
        {/* snow catching the last light */}
        <path fill="#4a4446" opacity="0.55" d="M300,530 L318,556 L305,552 L294,562 L284,548 Z M1262,520 L1281,548 L1268,544 L1256,556 L1246,542 Z M850,560 L864,580 L853,577 L843,586 L836,575 Z" />

        {/* the ridge the stronghold stands on */}
        <path
          fill="url(#ridge)"
          d="M0,720 C140,670 300,640 470,640 C600,640 690,690 820,705 C960,722 1080,690 1220,672 C1360,655 1480,676 1600,700 L1600,900 L0,900 Z"
        />

        {/* stronghold: curtain wall with crenellations, a square keep and a tall watchtower */}
        <g fill="#0a0b0d">
          <path d="M300,646 L300,612 L308,612 L308,604 L316,604 L316,612 L330,612 L330,604 L338,604 L338,612 L352,612 L352,604 L360,604 L360,612 L374,612 L374,604 L382,604 L382,612 L396,612 L396,604 L404,604 L404,612 L418,612 L418,604 L426,604 L426,612 L440,612 L440,604 L448,604 L448,612 L462,612 L462,604 L470,604 L470,612 L484,612 L484,604 L492,604 L492,612 L506,612 L506,604 L514,604 L514,612 L540,612 L540,646 Z" />
          {/* keep */}
          <path d="M420,612 L420,560 L426,560 L426,552 L434,552 L434,560 L446,560 L446,552 L454,552 L454,560 L466,560 L466,552 L474,552 L474,560 L480,560 L480,612 Z" />
          {/* watchtower */}
          <path d="M540,646 L546,520 L540,520 L540,510 L548,510 L548,503 L556,503 L556,510 L566,510 L566,503 L574,503 L574,510 L584,510 L584,503 L592,503 L592,510 L600,510 L600,520 L594,520 L600,646 Z" />
          <rect x="569" y="452" width="2.5" height="52" />
        </g>
        {/* lit windows */}
        <g fill="#b3683a" opacity="0.75">
          <rect x="446" y="578" width="4" height="7" />
          <rect x="566" y="540" width="4" height="8" />
          <rect x="566" y="580" width="4" height="8" />
        </g>
        {/* the banner on the tower */}
        <path d="M571.5,454 L604,457 L596,466 L604,475 L571.5,472 Z" fill="#762f32" />

        {/* foreground */}
        <path fill="#0b0c0e" d="M0,810 C220,772 400,790 580,808 C780,828 920,792 1100,780 C1280,768 1430,798 1600,788 L1600,900 L0,900 Z" />

        <g fill="#d9935a">
          {EMBERS.map(([cx, cy, r, s, d], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} className="ember" style={{ animationDuration: `${s}s`, animationDelay: `${d}s` }} />
          ))}
        </g>
      </svg>

      {/* keep the top dark behind the header and the middle calm behind content; fine grain over everything */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,19,21,0.92)_0%,rgba(17,19,21,0.55)_35%,rgba(17,19,21,0.15)_70%)]" />
      <div className="grain absolute inset-0" />
    </div>
  )
}
