import { useLanguage } from '../../i18n/LanguageProvider';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { translate } from '../../lib/i18n';

export function SchemeCard({ scheme }) {
  const { language } = useLanguage();
  const title = translate(scheme.title, language.code);
  const summary = translate(scheme.summary, language.code);

  return (
    <Link to={`/chat?scheme=${scheme.slug}`} className="group">
      <Card className="p-5 h-full flex flex-col hover:shadow-lg transition-shadow group cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-3xl flex-shrink-0" aria-hidden="true">{scheme.icon}</span>
          <Pill variant="neutral" className="text-xs self-start">{scheme.category}</Pill>
        </div>
        <h3 className="font-display text-lg text-ink mb-2 group-hover:text-forest transition-colors">
          {title}
        </h3>
        <p className="text-sm text-ink-2 mb-4 flex-1 line-clamp-2">
          {summary}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <Pill variant={scheme.accent} className="text-xs">
            {scheme.estimatedDays} days
          </Pill>
          <span className="text-xs text-ink-3">Tap to learn more</span>
        </div>
      </Card>
    </Link>
  );
}