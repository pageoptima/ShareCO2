/**
 * Comprehensive date and time utilities for consistent formatting across the application
 * All functions handle IST (Asia/Kolkata) timezone conversion
 */

/**
 * Format time to show only hours and minutes with AM/PM in IST
 * Handles various input formats: ISO strings, Date objects, time strings
 */
export default function formatTime(timeInput: string | Date): string {
  try {
    // If it's already formatted (contains AM/PM), return as is
    if (typeof timeInput === 'string' && (timeInput.includes('AM') || timeInput.includes('PM'))) {
      return timeInput;
    }

    let date: Date;
    
    if (typeof timeInput === 'string') {
      // Check if it's a UTC timestamp (ends with Z or contains timezone info)
      if (timeInput.includes('Z') || timeInput.includes('+') || timeInput.includes('T')) {
        // Parse as full ISO string or UTC time
        if (timeInput.includes('T')) {
          // Full ISO timestamp
          date = new Date(timeInput);
        } else {
          // Time only with Z (like "09:30:00.000Z")
          const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD
          date = new Date(`${today}T${timeInput}`);
        }
      } else if (timeInput.includes(':')) {
        // Regular time string like "14:30:00" or "14:30"
        const [hours, minutes] = timeInput.split(':').map(Number);
        date = new Date();
        date.setUTCHours(hours);
        date.setUTCMinutes(minutes);
        date.setUTCSeconds(0);
      } else {
        // Fallback: try to parse as a full date string
        date = new Date(timeInput);
      }
    } else {
      // It's already a Date object
      date = timeInput;
    }
    
    // Convert to IST (Indian Standard Time) and format
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata' // IST timezone
    });
  } catch {
    // Fallback: return original string if parsing fails
    return timeInput.toString();
  }
}

/**
 * Format date to DD/MM/YYYY in IST
 * Handles various input formats: ISO strings, Date objects
 */
export function formatDate(dateInput: string | Date): string {
  try {
    // If it's already in DD/MM/YYYY format, return as is
    if (typeof dateInput === 'string' && dateInput.includes('/') && dateInput.split('/').length === 3) {
      const parts = dateInput.split('/');
      if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        return dateInput;
      }
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata' // IST timezone
    });
  } catch {
    // Fallback: return original string if parsing fails
    return dateInput.toString();
  }
}

/**
 * Format both date and time together
 * Returns an object with separate date and time strings
 */
export function formatDateTime(dateTimeInput: string | Date): { date: string; time: string } {
  return {
    date: formatDate(dateTimeInput),
    time: formatTime(dateTimeInput)
  };
}