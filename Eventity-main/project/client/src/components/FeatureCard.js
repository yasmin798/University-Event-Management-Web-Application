// client/src/components/FeatureCard.js
import { Link } from "react-router-dom";

/**
 * FeatureCard
 * Props:
 *  - to, title, subtitle, cta
 *  - secondaryTo, secondaryCta (optional second button)
 *  - tone ("peach"|"sky"|"mint"|"sand"|"lilac"|"teal")
 *  - avatar (emoji fallback)
 *  - imageSrc, imageAlt  <-- NEW: pass an image to show in the header
 */
export default function FeatureCard({
  to,
  title,
  subtitle,
  cta = "Open",
  secondaryTo,
  secondaryCta,
  tone = "peach",
  avatar = "🎟️",
  imageSrc, // if provided, we show this instead of avatar
  imageAlt = "",
}) {
  return (
    <article className={`eo-card eo-${tone}`}>
      <div className="eo-media">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="eo-hero" />
        ) : (
          <span className="eo-avatar" aria-hidden>
            {avatar}
          </span>
        )}
      </div>

      <div className="eo-body">
        <div className="eo-title-row">
          <h3 className="eo-title">{title}</h3>
        </div>
        <p className="eo-sub">{subtitle}</p>

        <div className="eo-actions">
          <Link to={to} className="eo-ghost">
            {cta}
          </Link>
          {secondaryTo && secondaryCta && (
            <Link to={secondaryTo} className="eo-ghost">
              {secondaryCta}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
