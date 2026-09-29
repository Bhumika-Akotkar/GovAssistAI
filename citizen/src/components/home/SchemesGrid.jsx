import { useEffect, useState } from "react";
import { getCatalog, normalizeSchemeForCatalog } from "../../lib/catalog";
import { SchemeCard } from "./SchemeCard";

export function SchemesGrid() {
  const [schemes, setSchemes] = useState(() => getCatalog().schemes || []);

  useEffect(() => {
    let active = true;

    async function loadSavedSchemes() {
      try {
        const res = await fetch("/api/schemes");
        if (!res.ok) return;

        const batch = await res.json();
        if (!active || !Array.isArray(batch)) return;

        const normalized = batch.map(normalizeSchemeForCatalog).filter(Boolean);
        if (normalized.length > 0) {
          setSchemes(normalized);
        }
      } catch (error) {
        console.warn("Could not load saved schemes for homepage:", error);
      }
    }

    loadSavedSchemes();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Schemes we cover</span>
          <h2>A growing list of government schemes</h2>
          <p>
            Central and state schemes, kept up to date with the latest rules.
            Tap any scheme to get guidance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {schemes.map((scheme, index) => (
            <div
              key={scheme.slug || scheme.id}
              className={`reveal ${index % 2 === 0 ? "" : "md:translate-y-2"}`}
            >
              <SchemeCard scheme={scheme} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
