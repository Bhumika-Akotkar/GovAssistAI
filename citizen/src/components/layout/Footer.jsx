import { useLanguage } from '../../i18n/LanguageProvider';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { labelKey: 'footer.about', path: '/help#about' },
  { labelKey: 'footer.privacy', path: '/help#privacy' },
  { labelKey: 'footer.terms', path: '/help#terms' },
  { labelKey: 'footer.contact', path: '/help#contact' },
];

const FOOTER_LABELS = {
  en: { 
    'footer.about': 'About', 
    'footer.privacy': 'Privacy', 
    'footer.terms': 'Terms', 
    'footer.contact': 'Contact',
    'footer.disclaimer': 'Not an official government website. Information provided for guidance only.',
    'footer.rights': 'All rights reserved.'
  },
  hi: { 
    'footer.about': 'हमारे बारे में', 
    'footer.privacy': 'गोपनीयता', 
    'footer.terms': 'शर्तें', 
    'footer.contact': 'संपर्क',
    'footer.disclaimer': 'यह आधिकारिक सरकारी वेबसाइट नहीं है। जानकारी केवल मार्गदर्शन के लिए है।',
    'footer.rights': 'सर्वाधिकार सुरक्षित।'
  },
};

export function Footer() {
  const { language } = useLanguage();
  const labels = FOOTER_LABELS[language.code] || FOOTER_LABELS.en;

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="brand-col">
            <div className="logo">
              <span className="logo-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v6c0 5 3.8 8.5 9 9 5.2-.5 9-4 9-9V7l-9-5z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <span>Sahayak <em className="logo-em">Seva</em></span>
            </div>
            <p>An assistance service to help every citizen access government schemes and forms — in their own language, online or off, on web, voice, or WhatsApp.</p>
          </div>
          <div>
            <h5>Services</h5>
            <ul>
              <li><Link to="#">Ration card</Link></li>
              <li><Link to="#">PM-KISAN</Link></li>
              <li><Link to="#">Ayushman Bharat</Link></li>
              <li><Link to="#">Aadhaar updates</Link></li>
              <li><Link to="#">Scholarships</Link></li>
            </ul>
          </div>
          <div>
            <h5>Channels</h5>
            <ul>
              <li><Link to="#">Web chat</Link></li>
              <li><Link to="#">Voice call</Link></li>
              <li><Link to="#">WhatsApp bot</Link></li>
              <li><Link to="#">Offline call-in</Link></li>
            </ul>
          </div>
          <div>
            <h5>Support</h5>
            <ul>
              {FOOTER_LINKS.map(link => (
                <li key={link.path}>
                  <Link to={link.path}>{labels[link.labelKey]}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sahayak Seva · {labels['footer.rights']}</span>
          <span className="made"><span className="dot"></span> {labels['footer.disclaimer']}</span>
        </div>
      </div>
    </footer>
  );
}