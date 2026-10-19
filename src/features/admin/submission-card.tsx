import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, MapPin, UserRound } from 'lucide-react';
import { backendUrl } from '@/features/casting/api';
import { date, statuses, type ApplicationSummary } from './data';

export function SubmissionCard({ item }: { item: ApplicationSummary }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <Link to="/admin/submissions/$id" params={{ id: item.id }} className="submission-card" aria-label={`Consulter ${item.full_name}`}>
    <div className="submission-card-photo">
      {item.photo_id && !imageFailed ? <img src={`${backendUrl}/api/admin/photos/${item.photo_id}?size=thumb`} decoding="async" crossOrigin="use-credentials" alt={`Portrait de ${item.full_name}`} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="submission-photo-placeholder"><UserRound /><span>Photo indisponible</span></div>}
    </div>
    <div className="submission-card-info">
      <div className="submission-card-status"><span className={`status-badge status-${item.status}`}>{statuses[item.status]}</span><ArrowUpRight aria-hidden="true" /></div>
      <h3>{item.full_name}</h3>
      <p className="submission-card-demographics">{item.age_group} ans <span>·</span> {item.gender === 'male' ? 'Homme' : 'Femme'}</p>
      <p className="submission-card-city"><MapPin aria-hidden="true" />{item.city}</p>
      <div className="submission-card-footer"><time dateTime={item.created_at}>{date(item.created_at)}</time><span>#{item.reference}</span></div>
    </div>
  </Link>;
}