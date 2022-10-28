import { parse } from "date-fns"

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
          ? parse(settings[key], "yyyy-MM-dd", new Date())
          : new Date(3000, 11, 31)
        : k === "repeatCount" && settings[key] < 0
        ? Infinity
        : settings[key]
  }
  return ret.filter((p) => p.name)
}
