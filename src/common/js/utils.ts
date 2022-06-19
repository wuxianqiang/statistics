import * as XLSX from 'xlsx'

let config = {
  workShiftStart: '08:00',
  workShiftEnd: '18:00',
  lunchBreakStart: '12:00',
  lunchBreakEnd: '13:00',
  overtimeStart: '19:00',
  overtimeEnd: '21:00'
}

type ConfigKey = {
  workShiftStart: string,
  workShiftEnd: string,
  lunchBreakStart: string,
  lunchBreakEnd: string,
  overtimeStart: string,
  overtimeEnd: string
}

export function setConfig (cfg: ConfigKey) {
  config = Object.assign(config, cfg)
}

export function putWorkbook(workbook: any) {
  console.log(config, 'config')
  // 默认选择了第一张表格
  const name: string = Object.keys(workbook.Sheets)[0]
  if (name) {
    const firstTable = workbook.Sheets[name]
    const firstTableJson = XLSX.utils.sheet_to_json(firstTable)
    const result = handleData(firstTableJson)
    return result
  }
  return { result: [], keys: [], down: [] }
}

function handleData (list: any) {
  // 注意上传的表格格式 前面1行是标题
  const title = list[1]
  const keys = Object.keys(title)
  const down = []
  const result = []
  for (let i = 2; i < list.length; i++) {
    const item = list[i] // {__EMPTY: 'key'}
    const temp: any = {}
    const downValue = []
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = handleValue(item[key] || '')
      const current = i === 0 ? 'name' : key
      temp[current] = value
      downValue.push(value.s)
    }
    down.push(downValue)
    result.push(temp)
  }
  const keyList = []
  const downTitle = []
  for (let k = 0; k < keys.length; k++) {
    const temp = {
      name: k === 0 ? 'name' : keys[k],
      label: title[keys[k]]
    }
    downTitle.push(temp.label)
    keyList.push(temp)
  }
  down.unshift(downTitle)
  return { result: result, keys: keyList, down }
}

function validateTime (list: string[]) {
  if (list.length === 3) {
    return [list[0], list[2]]
  }
  return list
  // 如果午休时间重复打卡，去掉重复的
}

