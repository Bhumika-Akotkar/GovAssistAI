import { useLanguage } from '../../i18n/LanguageProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Link } from 'react-router-dom';

const CHANNELS = [
  { id: 'chat', icon: '💬', titleKey: 'channel.chat.title', descKey: 'channel.chat.desc', ctaKey: 'channel.chat.cta', path: '/chat' },
  { id: 'voice', icon: '🎙️', titleKey: 'channel.voice.title', descKey: 'channel.voice.desc', ctaKey: 'channel.voice.cta', path: '/voice' },
];

const CHANNEL_LABELS = {
  en: {
    'channel.chat.title': 'Text Chat',
    'channel.chat.desc': 'Type your questions and get step-by-step guidance instantly.',
    'channel.chat.cta': 'Open Chat',
    'channel.voice.title': 'Voice Assistant',
    'channel.voice.desc': 'Speak naturally in your language. Works with 10+ Indian languages.',
    'channel.voice.cta': 'Try Voice',
  },
  hi: {
    'channel.chat.title': 'टेक्स्ट चैट',
    'channel.chat.desc': 'अपने सवाल टाइप करें और तुरंत चरण-दर-चरण मार्गदर्शन पाएं।',
    'channel.chat.cta': 'चैट खोलें',
    'channel.voice.title': 'वॉयस असिस्टेंट',
    'channel.voice.desc': 'अपनी भाषा में स्वाभाविक रूप से बोलें। 10+ भारतीय भाषाओं में काम करता है।',
    'channel.voice.cta': 'आवाज़ आज़माएं',
  },
};

export function ChannelCards() {
  const { language, t } = useLanguage();
  const labels = CHANNEL_LABELS[language.code] || CHANNEL_LABELS.en;

  return (
    <section className="section section-sm">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Multiple ways to reach us</span>
          <h2>Whatever works for you</h2>
          <p>Some prefer to type, some to speak, some to call. We've made sure Sahayak Seva works the way you do.</p>
        </div>
        <div className="channels-grid">
          <Link to="/chat" className="channel-card reveal">
            <div className="ic-large" style={{background: 'rgba(91,143,185,.1)', border: '1px solid rgba(91,143,185,.2)'}}>💬</div>
            <h4>Text chat</h4>
            <p>Type in any of 12+ languages. The assistant replies in the same language, with document checklists.</p>
            <span className="meta">Available now</span>
          </Link>
          <Link to="/voice" className="channel-card reveal reveal-d1">
            <div className="ic-large" style={{background: 'rgba(198,93,59,.1)', border: '1px solid rgba(198,93,59,.2)'}}>🎙️</div>
            <h4>Voice call</h4>
            <p>Speak naturally. We understand accents, dialects, and mixed-language questions.</p>
            <span className="meta">Available now</span>
          </Link>
          <div className="channel-card reveal reveal-d2">
            <div className="ic-large" style={{background: 'rgba(37,211,102,.1)', border: '1px solid rgba(37,211,102,.25)'}}>📱</div>
            <h4>WhatsApp bot</h4>
            <p>Message us on WhatsApp and get the same guidance — no app download needed.</p>
            <span className="meta">Available now</span>
          </div>
          <div className="channel-card reveal reveal-d3">
            <div className="ic-large" style={{background: 'rgba(46,107,82,.1)', border: '1px solid rgba(46,107,82,.2)'}}>📞</div>
            <h4>Offline call-in</h4>
            <p>No internet? Call our toll-free number and get voice guidance in your language.</p>
            <span className="meta">Available now</span>
          </div>
        </div>
      </div>
    </section>
  );
}