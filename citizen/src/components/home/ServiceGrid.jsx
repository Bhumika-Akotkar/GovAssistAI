import { useLanguage } from '../../i18n/LanguageProvider';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';

const SERVICE_CATEGORIES = [
  { slug: 'agriculture', labelKey: 'cat.agriculture', icon: '🌾', accent: 'forest' },
  { slug: 'health', labelKey: 'cat.health', icon: '🏥', accent: 'terra' },
  { slug: 'housing', labelKey: 'cat.housing', icon: '🏠', accent: 'mustard' },
  { slug: 'food', labelKey: 'cat.food', icon: '🪪', accent: 'forest' },
  { slug: 'identity', labelKey: 'cat.identity', icon: '🆔', accent: 'sky' },
  { slug: 'education', labelKey: 'cat.education', icon: '🎓', accent: 'plum' },
  { slug: 'energy', labelKey: 'cat.energy', icon: '🔥', accent: 'terra' },
  { slug: 'employment', labelKey: 'cat.employment', icon: '🛠️', accent: 'forest' },
];

const CATEGORY_LABELS = {
  en: { 'cat.agriculture': 'Agriculture', 'cat.health': 'Health', 'cat.housing': 'Housing', 'cat.food': 'Food Security', 'cat.identity': 'Identity', 'cat.education': 'Education', 'cat.energy': 'Energy', 'cat.employment': 'Employment' },
  hi: { 'cat.agriculture': 'कृषि', 'cat.health': 'स्वास्थ्य', 'cat.housing': 'आवास', 'cat.food': 'खाद्य सुरक्षा', 'cat.identity': 'पहचान', 'cat.education': 'शिक्षा', 'cat.energy': 'ऊर्जा', 'cat.employment': 'रोजगार' },
  mr: { 'cat.agriculture': 'शेती', 'cat.health': 'आरोग्य', 'cat.housing': 'घर', 'cat.food': 'अन्न सुरक्षा', 'cat.identity': 'ओळख', 'cat.education': 'शिक्षण', 'cat.energy': 'ऊर्जा', 'cat.employment': 'रोजगार' },
  ta: { 'cat.agriculture': 'விவசாயம்', 'cat.health': 'நலன்', 'cat.housing': 'வீடு', 'cat.food': 'உணவு பாதுகாப்பு', 'cat.identity': 'அடையாளம்', 'cat.education': 'கல்வி', 'cat.energy': 'சக்தி', 'cat.employment': 'வேலை' },
  te: { 'cat.agriculture': 'వ్యవసాయం', 'cat.health': 'ఆరోగ్యం', 'cat.housing': 'వాసతి', 'cat.food': 'ఆహార సురక్ష', 'cat.identity': 'పేరుదల', 'cat.education': 'విద్య', 'cat.energy': 'శక్తి', 'cat.employment': 'ఉద్యోగాలు' },
  bn: { 'cat.agriculture': 'কৃষি', 'cat.health': 'স্বাস্থ্য', 'cat.housing': 'আবাসন', 'cat.food': 'খাদ্য নিরাপত্তা', 'cat.identity': 'পরিচয়', 'cat.education': 'শিক্ষা', 'cat.energy': 'শক্তি', 'cat.employment': 'রোজগার' },
  gu: { 'cat.agriculture': 'કૃષિ', 'cat.health': 'સ્વાસ્થ્ય', 'cat.housing': 'ગૃহ', 'cat.food': 'ખાદ્ય સુરક્ષા', 'cat.identity': 'પરિચય', 'cat.education': 'શિક્ષણ', 'cat.energy': 'ઊર્જા', 'cat.employment': 'રોજગાર' },
  kn: { 'cat.agriculture': 'ಕೃಷಿ', 'cat.health': 'ಆರೋಗ್ಯ', 'cat.housing': 'ನಿವಾಸ', 'cat.food': 'ಆಹಾರ ಸುರಕ್ಷತೆ', 'cat.identity': 'ಪರ್ಚಯ', 'cat.education': 'ಶಿಕ್ಷಣ', 'cat.energy': 'ಶಕ್ತಿ', 'cat.employment': 'ಉದ್ಯೋಗ' },
  ml: { 'cat.agriculture': 'കൃഷി', 'cat.health': 'ആരോഗ്യം', 'cat.housing': 'വാസം', 'cat.food': 'ഭക്ഷ്യ സുരക്ഷ', 'cat.identity': 'തിരിച്ചറിവ്', 'cat.education': 'വിദ്യാഭ്യാസം', 'cat.energy': 'ഊർജ്ജം', 'cat.employment': 'തൊഴിൽ' },
  pa: { 'cat.agriculture': 'ਖੇਤੀ', 'cat.health': 'ਸਿਹਤ', 'cat.housing': 'ਘਰ', 'cat.food': 'ਭੋਜਨ ਸੁਰੱਖਿਆ', 'cat.identity': 'ਪਹਿਚਾਣ', 'cat.education': 'ਸ਼ਿਕਸ਼ਾ', 'cat.energy': 'ਊਰਜਾ', 'cat.employment': 'ਰੋਜ਼ਗਾਰ' },
  or: { 'cat.agriculture': 'କୃଷି', 'cat.health': 'ସ୍ୱାସ୍ଥ୍ୟ', 'cat.housing': 'ଆବାସ', 'cat.food': 'ଖାଦ୍ୟ ସୁରକ୍ଷା', 'cat.identity': 'ପରିଚୟ', 'cat.education': 'ଶିକ୍ଷା', 'cat.energy': 'ଶକ୍ତି', 'cat.employment': 'ରୋଜଗାର' },
  as: { 'cat.agriculture': 'কৃষি', 'cat.health': 'স্বাস্থ্য', 'cat.housing': 'গৃহ', 'cat.food': 'খাদ্য সুৰক্ষা', 'cat.identity': 'পৰিচয়', 'cat.education': 'শিক্ষা', 'cat.energy': 'শক্তি', 'cat.employment': 'ৰজগাৰ' },
};

