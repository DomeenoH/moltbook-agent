/**
 * 活动日志存储模块
 * 持久化记录小多每次运行的操作详情
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * 单条活动记录
 */
export interface ActivityEntry {
  action: string;
  params?: Record<string, string>;
  result: string;
  details?: {
    postTitle?: string;
    postContent?: string;
    commentContent?: string;
    replyContent?: string;
    targetUser?: string;
    [key: string]: string | undefined;
  };
  timestamp: string;
}

/**
 * 单次运行的日志
 */
export interface RunLog {
  runId: string;
  startTime: string;
  endTime?: string;
  activities: ActivityEntry[];
}

/**
 * 活动日志数据结构
 */
export interface ActivityLogData {
  runs: RunLog[];
}

/**
 * 活动日志存储类
 */
export class ActivityLogStore {
  private filePath: string;
  private data: ActivityLogData;
  private currentRun: RunLog | null = null;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join('data', 'activity-log.json');
    this.data = this.loadData();
  }

  private loadData(): ActivityLogData {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { runs: [] };
      }
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.runs)) {
        return parsed as ActivityLogData;
      }
      return { runs: [] };
    } catch {
      return { runs: [] };
    }
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }

  /**
   * 开始新的运行记录
   */
  startRun(): string {
    const runId = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentRun = {
      runId,
      startTime: new Date().toISOString(),
      activities: [],
    };
    return runId;
  }

  /**
   * 记录一条活动
   */
  logActivity(entry: Omit<ActivityEntry, 'timestamp'>): void {
    if (!this.currentRun) {
      this.startRun();
    }
    this.currentRun!.activities.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 结束当前运行并保存
   */
  endRun(): void {
    if (this.currentRun) {
      this.currentRun.endTime = new Date().toISOString();
      // 只保留最近 50 次运行记录
      this.data.runs.push(this.currentRun);
      if (this.data.runs.length > 50) {
        this.data.runs = this.data.runs.slice(-50);
      }
      this.saveData();
      this.currentRun = null;
    }
  }

  /**
   * 获取最近的运行记录
   */
  getRecentRuns(count = 10): RunLog[] {
    return this.data.runs.slice(-count);
  }
}
