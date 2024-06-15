import { format, parse as parseDate } from "date-fns"
import { parse as parseMarkdown } from "./marked-renderer.js"

export function dashToCamel(str) {
  return str.replace(/(?:-|_)([a-z])/g, (m, c) => c.toUpperCase())
}

export function camelToDash(str) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

export function getSettingProps() {
  const settings = logseq.settings
  const ret = []
  for (const key of Object.keys(settings)) {
    const match = key.match(/(.+)(\d)$/)
    if (!match) {
      ret[key] = settings[key]
      continue
    }
    const [, k, n] = match
    const i = +n - 1
    if (ret[i] == null) {
      ret[i] = {}
    }
    ret[i][k] =
      k === "repeatEndAt"
        ? settings[key]
          ? parseDate(settings[key], "yyyy-MM-dd", new Date())
          : new Date(3000, 11, 31)
        : k === "repeatCount" && settings[key] < 0
        ? Infinity
        : settings[key]
  }
  return ret.filter((p) => p.name)
}

export async function parseContent(content) {
  // Remove front matter.
  content = content.replace(/---\n(-(?!--)|[^-])*\n---\n?/g, "")

  // Use only the first line.
  content = content.match(/.*/)[0]

  // Remove macro renderers.
  content = content.replace(/ \{\{renderer (?:\}[^\}]|[^\}])+\}\}/g, "")

  // Remove properties.
  content = content.replace(/\b[^:\n]+:: [^\n]+/g, "")

  // Handle markdown.
  content = parseMarkdown(content)

  // Handle LaTex
  content = content.replaceAll(/(\${1,2})([^\$]+)\1/g, (str, _, expr) => {
    return parent.window.katex.renderToString(expr, { throwOnError: false })
  })

  // Remove tags.
  content = content.replace(/(?:^|\s)#\S+/g, "")

  // Replace block refs with their content.
  let match
  while ((match = /\(\(([^\)]+)\)\)/g.exec(content)) != null) {
    const start = match.index
    const end = start + match[0].length
    const refUUID = match[1]
    const refBlock = await logseq.Editor.getBlock(refUUID)
    const refContent = await parseContent(refBlock.content)
    content = `${content.substring(0, start)}${refContent}${content.substring(
      end,
    )}`
  }

  // Remove page refs
  content = content.replace(/\[\[([^\]]+)\]\]/g, "$1")

  // Remove marker
  content = content.replace(
    /^(?:LATER|NOW|TODO|DOING|DONE|WAITING|CANCEL{1,2}ED) /g,
    "",
  )

  return content.trim()
}

export function mapRange(from, to, mapper) {
  const ret = new Array(to - from)
  for (let i = from; i < to; i++) {
    ret[i] = mapper(i)
  }
  return ret
}

export function convertDayNumber(dayNum) {
  const year = (dayNum / 10000) >> 0
  const month = (((dayNum - year * 10000) / 100) >> 0) - 1
  const day = dayNum - year * 10000 - (month + 1) * 100
  return [year, month, day]
}

export function dayNumToTs(dayNum) {
  const year = (dayNum / 10000) >> 0
  const month = (((dayNum - year * 10000) / 100) >> 0) - 1
  const day = dayNum - year * 10000 - (month + 1) * 100
  return new Date(year, month, day).getTime()
}

export function parseRepeat(content) {
  // sample: \nSCHEDULED: <2022-11-07 Mon 23:18 .+1d>
  if (!content) return null
  const match = content.match(
    /\n\s*(?:SCHEDULED|DEADLINE): \<\d{4}-\d{1,2}-\d{1,2} [a-z]{3} (?:\d{1,2}:\d{1,2} )?(?:[\.\+]\+(\d+[ymwdh]))?\>/i,
  )
  if (!match) return null
  const [, repeat] = match
  return repeat
}

export function parseScheduledDate(content) {
  // sample: \nSCHEDULED: <2022-11-07 Mon 23:18 .+1d>
  if (!content) return [null, 1, null]

  const match = content.match(
    /\n\s*(?:SCHEDULED|DEADLINE): \<(\d{4}-\d{1,2}-\d{1,2} [a-z]{3}(?: (\d{1,2}:\d{1,2}))?)(?: [\.\+]\+(\d+[ymwdh]))?\>/i,
  )
  if (!match) return [null, 1, null]

  const [, dateStr, timeStr, repeat] = match
  if (timeStr) {
    const date = parseDate(dateStr, "yyyy-MM-dd EEE HH:mm", new Date())
    return [date, 0, repeat]
  } else {
    const date = parseDate(dateStr, "yyyy-MM-dd EEE", new Date())
    return [date, 1, null]
  }
}

export function normalizeCalEvents(calEvents) {
  Object.values(calEvents).forEach((item) => {
    item.from = new Date(item.from)
    if (item.to) {
      item.to = new Date(item.to)
    }
    item.allDay = !!item.allDay
  })
  return calEvents
}

export function toLSDate(date) {
  return format(date, "yyyyMMdd")
}

export async function persistBlockUUID(uuid) {
  if (!(await logseq.Editor.getBlockProperty(uuid, "id"))) {
    await logseq.Editor.upsertBlockProperty(uuid, "id", uuid)
  }
}

export function isUUID(str) {
    const regex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    return !!str.match(regex)
}
