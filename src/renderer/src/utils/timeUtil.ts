import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export const formatDate = (timestamp: number | string): string => {
    const timestampTime = dayjs(timestamp)
    const days =
        Number.parseInt(dayjs().format('YYYYMMDD')) -
        Number.parseInt(timestampTime.format('YYYYMMDD'))

    if (days === 0) {
        return timestampTime.format('HH:mm')
    } else if (days === 1) {
        return '昨日'
    } else if (days >= 2 && days < 7) {
        return timestampTime.format('dddd') // 星期几（中文）
    } else {
        return timestampTime.format('YY/MM/DD')
    }
}
