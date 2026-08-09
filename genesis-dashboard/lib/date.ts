export function formatDateUTC(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    ...options,
  }).format(typeof value === 'string' || typeof value === 'number' ? new Date(value) : value);
}
