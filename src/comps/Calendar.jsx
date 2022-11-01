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
import { t } from "logseq-l10n"
import { useEffect, useState } from "preact/hooks"
import {
  convertDayNumber,
  dashToCamel,
  getSettingProps,
  parseContent,
} from "../libs/utils"
import CalendarView from "./CalendarView"

export default function Calendar({
  query,
  withAll,
  isCustom,
  weekStart,
  locale,
  dateFormat,
}) {
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState(null)

  useEffect(() => {
    ;(async () => {
      const days = await getDays(query, withAll, isCustom, month, dateFormat)
      setDays(days)
    })()
  }, [query, month, withAll, isCustom, dateFormat])

  async function findPrev() {
    const monthStart = startOfMonth(month).getTime()
    let candidate = -Infinity
    for (const day of days.keys()) {
      if (day < monthStart && day > candidate) {
        candidate = day
      }
    }
    if (isFinite(candidate)) {
      setMonth(new Date(candidate))
    } else {
      logseq.UI.showMsg(t("There's no more entries."))
    }
  }

  async function findNext() {
    const monthEnd = endOfMonth(month).getTime()
    let candidate = Infinity
    for (const day of days.keys()) {
      if (day > monthEnd && day < candidate) {
        candidate = day
      }
    }
    if (isFinite(candidate)) {
      setMonth(new Date(candidate))
    } else {
      logseq.UI.showMsg(t("There's no more entries."))
    }
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
    const dayData = days.get(pageDate.getTime())
    if (dayData?.uuid) {
      logseq.Editor.scrollToBlockInPage(pageName, dayData.uuid)
    } else {
      logseq.Editor.scrollToBlockInPage(pageName)
    }
  }

  function gotoPropertyOrigin(key) {
    logseq.Editor.scrollToBlockInPage(key)
  }

  function refresh() {
    ;(async () => {
      const days = await getDays(query, withAll, month, dateFormat)
      setDays(days)
    })()
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
      onGotoJournal={gotoJournal}
      onGotoPropertyOrigin={gotoPropertyOrigin}
      onRefresh={refresh}
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

async function getDays(q, withAll, isCustom, month, dateFormat) {
  if (isCustom) {
    return await getQuery(q, withAll, month, dateFormat)
  } else if (!q) {
    return await getOnlySpecials(month, dateFormat)
  } else if (q.startsWith("[[")) {
    const name = q.substring(2, q.length - 2)
    const page = await logseq.Editor.getPage(name)
    return await getBlockAndSpecials(page, withAll, month, dateFormat)
  } else if (q.startsWith("((")) {
    const uuid = q.substring(2, q.length - 2)
    const block = await logseq.Editor.getBlock(uuid)
    return await getBlockAndSpecials(block, withAll, month, dateFormat)
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

async function getBlockAndSpecials(block, withAll, month, dateFormat) {
  const props = getSettingProps()
  const days = new Map()
  await findDays(days, block.uuid, dateFormat)
  for (const prop of props) {
    if (withAll) {
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
    } else {
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
  }
  return days
}

async function findDays(days, uuid, dateFormat) {
  let journals
  try {
    journals = (
      await logseq.DB.datascriptQuery(
        `[:find (pull ?j [:block/journal-day]) (pull ?b [:block/uuid])
        :in $ ?uuid
        :where
        [?t :block/uuid ?uuid]
        [?b :block/refs ?t]
        [?b :block/page ?j]
        [?j :block/journal? true]]`,
        `#uuid "${uuid}"`,
      )
    ).map(([journal, block]) => ({ ...journal, ...block }))
  } catch (err) {
    console.error(err)
    return
  }

  for (const journal of journals) {
    const date = new Date(...convertDayNumber(journal["journal-day"]))
    const ts = date.getTime()
    if (!days.has(ts)) {
      days.set(ts, { uuid: journal.uuid })
    }
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
  const dayData = {
    name: block.originalName ?? (await parseContent(block.content)),
    color,
    jumpKey: block.name ?? block.uuid,
  }

  const values = block.properties?.[dashToCamel(name)]
  if (values) {
    for (let value of values) {
      value = value.replace(/^\[\[(.*)\]\]\s*$/, "$1")
      let date
      try {
        date = parse(value, dateFormat, new Date())
        if (!isValid(date)) return
      } catch (err) {
        // ignore this block because it has no valid date value.
        return
      }

      const ts = date.getTime()
      const properties = getProperties(days, ts)
      properties.push(dayData)

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
    const isPage =
      block.parent.id === block.page.id &&
      (await logseq.Editor.getPreviousSiblingBlock(block.uuid)) == null
    const page = isPage ? await logseq.Editor.getPage(block.page.id) : null
    const dayData = {
      name: isPage ? page.originalName : await parseContent(block.content),
      color,
      jumpKey: isPage ? page.name : block.uuid,
    }

    const values = block.properties[name]
    if (values) {
      for (let value of values) {
        value = value.replace(/^\[\[(.*)\]\]\s*$/, "$1")
        let date
        try {
          date = parse(value, dateFormat, new Date())
          if (!isValid(date)) continue
        } catch (err) {
          // ignore this block because it has no valid date value.
          continue
        }

        const ts = date.getTime()
        const properties = getProperties(days, ts)
        properties.push(dayData)

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

    const value = block.properties[name]?.[0].replace(/^\[\[(.*)\]\]\s*$/, "$1")
  }
}

function getProperties(days, ts) {
  if (!days.has(ts)) {
    days.set(ts, { properties: [] })
  }
  const day = days.get(ts)
  if (day.properties == null) {
    day.properties = []
  }
  return day.properties
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

  let recurred = date
  const diff = differenceInUnit[unit](
    isBefore(repeatEndAt, monthStart) ? repeatEndAt : monthStart,
    date,
  )
  let times = (diff / quantity) >> 0
  if (times > 0) {
    recurred = addUnit[unit](recurred, quantity * Math.min(times, repeatCount))
    const ts = recurred.getTime()
    const properties = getProperties(days, ts)
    properties.push(dayData)
  }
  while (
    isBefore(recurred, monthEnd) &&
    times < repeatCount &&
    isBefore(recurred, repeatEndAt)
  ) {
    recurred = addUnit[unit](recurred, quantity)
    times++
    if (isBefore(recurred, repeatEndAt)) {
      const ts = recurred.getTime()
      const properties = getProperties(days, ts)
      properties.push(dayData)
    }
  }
}

async function getQuery(q, withAll, month, dateFormat) {
  const days = new Map()

  let journals
  try {
    journals = (await logseq.DB.customQuery(q)).filter((j) => !!j["journal?"])
  } catch (err) {
    console.error(err)
    return days
  }

  for (const journal of journals) {
    const date = new Date(...convertDayNumber(journal.journalDay))
    const ts = date.getTime()
    if (!days.has(ts)) {
      days.set(ts, { uuid: journal.uuid })
    }
  }

  if (withAll) {
    const props = getSettingProps()
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
  }

  return days
}
