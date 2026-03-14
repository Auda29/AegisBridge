import { useMemo, useState } from 'react';
import type { TimelineEvent } from '@agentic-scifi/shared-schema';

const timelineFilters = ['all', 'agent', 'approval', 'artifact', 'system'] as const;
type TimelineFilter = (typeof timelineFilters)[number];

export function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((event) => event.category === filter);
  }, [events, filter]);

  return (
    <div className="panel timeline">
      <div className="panel-head">
        <div>
          <p className="eyebrow">mission timeline</p>
          <h2>Recent events</h2>
        </div>
      </div>
      <div className="filter-row">
        {timelineFilters.map((f) => (
          <button
            key={f}
            className={filter === f ? 'filter-chip active-filter' : 'filter-chip'}
            type="button"
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <ol className="event-list">
        {filteredEvents.map((event) => (
          <li key={event.id}>
            <span className={`event-pip ${event.tone}`} />
            <div>
              <div className="event-headline">
                <strong>{event.title}</strong>
                <span className="event-category">{event.category ?? 'uncategorized'}</span>
              </div>
              <p>{event.detail}</p>
              {event.timestamp ? <small>{new Date(event.timestamp).toLocaleTimeString()}</small> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
