// Common timezone options for better UX
export const COMMON_TIMEZONES = [
  // Major international business timezones
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (New York)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)', offset: 'UTC-7/-6' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)', offset: 'UTC-8/-7' },
  { value: 'America/Toronto', label: 'Eastern Time (Toronto)', offset: 'UTC-5/-4' },
  { value: 'America/Vancouver', label: 'Pacific Time (Vancouver)', offset: 'UTC-8/-7' },
  { value: 'America/Sao_Paulo', label: 'Brazil Time (São Paulo)', offset: 'UTC-3' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires)', offset: 'UTC-3' },
  { value: 'America/Mexico_City', label: 'Central Time (Mexico City)', offset: 'UTC-6/-5' },
  
  // Europe
  { value: 'Europe/London', label: 'GMT/BST (London)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'CET/CEST (Paris)', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'CET/CEST (Berlin)', offset: 'UTC+1/+2' },
  { value: 'Europe/Rome', label: 'CET/CEST (Rome)', offset: 'UTC+1/+2' },
  { value: 'Europe/Madrid', label: 'CET/CEST (Madrid)', offset: 'UTC+1/+2' },
  { value: 'Europe/Amsterdam', label: 'CET/CEST (Amsterdam)', offset: 'UTC+1/+2' },
  { value: 'Europe/Zurich', label: 'CET/CEST (Zurich)', offset: 'UTC+1/+2' },
  { value: 'Europe/Stockholm', label: 'CET/CEST (Stockholm)', offset: 'UTC+1/+2' },
  { value: 'Europe/Moscow', label: 'MSK (Moscow)', offset: 'UTC+3' },
  
  // Africa
  { value: 'Africa/Johannesburg', label: 'SAST (Johannesburg)', offset: 'UTC+2' },
  { value: 'Africa/Cairo', label: 'EET (Cairo)', offset: 'UTC+2' },
  { value: 'Africa/Lagos', label: 'WAT (Lagos)', offset: 'UTC+1' },
  { value: 'Africa/Nairobi', label: 'EAT (Nairobi)', offset: 'UTC+3' },
  { value: 'Africa/Casablanca', label: 'WET (Casablanca)', offset: 'UTC+0/+1' },
  
  // Asia
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'HKT (Hong Kong)', offset: 'UTC+8' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore)', offset: 'UTC+8' },
  { value: 'Asia/Seoul', label: 'KST (Seoul)', offset: 'UTC+9' },
  { value: 'Asia/Kolkata', label: 'IST (Mumbai/Delhi)', offset: 'UTC+5:30' },
  { value: 'Asia/Dubai', label: 'GST (Dubai)', offset: 'UTC+4' },
  { value: 'Asia/Bangkok', label: 'ICT (Bangkok)', offset: 'UTC+7' },
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta)', offset: 'UTC+7' },
  { value: 'Asia/Manila', label: 'PHT (Manila)', offset: 'UTC+8' },
  
  // Oceania
  { value: 'Australia/Sydney', label: 'AEST/AEDT (Sydney)', offset: 'UTC+10/+11' },
  { value: 'Australia/Melbourne', label: 'AEST/AEDT (Melbourne)', offset: 'UTC+10/+11' },
  { value: 'Australia/Perth', label: 'AWST (Perth)', offset: 'UTC+8' },
  { value: 'Pacific/Auckland', label: 'NZST/NZDT (Auckland)', offset: 'UTC+12/+13' },
  
  // Middle East
  { value: 'Asia/Jerusalem', label: 'IST (Jerusalem)', offset: 'UTC+2/+3' },
  { value: 'Asia/Riyadh', label: 'AST (Riyadh)', offset: 'UTC+3' },
  { value: 'Asia/Tehran', label: 'IRST (Tehran)', offset: 'UTC+3:30/+4:30' },
  { value: 'Europe/Istanbul', label: 'TRT (Istanbul)', offset: 'UTC+3' },
];

/**
 * Get user's current timezone
 */
export function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect timezone, falling back to UTC');
    return 'UTC';
  }
}

/**
 * Format timezone for display
 */
export function formatTimezoneDisplay(timezone: string): string {
  const timezoneOption = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (timezoneOption) {
    return `${timezoneOption.label} (${timezoneOption.offset})`;
  }
  
  // Fallback for custom timezones
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezone;
    
    return `${timeZoneName} (${timezone})`;
  } catch (error) {
    return timezone;
  }
}

/**
 * Get timezone offset string (e.g., "+02:00", "-05:00")
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
    const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60));
    
    const sign = offsetMs >= 0 ? '+' : '-';
    const hoursStr = offsetHours.toString().padStart(2, '0');
    const minutesStr = offsetMinutes.toString().padStart(2, '0');
    
    return `${sign}${hoursStr}:${minutesStr}`;
  } catch (error) {
    return '+00:00';
  }
}

/**
 * Convert date between timezones
 */
export function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
  try {
    // Convert to target timezone
    const targetDate = new Date(date.toLocaleString('en-US', { timeZone: toTimezone }));
    return targetDate;
  } catch (error) {
    console.warn('Error converting timezone, returning original date');
    return date;
  }
}

/**
 * Format date with timezone info
 */
export function formatDateWithTimezone(
  date: Date, 
  timezone: string, 
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
      ...options
    };
    
    const formatted = date.toLocaleString('en-US', defaultOptions);
    const offset = getTimezoneOffset(timezone, date);
    
    return `${formatted} (${offset})`;
  } catch (error) {
    return date.toLocaleString();
  }
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get common timezones grouped by region
 */
export function getTimezonesByRegion() {
  return {
    'International': COMMON_TIMEZONES.filter(tz => tz.value === 'UTC'),
    'Americas': COMMON_TIMEZONES.filter(tz => tz.value.startsWith('America/')),
    'Europe': COMMON_TIMEZONES.filter(tz => tz.value.startsWith('Europe/')),
    'Africa': COMMON_TIMEZONES.filter(tz => tz.value.startsWith('Africa/')),
    'Asia & Middle East': COMMON_TIMEZONES.filter(tz => 
      tz.value.startsWith('Asia/') && !tz.value.startsWith('Australia/')
    ),
    'Oceania': COMMON_TIMEZONES.filter(tz => 
      tz.value.startsWith('Australia/') || tz.value.startsWith('Pacific/')
    ),
  };
} 