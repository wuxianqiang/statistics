import type { Time } from '../dataType'

export const weekList = ['一', '二', '三', '四', '五', '六', '日']

export const festival = {
  '2022-01-01': '元旦',
  '2022-01-31': '除夕',
  '2022-04-05': '清明节',
  '2022-05-01': '劳动节',
  '2022-06-03': '端午节',
  '2022-09-10': '中秋节',
  '2022-10-01': '国庆节'
} as Record<string, string>

// 休假
export const vacation = [
  '2022-01-01', '2022-01-02', '2022-01-03',
  '2022-01-31', '2022-02-01', '2022-02-02', '2022-02-03', '2022-02-04', '2022-02-05', '2022-02-06',
  '2022-04-03', '2022-04-04', '2022-04-05',
  '2022-04-30', '2022-05-01', '2022-05-02', '2022-05-03', '2022-05-04',
  '2022-06-03', '2022-06-04', '2022-06-05',
  '2022-09-10', '2022-09-11', '2022-09-12',
  '2022-10-01', '2022-10-02', '2022-10-03', '2022-10-04', '2022-10-05', '2022-10-06', '2022-10-07'
]

// 上班
export const duty = [
  '2022-01-29', '2022-01-30',
  '2022-04-02',
  '2022-04-24',
  '2022-05-07',
  '2022-10-08', '2022-10-09'
]

export const addZero = (num: number) => {
  return num < 10 ? `0${num}` : `${num}`
}

export function getCalendar (time: Time) {
  const result = []
  const totalDay = new Date(time.y, time.m, 0).getDate()
  const week = (new Date(`${time.y}-${time.m}-1`).getDay() || 7) - 1
  let row = []
  const prev = +new Date(`${time.y}-${time.m}-1`) - 24 * 60 * 60 * 1000
  const prevDate = new Date(prev)
  const porvYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth()
  const getTarget = []
  let prevDay = prevDate.getDate()
  for (let w = 0; w < week; w++) {
    const format = `${porvYear}-${addZero(prevMonth + 1)}-${addZero(prevDay)}`
    const isVacation = vacation.includes(format) ? '休' : ''
    const isDuty = duty.includes(format) ? '班' : ''
    const isFestival = festival[format] || ''
    row.unshift({
      s: format,
      y: porvYear,
      m: prevMonth + 1,
      d: prevDay,
      desc: isVacation || isDuty,
      festival: isFestival,
      dark: true,
      isWork: false,
      current: false
    })
    prevDay--
  }
  let current = week
  let day = time.d
  for (let i = 1; i <= totalDay; i++) {
    if (current === 7) {
      current = 0
      result.push(row)
      row = []
    }
    const format = `${time.y}-${addZero(time.m)}-${addZero(day++)}`
    const isVacation = vacation.includes(format) ? '休' : ''
    const isDuty = duty.includes(format) ? '班' : ''
    const isFestival = festival[format] || ''
    // 周末加班 工作日放假
    let isWork = row.length > 5 ? false : true
    if (row.length > 4) {
      if (isDuty) {
        isWork = true
      }
      if (isVacation) {
        isWork = false
      }
    }
    if (row.length < 5) {
      if (isDuty) {
        isWork = true
      }
      if (isVacation) {
        isWork = false
      }
    }
    const temp: any = {
      s: format,
      y: time.y,
      m: time.m,
      d: i,
      desc: isVacation || isDuty,
      festival: isFestival,
      dark: false,
      isWork: isWork,
      row: row.length,
      current: true
    }
    row.push(temp)
    getTarget.push(temp)
    current++
  }
  if (row.length > 0) {
    const prev = +new Date(`${time.y}-${time.m}-${totalDay}`) + 24 * 60 * 60 * 1000
    const prevDate = new Date(prev)
    const porvYear = prevDate.getFullYear()
    const prevMonth = prevDate.getMonth()
    let prevDay = prevDate.getDate()
    for (let r = row.length; r < 7; r++) {
      const format = `${porvYear}-${addZero(prevMonth + 1)}-${addZero(prevDay)}`
      const isVacation = vacation.includes(format) ? '休' : ''
      const isDuty = duty.includes(format) ? '班' : ''
      const isFestival = festival[format] || ''
      row.push({
        s: format,
        y: porvYear,
        m: prevMonth + 1,
        d: prevDay,
        desc: isVacation || isDuty,
        festival: isFestival,
        dark: true,
        isWork: false,
        current: false
      })
      prevDay++
    }
    result.push(row)
  }
  return { timeWeek: result, timeList: getTarget }
}
