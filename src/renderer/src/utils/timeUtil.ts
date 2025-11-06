import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

/**
 * 格式化会话列表的 时间为日常表达
 * @param time 时间字符串或时间戳
 */
export const formatDate = (timestamp: number | string): string => {
  if (!timestamp) return ""
  const ts = Number(timestamp);
  const realTs = ts.toString().length === 10 ? ts * 1000 : ts;
  const timestampTime = dayjs(realTs);

  const days =
    Number.parseInt(dayjs().format('YYYYMMDD')) -
    Number.parseInt(timestampTime.format('YYYYMMDD'));

  if (days === 0) {
    return timestampTime.format('HH:mm');
  } else if (days === 1) {
    return '昨日';
  } else if (days >= 2 && days < 7) {
    return timestampTime.format('dddd'); // 星期几
  } else {
    return timestampTime.format('YY/MM/DD');
  }
};

/**
 * 格式化聊天列表的 时间为日常表达
 * @param time 时间字符串或时间戳
 * @returns {string} 如“刚刚”，“5分钟前”，“昨天”，“3天前”等
 */
export const formatRelativeTime = (time: string | number): string => {
  if (!time) return ""
  const now = dayjs()
  const msgTime = dayjs(time)

  const diffSeconds = now.diff(msgTime, 'second')
  const diffMinutes = now.diff(msgTime, 'minute')
  const diffHours = now.diff(msgTime, 'hour')
  const diffDays = now.diff(msgTime, 'day')

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays <= 7) return `${diffDays}天前`

  return msgTime.format('YYYY-MM-DD')
}



export const formatTime = (milliseconds: number | string): string => {
  const ms = typeof milliseconds === 'string' ? parseFloat(milliseconds) * 1000 : milliseconds;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
};

export const addImageParams = (url: string, params: string): string => {
  if (!url) return '';
  return url.includes('?') ? url : `${url}?${params}`;
};
// utils/formatTime.ts
export const formatTime2Player = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const formatMillisecondsToTime2Player = (milliseconds: number): string => {
  return formatTime(milliseconds / 1000);
};
