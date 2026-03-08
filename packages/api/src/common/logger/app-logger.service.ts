import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  trace?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly logLevel: string;
  private readonly isProduction: boolean;

  private readonly levelPriority: Record<string, number> = {
    error: 0,
    warn: 1,
    log: 2,
    info: 2,
    debug: 3,
    verbose: 4,
  };

  constructor(private readonly configService: ConfigService) {
    this.logLevel = this.configService.get<string>('LOG_LEVEL', 'debug');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  log(message: any, context?: string): void {
    this.writeLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.writeLog('error', message, context, trace);
  }

  warn(message: any, context?: string): void {
    this.writeLog('warn', message, context);
  }

  debug(message: any, context?: string): void {
    this.writeLog('debug', message, context);
  }

  verbose(message: any, context?: string): void {
    this.writeLog('verbose', message, context);
  }

  setLogLevels(levels: LogLevel[]): void {
    // NestJS 호환
  }

  private shouldLog(level: string): boolean {
    return (this.levelPriority[level] ?? 5) <= (this.levelPriority[this.logLevel] ?? 2);
  }

  private writeLog(level: string, message: any, context?: string, trace?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
    };

    if (trace) {
      entry.trace = trace;
    }

    if (this.isProduction) {
      // JSON 출력 (CloudWatch, ELK 등에서 파싱 용이)
      const stream = level === 'error' ? process.stderr : process.stdout;
      stream.write(JSON.stringify(entry) + '\n');
    } else {
      // 개발환경: 가독성 높은 포맷
      const color = this.getColor(level);
      const reset = '\x1b[0m';
      const dim = '\x1b[2m';
      const contextStr = context ? ` ${dim}[${context}]${reset}` : '';
      console.log(`${dim}${entry.timestamp}${reset} ${color}${level.toUpperCase().padEnd(5)}${reset}${contextStr} ${entry.message}`);
      if (trace) {
        console.log(`${dim}${trace}${reset}`);
      }
    }
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      error: '\x1b[31m',   // red
      warn: '\x1b[33m',    // yellow
      info: '\x1b[32m',    // green
      debug: '\x1b[36m',   // cyan
      verbose: '\x1b[35m', // magenta
    };
    return colors[level] || '\x1b[0m';
  }
}