function handleValue (str: string) {
  const reg = /\d{2}:\d{2}/g
  const arr = validateTime(str.match(reg) || [])
  const temp = {
    a: '',
    b: '',
    c: '',
    d: '',
    s: str,
    o: str,
    l: false
  }
  if (arr.length === 4) {
    const to8 = diff(config.workShiftStart, arr[0])
    const to12 = diff(config.lunchBreakStart, arr[1], true)
    const to13 = diff(config.lunchBreakEnd, arr[2])
    // todo
    const to17 = diff('17:00', arr[3], true)
    const totalLazy = to8.lazyTime + to12.lazyTime + to13.lazyTime + to17.lazyTime
    const time1 = handleMorning(arr[0], arr[1])
    const timer2 = handleAfternoon(arr[2], arr[3])
    const totalTime = time1.diff + timer2.diff
    //17点以后是加班是加班
    temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
    temp.b = getLazy(totalLazy)
    temp.c = `加班时间：${Math.floor(timer2.add / 60)}小时${timer2.add % 60}分钟`
    temp.s = `${temp.a}\r\n${temp.b}\r\n${temp.c}`
    temp.l = totalLazy < 0
    return temp
  }
  if (arr.length === 2) {
    const to13 = getTime(config.lunchBreakEnd).count
    const to12 = getTime(config.lunchBreakStart).count
    const start = getTime(arr[0])
    const end = getTime(arr[1])
    // 上午
    if (start.count <= to13 && end.count <= to13) {
      // 都小于13点认为上午时间
      const to8 = diff(config.workShiftStart, arr[0])
      const to12 = diff(config.lunchBreakStart, arr[1], true)
      const time1 = handleMorning(arr[0], arr[1])
      const totalLazy = to8.lazyTime + to12.lazyTime
      const step = time1.diff
      temp.a = `正班时间：${Math.floor(step / 60)}小时${step % 60}分钟`
      temp.b = getLazy(totalLazy)
      temp.c = `加班时间：0分钟`
      temp.s = `${temp.a}\r\n${temp.b}\r\n${temp.c}`
      temp.l = totalLazy < 0
      return temp
    }
    // 全天
    if (end.count - start.count >= 8 * 60) {
      // 如果工作超过8小时算全天
      const to8 = diff(config.workShiftStart, arr[0])
      const to17 = diff('17:00', arr[1], true)
      const time1 = handleDay(arr[0], arr[1])
      const totalLazy = to8.lazyTime + to17.lazyTime
      const totalTime = time1.diff
      temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
      temp.b = getLazy(totalLazy)
      temp.c = `加班时间：${Math.floor(time1.add / 60)}小时${time1.add % 60}分钟`
      temp.s = `${temp.a}\r\n${temp.b}\r\n${temp.c}`
      temp.l = totalLazy < 0
      return temp
    }
    // 下午
    if (start.count >= to12 && end.count >= to12) {
      // 都大于12点认为上午时间
      const to13 = diff(config.lunchBreakEnd, arr[0])
      const to17 = diff('17:00', arr[1], true)
      const time1 = handleAfternoon(arr[0], arr[1])
      const totalLazy = to13.lazyTime + to17.lazyTime
      const step = time1.diff
      temp.a = `正班时间：${Math.floor(step / 60)}小时${step % 60}分钟`
      temp.b = getLazy(totalLazy)
      temp.c = `加班时间：${time1.add}分钟`
      temp.s = `${temp.a}\r\n${temp.b}\r\n${temp.c}`
      temp.l = totalLazy < 0
      return temp
    }
  }
  // 07:17 12:00 12:58 18:00 18:57 21:00
  if (arr.length === 6) {
    const to8 = diff(config.workShiftStart, arr[0])
    const to12 = diff(config.lunchBreakStart, arr[1], true)
    const to13 = diff(config.lunchBreakEnd, arr[2])
    const to17 = diff('17:00', arr[3], true)
    const totalLazy = to8.lazyTime + to12.lazyTime + to13.lazyTime + to17.lazyTime
    const time1 = handleMorning(arr[0], arr[1])
    const timer2 = handleAfternoon(arr[2], arr[3])
    const time3 = handleNight(arr[4], arr[5]) // 只算加班时间
    const totalTime = time1.diff + timer2.diff
    const add = timer2.add + time3.add
    //17点以后是加班是加班
    temp.a = `正班时间：${Math.floor(totalTime / 60)}小时${totalTime % 60}分钟`
    temp.b = getLazy(totalLazy)
    temp.c = `加班时间：${Math.floor(add / 60)}小时${add % 60}分钟`
    temp.s = `${temp.a}\r\n${temp.b}\r\n${temp.c}`
    temp.l = totalLazy < 0
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

function diff(a: string, b: string, flag?: boolean) {
  let diff = 0
  const start = getTime(b).count
  const end = getTime(a).count
  if (flag) {
    diff = start - end
  } else {
    diff = end - start
  }
  const islazy = diff < 0
  const lazyTime = islazy ? diff : 0
  return { diff, islazy, lazyTime }
}

function handleMorning (a: string, b: string) {
  let start = getTime(a).count
  const min = getTime(config.workShiftStart).count
  if (start < min) {
    // 8点之前到算8点
    start = min
  }
  let end = getTime(b).count
  const max = getTime(config.lunchBreakStart).count
  if (end > max) {
    // 12点之后到算12点
    end = max
  }
  const diff = end - start
  return { diff }
}

function handleAfternoon (a: string, b: string) {
  let start = getTime(a).count
  const min = getTime(config.lunchBreakEnd).count
  if (start < min) {
    // 13点之前到算13点
    start = min
  }
  let end = getTime(b).count
  const max = getTime(config.workShiftEnd).count
  if (end > max) {
    // 18点之后到算18点
    end = max
  }
  const isAdd = end > 17 * 60
  // 17点以后算加班
  const add = isAdd ? (end - (17 * 60)) : 0
  const diff = (isAdd ? 17 * 60 : end) - start
  return { diff, add }
}

function handleNight (a: string, b: string) {
  let start = getTime(a).count
  // 19点加班-21点结束
  const min = getTime(config.overtimeStart).count
  if (start < min) {
    // 13点之前到算13点
    start = min
  }
  let end = getTime(b).count
  const max = getTime(config.overtimeEnd).count
  if (end > max) {
    // 18点之后到算18点
    end = max
  }
  const add = end - start
  return { add }
}

function handleDay (a: string, b: string) {
  let start = getTime(a).count
  const min = getTime(config.workShiftStart).count
  if (start < min) {
    // 8点之前到算8点
    start = min
  }
  let end = getTime(b).count
  const max = getTime(config.workShiftEnd).count
  if (end > max) {
    // 12点之后到算12点
    end = max
  }
  const isAdd = end > 17 * 60
  // 17点以后算加班
  const add = isAdd ? (end - (17 * 60)) : 0
  const diff = (isAdd ? 17 * 60 : end) - start - 60
  // 减去吃饭时间1小时
  return { diff, add }
}


// 07:24 12:00 12:57 是否要删除12:00

function csv2table(csv: any) {
	let html = '<table>';
	const rows = csv.split('\n');
	rows.pop(); // 最后一行没用的
	rows.forEach(function(row: any, idx: number) {
		const columns = row.split(',');
		columns.unshift(idx+1); // 添加行索引
		if(idx == 0) { // 添加列索引
			html += '<tr>';
			for(let i=0; i<columns.length; i++) {
				html += '<th>' + (i==0?'':String.fromCharCode(65+i-1)) + '</th>';
			}
			html += '</tr>';
		}
		html += '<tr>';
		columns.forEach(function(column: any) {
			html += '<td>'+column+'</td>';
		});
		html += '</tr>';
	});
	html += '</table>';
	return html;
}

function getLazy (num: number) {
  if (num === 0) {
    return '上班情况：正常'
  }
  return `上班情况：迟到(${num}分钟)`
}