import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  compareAsc,
  endOfMonth,
  isValid,
  parse,
  startOfMonth,
} from "date-fns"
import { useEffect, useState } from "preact/hooks"

const UNITS = new Set(["y", "m", "w", "d"])

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
  if (!q) {
    return await getOnlySpecials(month)
  } else if (q.startsWith("[[")) {
    const name = q.substring(2, q.length - 2)
    return await getPageAndSpecials(name, month)
  } else if (q.startsWith("((")) {
    const uuid = q.substring(2, q.length - 2)
    return await getBlockAndSpecials(uuid, month)
  }
}

async function getOnlySpecials(month) {
  const { preferredDateFormat } = await logseq.App.getUserConfigs()
  const props = logseq.settings?.properties ?? []
  const days = new Map()
  for (const prop of props) {
    await findPropertyDays(
      days,
      preferredDateFormat,
      month,
      prop.name,
      prop.color,
      prop.recurrence,
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
  recurrence,
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

    if (recurrence) {
      await findRecurrenceDays(days, recurrence, date, month, dayData)
    }
  }
}

async function findRecurrenceDays(days, recurrence, date, month, dayData) {
  const quantity = +recurrence.substring(0, recurrence.length - 1)
  const unit = recurrence[recurrence.length - 1]
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  if (isNaN(quantity) || !UNITS.has(unit)) return

  let ret = date
  while (compareAsc(ret, monthEnd) < 0) {
    switch (unit) {
      case "y":
        ret = addYears(ret, quantity)
        break
      case "m":
        ret = addMonths(ret, quantity)
        break
      case "w":
        ret = addWeeks(ret, quantity)
        break
      case "d":
        ret = addDays(ret, quantity)
        break
    }

    if (compareAsc(ret, monthStart) >= 0 && compareAsc(ret, monthEnd) <= 0) {
      days.set(ret, dayData)
    }
  }
}
