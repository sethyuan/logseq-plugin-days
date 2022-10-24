import { useCallback, useEffect, useState } from "preact/hooks"

logseq.provideStyle(`
`)

const DIR_PREV = -1
const DIR_NEXT = 1

export default function Calendar({ slot, query }) {
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [days, setDays] = useState(null)

  useEffect(() => {
    ;(async () => {
      const month = new Date().getMonth()
      const days = await getDays(query, month)
      setDays(days)
      setMonth(month)
    })()
  }, [query])

  const findPrev = useCallback(async () => {
    const newMonth = await getSiblingMonth(query, month, DIR_PREV)
    const days = await getDays(query, newMonth)
    setDays(days)
    setMonth(newMonth)
  }, [query, month])

  const findNext = useCallback(async () => {
    const newMonth = await getSiblingMonth(query, month, DIR_NEXT)
    setMonth(newMonth)
  }, [query, month])

  return null
}

async function getSiblingMonth(q, month, dir) {
  // TODO
  return 0
}

async function getDays(q, month) {
  if (!q) {
    return await getOnlySpecials(month, dir)
  } else if (q?.startsWith("((")) {
    const uuid = q.substring(2, q.length - 2)
    return await getBlockAndSpecials(uuid, month, dir)
  } else {
    return await getQueryAndSpecials(q, month, dir)
  }
}

async function getOnlySpecials(month) {
  // TODO
  const props = logseq.settings?.special ?? []
  return null
}

async function getBlockAndSpecials(uuid, month) {
  // TODO
  const props = logseq.settings?.special ?? []
  return null
}

async function getQueryAndSpecials(q, month) {
  // TODO
  const props = logseq.settings?.special ?? []
  return null
}
