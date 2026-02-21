/**
 * Parses a duration string (e.g., "15m", "1h", "7d") or a numeric string into seconds.
 * @param duration The duration string or number.
 * @returns The duration in seconds.
 */
export function parseDurationToSeconds(duration: string | number): number {
    if (typeof duration === 'number') return duration;
    if (!duration) return 0;

    // If it's a numeric string, convert to number (assuming it's already in seconds)
    if (/^\d+$/.test(duration)) return parseInt(duration, 10);

    // Manual parsing for common JWT duration strings if ms is not easily available or to avoid extra dependency issues
    const unitMap: { [key: string]: number } = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        w: 604800,
    };

    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * (unitMap[unit] || 0);
}
