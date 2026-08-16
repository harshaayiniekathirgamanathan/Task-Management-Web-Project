import { useMemo, useState } from 'react';

// Compact, dependency-free month calendar for picking a task deadline.
// Works entirely in local time and emits a `YYYY-MM-DD` string (or '' when cleared).

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Safely parse 'YYYY-MM-DD' or ISO strings (e.g., '2026-08-16T23:59:59') into a local Date
const fromKey = (key) => {
    if (!key) return null;
    const dateStr = String(key).split('T')[0];
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m - 1, d);
};

const DeadlineCalendar = ({ value, onChange }) => {
    const todayKey = toKey(new Date());
    const selected = fromKey(value);
    const dateValueKey = selected ? toKey(selected) : '';

    // Which month the grid is showing — starts on the selected date or today.
    const [view, setView] = useState(() => {
        const base = selected || new Date();
        return { year: base.getFullYear(), month: base.getMonth() };
    });

    const { year, month } = view;

    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDay; i += 1) cells.push(null);
        for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
        return cells;
    }, [year, month]);

    const goPrev = () =>
        setView(({ year: y, month: m }) =>
            m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }
        );
    const goNext = () =>
        setView(({ year: y, month: m }) =>
            m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }
        );

    return (
        <div className="tm-cal">
            <div className="tm-cal-head">
                <button type="button" className="tm-cal-nav" onClick={goPrev} aria-label="Previous month">
                    ‹
                </button>
                <span className="tm-cal-title">{MONTHS[month]} {year}</span>
                <button type="button" className="tm-cal-nav" onClick={goNext} aria-label="Next month">
                    ›
                </button>
            </div>

            <div className="tm-cal-grid tm-cal-weekdays">
                {WEEKDAYS.map((w, i) => (
                    <span key={`${w}-${i}`} className="tm-cal-weekday">{w}</span>
                ))}
            </div>

            <div className="tm-cal-grid">
                {days.map((day, idx) => {
                    if (!day) return <span key={`pad-${idx}`} className="tm-cal-day is-empty" />;

                    const key = toKey(day);
                    const isPast = key < todayKey;
                    const isToday = key === todayKey;
                    const isSelected = dateValueKey === key;

                    return (
                        <button
                            key={key}
                            type="button"
                            disabled={isPast}
                            onClick={() => onChange(isSelected ? '' : key)}
                            className={[
                                'tm-cal-day',
                                isSelected ? 'is-selected' : '',
                                isToday ? 'is-today' : '',
                            ].join(' ').trim()}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>

            <div className="tm-cal-foot">
                {selected ? (
                    <>
                        <span className="text-muted small">
                            Due {selected.toLocaleDateString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                            })}
                        </span>
                        <button type="button" className="tm-cal-clear" onClick={() => onChange('')}>
                            Clear
                        </button>
                    </>
                ) : (
                    <span className="text-muted small">No deadline set</span>
                )}
            </div>
        </div>
    );
};

export default DeadlineCalendar;
