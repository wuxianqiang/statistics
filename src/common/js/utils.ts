import * as XLSX from 'xlsx'

export function putWorkbook(workbook: any) {
  // 默认选择了第一张表格
  const name: string = Object.keys(workbook.Sheets)[0]
  if (name) {
    const firstTable = workbook.Sheets[name]
    const firstTableJson = XLSX.utils.sheet_to_json(firstTable)
    const result = handleData(firstTableJson)
    return result
  }
  return { result: [], keys: [] }
}

function handleData (list: any) {
  // 注意上传的表格格式 前面1行是标题
  const title = list[1]
  const keys = Object.keys(title)
  const result = []
  for (let i = 2; i < list.length; i++) {
    const item = list[i] // {__EMPTY: 'key'}
    const temp: any = {}
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = handleValue(item[key] || '')
      const current = i === 0 ? 'name' : key
      temp[current] = value
    }
    result.push(temp)
  }
  const keyList = []
  for (let k = 0; k < keys.length; k++) {
    const temp = {
      name: k === 0 ? 'name' : keys[k],
      label: title[keys[k]]
    }
    keyList.push(temp)
  }
  return { result: result, keys: keyList }
}



function handleValue (str: string) {
  const reg = /\d{2}:\d{2}/g
  const arr = str.match(reg) || []
  const temp = {
    a: '',
    b: '',
    c: '',
    d: '',
    s: str,
    o: str
  }
  if (arr.length === 4) {
    const to8 = diff(8, arr[0])
    const to12 = diff(12, arr[1], true)
    const to13 = diff(13, arr[2])
    // todo
    const to17 = diff(17, arr[3], true)
    const totalLazy = to8.lazyTime + to12.lazyTime + to13.lazyTime + to17.lazyTime
    const time1 = handleMorning(arr[0], arr[1])
    const timer2 = handleAfternoon(arr[2], arr[3])
    const totalTime = time1.diff + timer2.diff
    //17点以后是加班是加班
    temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
    temp.b = `迟到时间：${totalLazy}分钟`
    temp.c = `加班时间：${Math.floor(timer2.add / 60)}小时${timer2.add % 60}分钟`
    temp.s = `${temp.a}，${temp.b}，${temp.c}`
    return temp
  }
  if (arr.length === 2) {
    const to13 = 13 * 60
    const start = getTime(arr[0])
    const end = getTime(arr[1])
    // 上午
    if (start.count <= to13 && end.count <= to13) {
      // 都小于13点认为上午时间
      const to8 = diff(8, arr[0])
      const to12 = diff(12, arr[1], true)
      const time1 = handleMorning(arr[0], arr[1])
      const totalLazy = to8.lazyTime + to12.lazyTime
      const step = time1.diff
      temp.a = `正班时间：${Math.floor(step / 60)}小时${step % 60}分钟`
      temp.b = `迟到时间：${totalLazy}分钟`
      temp.c = `加班时间：0分钟`
      temp.s = `${temp.a}，${temp.b}，${temp.c}`
      return temp
    }
    // 全天
    if (end.count - start.count >= 8 * 60) {
      // 如果工作超过8小时算全天
      const to8 = diff(8, arr[0])
      const to17 = diff(17, arr[1], true)
      const time1 = handleDay(arr[0], arr[1])
      const totalLazy = to8.lazyTime + to17.lazyTime
      const totalTime = time1.diff
      temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
      temp.b = `迟到时间：${totalLazy}分钟`
      temp.c = `加班时间：${Math.floor(time1.add / 60)}小时${time1.add % 60}分钟`
      temp.s = `${temp.a}，${temp.b}，${temp.c}`
      return temp
    }
  }
  // 07:17 12:00 12:58 18:00 18:57 21:00
  if (arr.length === 6) {
    const to8 = diff(8, arr[0])
    const to12 = diff(12, arr[1], true)
    const to13 = diff(13, arr[2])
    // todo
    const to17 = diff(17, arr[3], true)
    const totalLazy = to8.lazyTime + to12.lazyTime + to13.lazyTime + to17.lazyTime
    const time1 = handleMorning(arr[0], arr[1])
    const timer2 = handleAfternoon(arr[2], arr[3])
    const time3 = handleNight(arr[4], arr[5]) // 只算加班时间
    const totalTime = time1.diff + timer2.diff
    const add = timer2.add + time3.add
    //17点以后是加班是加班
    temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
    temp.b = `迟到时间：${totalLazy}分钟`
    temp.c = `加班时间：${Math.floor(add / 60)}小时${add % 60}分钟`
    temp.s = `${temp.a}，${temp.b}，${temp.c}`
    return temp
  }
  return temp
}

