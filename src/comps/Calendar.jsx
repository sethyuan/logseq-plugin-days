import { addMonths, endOfMonth, format, startOfMonth } from "date-fns"
import { enUS } from "date-fns/locale"
import { t } from "logseq-l10n"
import { useEffect, useState } from "preact/hooks"
import { getDays } from "../libs/query"
import CalendarView from "./CalendarView"

export default function Calendar({
  uuid,
  query,
  withAll,
  isCustom,
  withJournal,
  weekStart,
  locale,
  dateFormat,
  weekFormat,
}) {
  const [month, setMonth] = useState(() => new Date())
  const [days, setDays] = useState(null)

  async function queryData() {
    const days = await getDays(
      query,
      withAll,
      isCustom,
      withJournal,
      month,
      dateFormat,
    )
    setDays(days)
  }

  useEffect(() => {
    queryData()
  }, [query, month, withAll, isCustom, withJournal, dateFormat])

  async function findPrev() {
    const monthStart = startOfMonth(month).getTime()
    let candidate = -Infinity
    for (const day of days.keys()) {
      if (day < monthStart && day > candidate && days.get(day).uuid != null) {
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
      if (day > monthEnd && day < candidate && days.get(day).uuid != null) {
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

  async function gotoJournal(d, openInSidebar) {
    const pageName = format(d, dateFormat, { locale: enUS })
    const dayData = days.get(d.getTime())
    if (dayData?.uuid) {
      if (openInSidebar) {
        const page = await logseq.Editor.getPage(pageName)
        logseq.Editor.openInRightSidebar(page.uuid)
      } else {
        logseq.Editor.scrollToBlockInPage(pageName, dayData.uuid)
      }
    } else {
      if (openInSidebar) {
        const page = await logseq.Editor.getPage(pageName)
        logseq.Editor.openInRightSidebar(page.uuid)
      } else {
        logseq.Editor.scrollToBlockInPage(pageName)
      }
    }
  }

  async function gotoWeek(d, openInSidebar) {
    if (!weekFormat)
      return
    const pageName = format(d, weekFormat)
    if (openInSidebar) {
      const page = await logseq.Editor.getPage(pageName)
      logseq.Editor.openInRightSidebar(page.uuid)
    } else {
      logseq.Editor.scrollToBlockInPage(pageName)
    }
  }

  function gotoPropertyOrigin(key) {
    logseq.Editor.scrollToBlockInPage(key)
  }

  function refresh() {
    queryData()
  }

  if (days == null) return null

  return (
    <CalendarView
      uuid={uuid}
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
      onGotoWeek={weekFormat ? gotoWeek : null}
      onGotoPropertyOrigin={gotoPropertyOrigin}
      onRefresh={refresh}
    />
  )
}