export function ServiceGrid() {
  const { language } = useLanguage();
  const labels = CATEGORY_LABELS[language.code] || CATEGORY_LABELS.en;

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Popular services</span>
          <h2>What would you like help with?</h2>
          <p>Tap any card to get step-by-step guidance — with the exact documents, eligibility, and procedures explained in plain language.</p>
        </div>
        <div className="services">
          <Link to="/chat?service=ration-card" className="service reveal" style={{ '--accent-color': 'var(--forest)' }}>
            <div className="service-ic">🪪</div>
            <h4>Ration Card</h4>
            <p>Apply for a new ration card or update your existing one. We'll walk you through every document and form.</p>
            <div className="service-foot">
              <span className="service-tag">NFSA · Food</span>
              <span className="service-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
          <Link to="/chat?service=pm-kisan" className="service reveal reveal-d1" style={{ '--accent-color': 'var(--terra)' }}>
            <div className="service-ic">🌾</div>
            <h4>PM-KISAN</h4>
            <p>Check your instalment status, register for income support, or update your bank details.</p>
            <div className="service-foot">
              <span className="service-tag">Farmers · Income</span>
              <span className="service-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
          <Link to="/chat?service=ayushman-bharat" className="service reveal reveal-d2" style={{ '--accent-color': 'var(--sky)' }}>
            <div className="service-ic">🏥</div>
            <h4>Ayushman Bharat</h4>
            <p>Find empanelled hospitals, check your eligibility, and get your health card.</p>
            <div className="service-foot">
              <span className="service-tag">Health · Insurance</span>
              <span className="service-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
          <Link to="/chat?service=aadhaar" className="service reveal" style={{ '--accent-color': 'var(--mustard)' }}>
            <div className="service-ic">📄</div>
            <h4>Aadhaar Services</h4>
            <p>Update your address, name, or mobile number. Find the nearest enrolment centre.</p>
            <div className="service-foot">
              <span className="service-tag">Identity · Update</span>
              <span className="service-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
          <Link to="/chat?service=scholarships" className="service reveal reveal-d1" style={{ '--accent-color': 'var(--plum)' }}>
            <div className="service-ic">🏫</div>
            <h4>Student Scholarships</h4>
            <p>State and central schemes matched to your profile, with deadlines and eligibility.</p>
            <div className="service-foot">
              <span className="service-tag">Education · Students</span>
              <span className="service-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}