import { getCatalog } from '../../lib/catalog';
import { SchemeCard } from './SchemeCard';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { useLanguage } from '../../i18n/LanguageProvider';
import { Link } from 'react-router-dom';

export function SchemesGrid() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Schemes we cover</span>
          <h2>A growing list of government schemes</h2>
          <p>Central and state schemes, kept up to date with the latest rules. Tap any scheme to get guidance.</p>
        </div>
        <div className="schemes-grid">
          <div className="scheme-card reveal" style={{'--accent-color': 'var(--forest)'}}>
            <div className="s-ic">🌾</div>
            <h4>PM-KISAN</h4>
            <p>Income support for farmer families</p>
          </div>
          <div className="scheme-card reveal reveal-d1" style={{'--accent-color': 'var(--terra)'}}>
            <div className="s-ic">🏥</div>
            <h4>Ayushman Bharat</h4>
            <p>Health cover up to ₹5 lakh per family</p>
          </div>
          <div className="scheme-card reveal reveal-d2" style={{'--accent-color': 'var(--sky)'}}>
            <div className="s-ic">🏠</div>
            <h4>PM Awas Yojana</h4>
            <p>Assistance for building a pucca house</p>
          </div>
          <div className="scheme-card reveal reveal-d3" style={{'--accent-color': 'var(--mustard)'}}>
            <div className="s-ic">🪪</div>
            <h4>Ration Card (NFSA)</h4>
            <p>Subsidised foodgrain for your household</p>
          </div>
          <div className="scheme-card reveal" style={{'--accent-color': 'var(--plum)'}}>
            <div className="s-ic">📄</div>
            <h4>Aadhaar Services</h4>
            <p>New enrolment and detail updates</p>
          </div>
          <div className="scheme-card reveal reveal-d1" style={{'--accent-color': 'var(--clay)'}}>
            <div className="s-ic">🏫</div>
            <h4>Student Scholarships</h4>
            <p>Pre- and post-matric scheme matching</p>
          </div>
          <div className="scheme-card reveal reveal-d2" style={{'--accent-color': 'var(--forest-3)'}}>
            <div className="s-ic">🔥</div>
            <h4>Ujjwala Yojana</h4>
            <p>Free LPG connection for rural households</p>
          </div>
          <div className="scheme-card reveal reveal-d3" style={{'--accent-color': 'var(--terra-3)'}}>
            <div className="s-ic">👷</div>
            <h4>MGNREGA</h4>
            <p>Guaranteed rural employment scheme</p>
          </div>
        </div>
      </div>
    </section>
  );
}