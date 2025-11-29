// Comprehensive logging system with persistent storage
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

const MAX_LOG_ENTRIES = 1000;
const LOG_STORAGE_KEY = 'songpig_app_logs';

class Logger {
  private getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const logsJson = localStorage.getItem(LOG_STORAGE_KEY);
      if (!logsJson) return [];
      return JSON.parse(logsJson);
    } catch (error) {
      console.error('Failed to read logs from localStorage:', error);
      return [];
    }
  }

  private saveLogs(logs: LogEntry[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only the last MAX_LOG_ENTRIES
      const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
      // If localStorage is full, try to clear old logs
      try {
        const halfLogs = logs.slice(-Math.floor(MAX_LOG_ENTRIES / 2));
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(halfLogs));
      } catch (e) {
        console.error('Failed to save trimmed logs:', e);
      }
    }
  }

  private formatMessage(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>, error?: Error): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      stack: error?.stack,
    };

    // Console logging with appropriate method (works in both client and server)
    const formattedMessage = this.formatMessage(level, message, context);
    if (level === 'error') {
      console.error(formattedMessage, error || context || '');
    } else if (level === 'warn') {
      console.warn(formattedMessage, context || '');
    } else {
      console.log(formattedMessage, context || '');
    }

    // Store in localStorage (only in browser environment)
    if (typeof window !== 'undefined') {
      try {
        const logs = this.getLogs();
        logs.push(entry);
        this.saveLogs(logs);
      } catch (e) {
        // Silently fail if localStorage is unavailable (e.g., private browsing)
        console.warn('Failed to save log to localStorage:', e);
      }
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  exportLogs(): string {
    const logs = this.getLogs();
    const lines = logs.map(entry => {
      const contextStr = entry.context ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}` : '';
      const stackStr = entry.stack ? `\n  Stack: ${entry.stack}` : '';
      return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${stackStr}`;
    });
    return lines.join('\n\n');
  }

  clearLogs(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
      console.log('Logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  getLogCount(): number {
    return this.getLogs().length;
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    const logs = this.getLogs();
    return logs.slice(-count);
  }
}

// Export singleton instance
export const logger = new Logger();

