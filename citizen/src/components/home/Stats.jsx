import { useLanguage } from '../../i18n/LanguageProvider';

const STATS = [
  { value: '8', labelKey: 'stat.schemes' },
  { value: '12', labelKey: 'stat.languages' },
  { value: '100%', labelKey: 'stat.offline' },
];

const STAT_LABELS = {
  en: { 'stat.schemes': 'Schemes', 'stat.languages': 'Languages', 'stat.offline': 'Offline-first' },
  hi: { 'stat.schemes': 'योजनाएं', 'stat.languages': 'भाषाएं', 'stat.offline': 'ऑफ़लाइन-फर्स्ट' },
  mr: { 'stat.schemes': 'योजना', 'stat.languages': 'भाषा', 'stat.offline': 'ऑफलाइन-फर्स्ट' },
  ta: { 'stat.schemes': 'திட்டங்கள்', 'stat.languages': 'மொழிகள்', 'stat.offline': 'ஆஃப்லைன்-முதல்' },
  te: { 'stat.schemes': 'పథకాలు', 'stat.languages': 'భాషలు', 'stat.offline': 'ఆఫ్లైన్-ప్రథమ' },
  bn: { 'stat.schemes': 'যোজনাসমূহ', 'stat.languages': 'ভাষাসমূহ', 'stat.offline': 'অফলাইন-প্রথম' },
  gu: { 'stat.schemes': 'યોજનાઓ', 'stat.languages': 'ભાષાઓ', 'stat.offline': 'ઓફલાઈન-પ્રથમ' },
  kn: { 'stat.schemes': 'ಯೋಜನೆಗಳು', 'stat.languages': 'ಭಾಷೆಗಳು', 'stat.offline': 'ಆಫ್‌ಲೈನ್-ಪ್ರಥಮ' },
  ml: { 'stat.schemes': 'സ്കീമുകൾ', 'stat.languages': 'ഭാഷകൾ', 'stat.offline': 'ഓഫ്‌ലൈൻ-ഫസ്റ്റ്' },
  pa: { 'stat.schemes': 'ਸਕੀਮਾਂ', 'stat.languages': 'ਭਾਸ਼ਾਵਾਂ', 'stat.offline': 'ਅਫ਼ਲਾਈਨ-ਫਸਟ' },
  or: { 'stat.schemes': 'ଯୋଜନାଗୁଡିକ', 'stat.languages': 'ଭାଷାଗୁଡିକ', 'stat.offline': 'ଅଫଲାଇନ୍-ପ୍ରଥମ' },
  as: { 'stat.schemes': 'যোজনাবোৰ', 'stat.languages': 'ভাষাবোৰ', 'stat.offline': 'অফলাইন-প্ৰথম' },
};

export function Stats() {
  const { language } = useLanguage();
  const labels = STAT_LABELS[language.code] || STAT_LABELS.en;

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">By the numbers</span>
          <h2>Trusted by citizens across India</h2>
        </div>
        <div className="stats reveal">
          <div className="stat">
            <div className="num">12<em>+</em></div>
            <div className="lbl">{labels['stat.languages']} supported for text and voice</div>
          </div>
          <div className="stat">
            <div className="num">3.2<em>L</em></div>
            <div className="lbl">Citizens assisted since launch</div>
          </div>
          <div className="stat">
            <div className="num">500<em>+</em></div>
            <div className="lbl">{labels['stat.schemes']} covered and updated</div>
          </div>
          <div className="stat">
            <div className="num">24<em>×7</em></div>
            <div className="lbl">{labels['stat.offline']} availability via web and WhatsApp</div>
          </div>
        </div>
      </div>
    </section>
  );
}