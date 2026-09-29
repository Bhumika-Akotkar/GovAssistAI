import { useLanguage } from "../../i18n/LanguageProvider";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Pill } from "../ui/Pill";
import { Button } from "../ui/Button";
import { translate } from "../../lib/i18n";

const ACCENT_STYLES = {
  forest: "from-forest/25 via-forest/10 to-white",
  terra: "from-terra/25 via-terra/10 to-white",
  mustard: "from-mustard/25 via-mustard/10 to-white",
  sky: "from-sky/25 via-sky/10 to-white",
  plum: "from-plum/25 via-plum/10 to-white",
  default: "from-paper-2 via-white to-white",
};

export function SchemeCard({ scheme }) {
  const { language } = useLanguage();
  const title = translate(scheme.title || { en: scheme.name }, language.code);
  const summary = translate(
    scheme.summary || { en: scheme.description },
    language.code,
  );
  const category = scheme.category || scheme.sector || "Scheme";
  const accent = ACCENT_STYLES[scheme.accent] || ACCENT_STYLES.default;
  const image =
    scheme.image ||
    (Array.isArray(scheme.images) && scheme.images.length > 0
      ? scheme.images[0]
      : null);
  const schemeUrl =
    scheme.officialUrl ||
    scheme.siteUrl ||
    `/chat?scheme=${scheme.slug || scheme.id}`;

  return (
    <Card className="group h-full overflow-hidden border border-line bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-36  overflow-hidden border-b border-line bg-gradient-to-br from-paper-2 via-white to-white">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${accent} text-4xl`}
          >
            <span aria-hidden="true">{scheme.icon || "🏛️"}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 via-black/10 to-transparent p-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm">
            {category}
          </span>
       
        </div>
      </div>

      <div className="flex flex-col p-5">
        <h3 className="mb-2 font-display text-lg text-ink line-clamp-2">
          {title}
        </h3>
        <p className="mb-4 flex-1 text-sm leading-6 text-ink-2 line-clamp-3">
          {summary}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link
            to={`/chat?scheme=${scheme.slug || scheme.id}`}
            className="block"
          >
            <Button variant="primary" size="sm" className="w-full">
              Details
            </Button>
          </Link>
          <a
            href={schemeUrl}
            target={schemeUrl.startsWith("http") ? "_blank" : undefined}
            rel={schemeUrl.startsWith("http") ? "noreferrer" : undefined}
            className="block"
          >
            <Button variant="secondary" size="sm" className="w-full">
              Apply now
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
