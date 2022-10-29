import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  endOfMonth,
  format,
  isBefore,
  isValid,
  parse,
  startOfMonth,
} from "date-fns"
import { useEffect, useState } from "preact/hooks"
import { dashToCamel, getSettingProps, parseContent } from "../libs/utils"
import CalendarView from "./CalendarView"

export default function Calendar({ query, weekStart, locale, dateFormat }) {
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState(null)

  useEffect(() => {
    ;(async () => {
      const days = await getDays(query, month, dateFormat)
      setDays(days)
    })()
  }, [query, month])

  async function findPrev() {
    const monthStart = startOfMonth(month).getTime()
    let candidate = -Infinity
    for (const day of days.keys()) {
      if (day < monthStart && day > candidate) {
        candidate = day
      }
    }
    console.log("prev", candidate)
    setMonth(candidate)
  }

  async function findNext() {
    const monthEnd = endOfMonth(month).getTime()
    let candidate = Infinity
    for (const day of days.keys()) {
      if (day > monthEnd && day < candidate) {
        candidate = day
      }
    }
    console.log("next", candidate)
    setMonth(candidate)
  }

  function prevMonth() {
    setMonth((m) => addMonths(m, -1))
  }

  function nextMonth() {
    setMonth((m) => addMonths(m, 1))
  }

  function gotoJournal(d) {
    const pageDate = new Date(month.getFullYear(), month.getMonth(), d)
    const pageName = format(pageDate, dateFormat)
    logseq.Editor.scrollToBlockInPage(pageName)
  }

  if (days == null) return null

  return (
    <CalendarView
      weekStart={weekStart}
      locale={locale}
      data={days}
      month={month}
      onMonthChange={setMonth}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
      onPrevRef={findPrev}
      onNextRef={findNext}
      onGoto={gotoJournal}
    />
  )
}

const UNITS = new Set(["y", "m", "w", "d"])

const addUnit = {
  y: addYears,
  m: addMonths,
  w: addWeeks,
  d: addDays,
}

const differenceInUnit = {
  y: differenceInYears,
  m: differenceInMonths,
  w: differenceInWeeks,
  d: differenceInDays,
}

async function getDays(q, month, dateFormat) {
  if (!q) {
    return await getOnlySpecials(month, dateFormat)
  } else if (q.startsWith("[[")) {
    const name = q.substring(2, q.length - 2)
    const page = await logseq.Editor.getPage(name)
    return await getBlockAndSpecials(page, month, dateFormat)
  } else if (q.startsWith("((")) {
    const uuid = q.substring(2, q.length - 2)
    const block = await logseq.Editor.getBlock(uuid)
    return await getBlockAndSpecials(block, month, dateFormat)
  }
}

async function getOnlySpecials(month, dateFormat) {
  const props = getSettingProps()
  const days = new Map()
  for (const prop of props) {
    await findPropertyDays(
      days,
      dateFormat,
      month,
      prop.name,
      prop.color,
      prop.repeat,
      prop.repeatCount,
      prop.repeatEndAt,
    )
  }
  return days
}

async function getBlockAndSpecials(block, month, dateFormat) {
  const props = getSettingProps()
  const days = new Map()
  await findDays(days, block.uuid, dateFormat)
  for (const prop of props) {
    await findPropertyDaysForBlock(
      block,
      days,
      dateFormat,
      month,
      prop.name,
      prop.color,
      prop.repeat,
      prop.repeatCount,
      prop.repeatEndAt,
    )
  }
  return days
}

async function findDays(days, uuid, dateFormat) {
  let journals
  try {
    journals = (
      await logseq.DB.datascriptQuery(
        `[:find (pull ?j [:block/original-name])
        :in $ ?uuid
        :where
        [?t :block/uuid ?uuid]
        [?b :block/refs ?t]
        [?b :block/page ?j]
        [?j :block/journal? true]]`,
        `#uuid "${uuid}"`,
      )
    ).map(([item]) => item)
  } catch (err) {
    console.error(err)
    return
  }

  for (const journal of journals) {
    let date
    try {
      date = parse(journal["original-name"], dateFormat, new Date())
      if (!isValid(date)) continue
    } catch (err) {
      // ignore this block because it has no valid date value.
      continue
    }
    days.set(date.getTime(), null)
  }
}

async function findPropertyDaysForBlock(
  block,
  days,
  dateFormat,
  month,
  name,
  color,
  repeat,
  repeatCount,
  repeatEndAt,
) {
  const value = block.properties?.[dashToCamel(name)]?.[0]?.replace(
    /^\[\[(.*)\]\]\s*$/,
    "$1",
  )
  let date
  try {
    date = parse(value, dateFormat, new Date())
    if (!isValid(date)) return
  } catch (err) {
    // ignore this block because it has no valid date value.
    return
  }

  const dayData = {
    name: block.originalName ?? (await parseContent(block.content)),
    color,
  }

  days.set(date.getTime(), dayData)

  if (repeat) {
    findRecurrenceDays(
      days,
      repeat,
      repeatCount,
      repeatEndAt,
      date,
      month,
      dayData,
    )
  }
}

async function findPropertyDays(
  days,
  dateFormat,
  month,
  name,
  color,
  repeat,
  repeatCount,
  repeatEndAt,
) {
  let blocks
  try {
    blocks = (
      await logseq.DB.datascriptQuery(
        `[:find (pull ?b [*])
        :in $ ?prop
        :where
        [?b :block/properties ?ps]
        [(get ?ps ?prop)]
        (not [?b :block/name])]`,
        `:${name}`,
      )
    ).map(([item]) => item)
  } catch (err) {
    console.error(err)
    return
  }
  for (const block of blocks) {
    const value = block.properties[name]?.[0].replace(/^\[\[(.*)\]\]\s*$/, "$1")
    let date
    try {
      date = parse(value, dateFormat, new Date())
      if (!isValid(date)) continue
    } catch (err) {
      // ignore this block because it has no valid date value.
      continue
    }

    const dayData = {
      name:
        block.parent.id === block.page.id
          ? (await logseq.Editor.getPage(block.page.id)).originalName
          : await parseContent(block.content),
      color,
    }

    days.set(date.getTime(), dayData)

    if (repeat) {
      findRecurrenceDays(
        days,
        repeat,
        repeatCount,
        repeatEndAt,
        date,
        month,
        dayData,
      )
    }
  }
}

function findRecurrenceDays(
  days,
  repeat,
  repeatCount,
  repeatEndAt,
  date,
  month,
  dayData,
) {
  const quantity = +repeat.substring(0, repeat.length - 1)
  const unit = repeat[repeat.length - 1]
  if (isNaN(quantity) || !UNITS.has(unit)) return
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  let times = (differenceInUnit[unit](monthStart, date) / quantity) >> 0
  let recurred = addUnit[unit](date, quantity * times)
  days.set(recurred.getTime(), dayData)
  while (
    isBefore(recurred, monthEnd) &&
    times < repeatCount &&
    isBefore(recurred, repeatEndAt)
  ) {
    recurred = addUnit[unit](recurred, quantity)
    times++
    days.set(recurred.getTime(), dayData)
  }
}
