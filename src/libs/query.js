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
import {
  convertDayNumber,
  dashToCamel,
  dayNumToTs,
  getSettingProps,
  parseContent,
} from "../libs/utils"

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

export async function getDays(
  q,
  withAll,
  isCustom,
  withJournal,
  month,
  dateFormat,
) {
  if (isCustom) {
    return await getQuery(q, withAll, month, dateFormat)
  } else if (!q) {
    const days = await getOnlySpecials(month, dateFormat)
    if (withJournal) {
      await fillInJournalDays(days, month, dateFormat)
      await fillInTaskDays(days, month, dateFormat)
    }
    return days
  } else {
    const block =
      (await logseq.Editor.getPage(q)) ?? (await logseq.Editor.getBlock(q))
    const days = await getBlockAndSpecials(block, withAll, month, dateFormat)
    if (withJournal) {
      await fillInJournalDays(days, month, dateFormat)
      await fillInTaskDays(days, month, dateFormat)
    }
    return days
  }
}

export async function getYearDays(q, year, dateFormat) {
  const days = new Map()
  const block =
    (await logseq.Editor.getPage(q)) ?? (await logseq.Editor.getBlock(q))
  await findDays(days, block, dateFormat)
  return days
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
  await findDays(days, block, dateFormat)
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
  if (block["journal?"]) {
    const date = new Date(...convertDayNumber(block.journalDay))
    const ts = date.getTime()
    if (!days.has(ts)) {
      days.set(ts, { current: true })
    } else {
      const day = days.get(ts)
      day.current = true
    }
  }
  return days
}

async function findDays(days, block, dateFormat) {
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
        `#uuid "${block.uuid}"`,
      )
    ).map(([journal, block]) => ({ ...journal, ...block }))
  } catch (err) {
    console.error(err)
    return
  }

  if (block.page != null) {
    const page = await logseq.Editor.getPage(block.page.id)
    if (page["journal?"]) {
      const date = new Date(...convertDayNumber(page.journalDay))
      const ts = date.getTime()
      if (!days.has(ts)) {
        days.set(ts, { uuid: block.uuid })
      }
    }
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
    const isPage = block["pre-block?"]
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

async function fillInJournalDays(days, month, dateFormat) {
  // Also fill in some days of the previous month and some days of the next month.
  const start = format(addDays(startOfMonth(month), -6), "yyyyMMdd")
  const end = format(addDays(endOfMonth(month), 6), "yyyyMMdd")
  try {
    const result = (
      await logseq.DB.datascriptQuery(`
        [:find (pull ?p [:block/original-name])
         :where
         [?p :block/journal? true]
         [?p :block/journal-day ?d]
         [(>= ?d ${start})]
         [(<= ?d ${end})]
         [?b :block/page ?p]]
      `)
    ).flat()
    for (const journal of result) {
      const ts = parse(journal["original-name"], dateFormat, month).getTime()
      const day = days.get(ts)
      if (day != null) {
        day.contentful = true
      } else {
        days.set(ts, { contentful: true })
      }
    }
  } catch (err) {
    console.error(err)
  }
}

async function fillInTaskDays(days, month, dateFormat) {
  // Also fill in some days of the previous month and some days of the next month.
  const start = format(addDays(startOfMonth(month), -6), "yyyyMMdd")
  const end = format(addDays(endOfMonth(month), 6), "yyyyMMdd")
  try {
    const result = await logseq.DB.datascriptQuery(`
        [:find ?d (pull ?b [:block/marker :block/scheduled :block/deadline {:block/page [:block/journal-day]}])
         :where
         (or-join [?d ?b]
           (and
             [?p :block/journal? true]
             [?p :block/journal-day ?d]
             [?b :block/page ?p]
             [?b :block/marker])
           [?b :block/scheduled ?d]
           [?b :block/deadline ?d])
         [(>= ?d ${start})]
         [(<= ?d ${end})]]
      `)
    for (const [dayNum, block] of result) {
      const ts = dayNumToTs(dayNum)
      const day = days.get(ts)
      if (day != null) {
        if (block?.marker && block?.page["journal-day"] === dayNum) {
          day.hasTask = true
        }
        if (block?.scheduled || block?.deadline) {
          day.hasSch = true
        }
      } else {
        if (block?.marker && block?.page["journal-day"] === dayNum) {
          days.set(ts, { hasTask: true })
        }
        if (block?.scheduled || block?.deadline) {
          days.set(ts, { hasSch: true })
        }
      }
    }
  } catch (err) {
    console.error(err)
  }
}
