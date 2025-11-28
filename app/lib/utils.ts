// Text normalization utility
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Timestamp formatting utility with timezone support
export function formatTimestamp(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'Invalid date';
  }
  
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return new Date(timestamp).toLocaleString();
  }
}

