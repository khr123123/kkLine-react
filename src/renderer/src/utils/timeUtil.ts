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