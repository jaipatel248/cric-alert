/**
 * Date formatting utilities that handle timezone conversion
 * All dates from the backend are in UTC (without timezone indicator) and converted to browser's local timezone
 */

/**
 * Parse a UTC date string and convert to browser's local Date object
 * @param dateString - Date string from backend (assumed to be UTC)
 * @returns Date object in browser's timezone
 */
const parseUTCDate = (dateString: string): Date => {
  // If the date string doesn't have timezone info, treat it as UTC
  if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    // If it's just a date without time, append time
    return new Date(dateString + 'Z');
  } else if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+')) {
    // If it has time but no timezone, add Z to mark as UTC
    return new Date(dateString + 'Z');
  }
  // Otherwise parse as-is
  return new Date(dateString);
};

/**
 * Format a date string to the browser's local timezone with full date and time
 * @param dateString - Date string from backend (assumed to be UTC)
 * @param options - Optional Intl.DateTimeFormat options
 * @returns Formatted date string in browser's timezone
 */
export const formatDateTime = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseUTCDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      ...options,
    };
    
    return date.toLocaleString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date string to show only the date portion
 * @param dateString - Date string from backend (assumed to be UTC)
 * @returns Formatted date string in browser's timezone
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseUTCDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date string to show only the time portion
 * @param dateString - Date string from backend (assumed to be UTC)
 * @returns Formatted time string in browser's timezone
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseUTCDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid time';
    
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format a date string to a relative time (e.g., "2 hours ago", "just now")
 * @param dateString - Date string from backend (assumed to be UTC)
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseUTCDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return formatDate(dateString);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date string to show date and time with timezone abbreviation
 * @param dateString - Date string from backend (assumed to be UTC)
 * @returns Formatted date string with timezone
 */
export const formatDateTimeWithTimezone = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseUTCDate(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return 'Invalid date';
  }
};

/**
 * Get the browser's timezone name
 * @returns Timezone string (e.g., "America/New_York")
 */
export const getBrowserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
