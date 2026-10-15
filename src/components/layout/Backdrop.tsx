// The scene behind every page: dusk over red canyon country, a Horde palisade and watchtower on the ridge,
// embers drifting up from the cook fires. Original artwork drawn in SVG (no images to download).
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120a08" />
            <stop offset="0.45" stopColor="#2b100b" />
            <stop offset="0.68" stopColor="#5a1f10" />
            <stop offset="0.8" stopColor="#8a3a15" />
          </linearGradient>
          <radialGradient id="sun" cx="0.62" cy="0.72" r="0.35">
            <stop offset="0" stopColor="#e2862f" stopOpacity="0.55" />
            <stop offset="0.4" stopColor="#b44a1b" stopOpacity="0.25" />
            <stop offset="1" stopColor="#b44a1b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b2414" />
            <stop offset="1" stopColor="#3b140c" />
          </linearGradient>
          <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a150d" />
            <stop offset="1" stopColor="#1e0c08" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <rect width="1600" height="900" fill="url(#sun)" />

        {/* far mesas: flat-topped canyon walls */}
        <path
          fill="url(#far)"
          opacity="0.85"
          d="M0,640 L60,640 L80,560 L210,555 L232,640 L330,650 L350,590 L470,585 L500,660 L640,668 L668,600 L760,596 L790,672 L900,676 L930,612 L1080,606 L1110,680 L1230,684 L1258,575 L1400,570 L1428,670 L1520,676 L1545,620 L1600,618 L1600,900 L0,900 Z"
        />

        {/* middle ridge with the palisade and watchtower on the left */}
        <path
          fill="url(#mid)"
          d="M0,700 C120,640 260,600 400,602 C520,604 600,660 720,690 C860,724 980,700 1100,676 C1240,648 1380,664 1600,700 L1600,900 L0,900 Z"
        />
        <g fill="#1a0b07">
          <path d="M150,598 L157,542 L164,598 Z M163,598 L170,548 L177,598 Z M176,597 L183,539 L190,597 Z M189,597 L196,550 L203,597 Z M202,596 L209,548 L216,596 Z M215,596 L222,547 L229,596 Z M228,595 L235,538 L242,595 Z M241,595 L248,548 L255,595 Z M254,594 L261,532 L268,594 Z M267,594 L274,542 L281,594 Z M280,593 L287,546 L294,593 Z M293,593 L300,545 L307,593 Z M306,592 L313,533 L320,592 Z M319,592 L326,533 L333,592 Z M332,591 L339,543 L346,591 Z M345,591 L352,538 L359,591 Z M358,590 L365,542 L372,590 Z M371,590 L378,531 L385,590 Z M384,589 L391,542 L398,589 Z M397,589 L404,540 L411,589 Z M410,588 L417,535 L424,588 Z M423,588 L430,541 L437,588 Z M436,587 L443,529 L450,587 Z M449,587 L456,540 L463,587 Z M462,586 L469,533 L476,586 Z M475,585 L482,538 L489,585 Z M488,585 L495,535 L502,585 Z M501,584 L508,529 L515,584 Z M514,584 L521,525 L528,584 Z" />
          {/* watchtower */}
          <path d="M540,600 L548,480 L592,480 L600,600 Z" />
          <path d="M532,486 L570,446 L608,486 Z" />
          <rect x="566" y="420" width="3" height="30" />
        </g>
        {/* the tower's banner, catching the last light */}
        <path d="M569,421 L600,425 L590,433 L600,441 L569,437 Z" fill="#9b2318" />

        {/* foreground ground and rocks */}
        <path
          fill="#100907"
          d="M0,800 C200,760 380,780 560,800 C760,822 900,780 1080,770 C1260,760 1420,790 1600,780 L1600,900 L0,900 Z"
        />
        <path fill="#0c0705" d="M1180,790 L1230,742 L1262,760 L1300,730 L1350,790 Z M90,812 L130,770 L170,790 L200,812 Z" />

        {/* embers */}
        <g fill="#f0a24a">
          <circle cx="335" cy="836" r="1.4" className="ember" style={{ animationDuration: '11.8s', animationDelay: '-3.3s' }} />
          <circle cx="410" cy="612" r="2.1" className="ember" style={{ animationDuration: '14.8s', animationDelay: '-11.3s' }} />
          <circle cx="1161" cy="592" r="2.1" className="ember" style={{ animationDuration: '14.6s', animationDelay: '-9.1s' }} />
          <circle cx="1128" cy="778" r="2.4" className="ember" style={{ animationDuration: '13.2s', animationDelay: '-1.4s' }} />
          <circle cx="780" cy="713" r="1.6" className="ember" style={{ animationDuration: '10.6s', animationDelay: '-4.0s' }} />
          <circle cx="207" cy="854" r="1.7" className="ember" style={{ animationDuration: '13.5s', animationDelay: '-11.8s' }} />
          <circle cx="959" cy="707" r="2.2" className="ember" style={{ animationDuration: '9.7s', animationDelay: '-8.8s' }} />
          <circle cx="377" cy="735" r="1.4" className="ember" style={{ animationDuration: '13.4s', animationDelay: '-17.3s' }} />
          <circle cx="1408" cy="599" r="2.4" className="ember" style={{ animationDuration: '14.2s', animationDelay: '-2.2s' }} />
          <circle cx="682" cy="734" r="2.3" className="ember" style={{ animationDuration: '14.3s', animationDelay: '-7.6s' }} />
          <circle cx="974" cy="595" r="2.5" className="ember" style={{ animationDuration: '17.5s', animationDelay: '-9.5s' }} />
          <circle cx="1400" cy="593" r="1.3" className="ember" style={{ animationDuration: '15.3s', animationDelay: '-6.4s' }} />
          <circle cx="1435" cy="788" r="1.7" className="ember" style={{ animationDuration: '12.5s', animationDelay: '-6.0s' }} />
          <circle cx="86" cy="796" r="1.8" className="ember" style={{ animationDuration: '14.5s', animationDelay: '-9.1s' }} />
          <circle cx="486" cy="707" r="1.4" className="ember" style={{ animationDuration: '11.2s', animationDelay: '-11.0s' }} />
          <circle cx="1056" cy="601" r="1.5" className="ember" style={{ animationDuration: '12.6s', animationDelay: '-13.0s' }} />
          <circle cx="320" cy="780" r="2.6" className="ember" style={{ animationDuration: '11.5s', animationDelay: '-10.5s' }} />
          <circle cx="774" cy="754" r="2.7" className="ember" style={{ animationDuration: '10.4s', animationDelay: '-14.8s' }} />
        </g>
      </svg>

      {/* keep the top dark behind the header, and add a fine grain over everything */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,8,0.85)_0%,rgba(18,10,8,0.2)_40%,transparent_60%)]" />
      <div className="grain absolute inset-0" />
    </div>
  )
}
