import type { ImageCredit } from '../lib/types';
import { useImageSrc } from '../lib/hooks';

export function CreditLine({ credit }: { credit: ImageCredit }) {
  return (
    <span className="credit">
      <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
        {credit.title}
      </a>{' '}
      by {credit.author} ·{' '}
      {credit.licenseUrl ? (
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer license">
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
      {credit.provider !== 'bundled' && <> · via {credit.provider === 'wikimedia' ? 'Wikimedia Commons' : 'Openverse'}</>}
    </span>
  );
}

export function CreditedImage({
  credit,
  recipeId,
  className = '',
  alt,
  showCredit = true,
}: {
  credit: ImageCredit;
  recipeId?: string;
  className?: string;
  alt?: string;
  showCredit?: boolean;
}) {
  const src = useImageSrc(recipeId, credit.url);
  return (
    <figure className={`figure ${className}`}>
      {src ? <img src={src} alt={alt ?? credit.title} loading="lazy" decoding="async" /> : <div className="img-ph" />}
      {showCredit && (
        <figcaption>
          <CreditLine credit={credit} />
        </figcaption>
      )}
    </figure>
  );
}
