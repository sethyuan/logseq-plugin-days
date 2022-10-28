import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  compareAsc,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  endOfMonth,
  isValid,
  parse,
  startOfMonth,
} from "date-fns"
import { useEffect, useState } from "preact/hooks"
import { getSettingProps } from "../libs/utils"

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

logseq.provideStyle(`
`)

export default function Calendar({ slot, query }) {
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState(null)

  useEffect(() => {
    ;(async () => {
      const days = await getDays(query, month)
      setDays(days)
    })()
  }, [query, month])

  async function findPrev() {
    // TODO
  }

  async function findNext() {
    // TODO
  }

  function prevMonth() {
    setMonth((m) => addMonths(m, -1))
  }

  function nextMonth() {
    setMonth((m) => addMonths(m, 1))
  }

  if (days == null) return null

  return null
}

async function getDays(q, month) {
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  if (!q) {
    return await getOnlySpecials(month, preferredDateFormat)
  } else if (q.startsWith("[[")) {
    const name = q.substring(2, q.length - 2)
    return await getPageAndSpecials(name, month, preferredDateFormat)
  } else if (q.startsWith("((")) {
    const uuid = q.substring(2, q.length - 2)
    return await getBlockAndSpecials(uuid, month, preferredDateFormat)
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
  console.log(days)
  return days
}

async function getPageAndSpecials(name, month) {
  // TODO
  const props = logseq.settings?.properties ?? []
  return null
}

async function getBlockAndSpecials(uuid, month) {
  // TODO
  const props = logseq.settings?.properties ?? []
  return null
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
          : block.content,
      color,
    }

    days.set(date, dayData)

    if (repeat) {
      await findRecurrenceDays(
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

async function findRecurrenceDays(
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
  if (compareAsc(repeatEndAt, monthStart) < 0) return

  let count = (differenceInUnit[unit](monthStart, date) / quantity) >> 0
  let recurred = addUnit[unit](date, quantity * count)
  while (
    compareAsc(recurred, monthEnd) < 0 &&
    count < repeatCount &&
    compareAsc(recurred, repeatEndAt) < 0
  ) {
    recurred = addUnit[unit](recurred, quantity)
    count++

    if (
      compareAsc(recurred, monthStart) >= 0 &&
      compareAsc(recurred, monthEnd) <= 0
    ) {
      days.set(recurred, dayData)
    }
  }
}