function getTime (str: string) {
  const [startA, startB] = str.split(':')
  if (!startA || !startB) {
    return { h: 0, m: 0, count: 0 }
  }
  return {
    h: Number(startA),
    m: Number(startB),
    count: Number(startA) * 60 + Number(startB)
  }
}

function diff(a: number, b: string, flag?: boolean) {
  const [startA, startB] = b.split(':')
  if (!startA || !startB) {
    return { diff: 0, islazy: false, lazyTime: 0 }
  }
  let diff = 0
  if (flag) {
    diff = (Number(startA) * 60 + Number(startB)) - a * 60
  } else {
    diff = a * 60 - (Number(startA) * 60 + Number(startB))
  }
  const islazy = diff < 0
  const lazyTime = islazy ? diff : 0
  return { diff, islazy, lazyTime }
}

function handleMorning (a: string, b: string) {
  const [startA, startB] = a.split(':')
  const [endA, endB] = b.split(':')
  if (!startA || !startB || !endA || !endB) {
    return { diff: 0 }
  }
  let start = Number(startA) * 60 + Number(startB)
  if (start < 8 * 60) {
    // 8点之前到算8点
    start = 8 * 60
  }
  let end = Number(endA) * 60 + Number(endB)
  if (end > 12 * 60) {
    // 12点之后到算12点
    end = 12 * 60
  }
  const diff = end - start
  return { diff }
}

function handleAfternoon (a: string, b: string) {
  const [startA, startB] = a.split(':')
  const [endA, endB] = b.split(':')
  if (!startA || !startB || !endA || !endB) {
    return { diff: 0, add: 0 }
  }
  let start = Number(startA) * 60 + Number(startB)
  if (start < 13 * 60) {
    // 13点之前到算13点
    start = 13 * 60
  }
  let end = Number(endA) * 60 + Number(endB)
  if (end > 18 * 60) {
    // 18点之后到算18点
    end = 18 * 60
  }
  const isAdd = end > 17 * 60
  // 17点以后算加班
  const add = isAdd ? (end - (17 * 60)) : 0
  const diff = (isAdd ? 17 * 60 : end) - start
  return { diff, add }
}

function handleNight (a: string, b: string) {
  const [startA, startB] = a.split(':')
  const [endA, endB] = b.split(':')
  if (!startA || !startB || !endA || !endB) {
    return { add: 0 }
  }
  let start = Number(startA) * 60 + Number(startB)
  // 19点加班-21点结束
  if (start < 19 * 60) {
    // 13点之前到算13点
    start = 19 * 60
  }
  let end = Number(endA) * 60 + Number(endB)
  if (end > 21 * 60) {
    // 18点之后到算18点
    end = 21 * 60
  }
  const add = end - start
  return { add }
}

function handleDay (a: string, b: string) {
  const [startA, startB] = a.split(':')
  const [endA, endB] = b.split(':')
  if (!startA || !startB || !endA || !endB) {
    return { diff: 0, add: 0 }
  }
  let start = Number(startA) * 60 + Number(startB)
  if (start < 8 * 60) {
    // 8点之前到算8点
    start = 8 * 60
  }
  let end = Number(endA) * 60 + Number(endB)
  if (end > 18 * 60) {
    // 12点之后到算12点
    end = 18 * 60
  }
  const isAdd = end > 17 * 60
  // 17点以后算加班
  const add = isAdd ? (end - (17 * 60)) : 0
  const diff = (isAdd ? 17 * 60 : end) - start - 60
  // 减去吃饭时间1小时
  return { diff, add }
}
