import { parse as parseDate } from "date-fns"
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

  return content.trim()
}

export function mapRange(from, to, mapper) {
  const ret = new Array(to)
  for (let i = from; i < to; i++) {
    ret[i] = mapper(i)
  }
  return ret
}
