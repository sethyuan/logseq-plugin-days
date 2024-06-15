import { addDays, format, getWeek } from "date-fns"
import { enUS } from "date-fns/locale"
import { mod } from "jsutils"

export default function YearView({
  days,
  year,
  weekStart,
  locale,
  dateFormat,
}) {
  async function gotoJournal(pageName, dayData, openInSidebar) {
    if (dayData?.uuid) {
      if (openInSidebar) {
        logseq.Editor.openInRightSidebar(dayData.uuid)
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

  const data = new Array(366)
  const firstDay = new Date(year, 0, 1)
  const startPos = mod(firstDay.getDay() - weekStart, 7) + 2
  for (let i = 0; i < data.length; i++) {
    const day = addDays(firstDay, i)
    data[i] = day
    if (day.getMonth() === 11 && day.getDate() === 31) {
      break
    }
  }
  const months = new Array(12)
  for (let i = months.length - 1; i >= 0; i--) {
    const start = i === 0 ? 1 : getWeek(new Date(year, i, 7)) + 1
    const end = i + 1 === months.length ? 55 : months[i + 1][0]
    months[i] = [start, end]
  }

  return (
    <div class="kef-days-yearview">
      {months.map(([start, end], i) => {
        return (
          <div
            key={`month-${i}`}
            class="kef-days-yearview-month"
            style={{ gridColumn: `${start} / ${end}` }}
          >
            {format(new Date(year, i), "MMM")}
          </div>
        )
      })}
      {data.map((d, i) => {
        const pageName = format(d, dateFormat, { locale })
        const dayData = days.get(d.getTime())
        let style = null
        if (dayData?.uuid) {
          style = { backgroundColor: "var(--ls-active-primary-color)" }
        }
        if (i === 0) {
          if (style) {
            style.gridRowStart = startPos
          } else {
            style = { gridRowStart: startPos }
          }
        }
        return (
          <div
            key={i}
            class="kef-days-yearview-day"
            style={style}
            title={pageName}
            onClick={(e) => gotoJournal(pageName, dayData, e.shiftKey)}
          />
        )
      })}
    </div>
  )
}
