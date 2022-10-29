import { getDay, getDaysInMonth, intlFormat, previousDay } from "date-fns"
import { mod } from "jsutils"
import { cls } from "reactutils"
import { mapRange } from "../libs/utils"

export default function CalendarView({
  weekStart,
  locale,
  data,
  month,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  onPrevRef,
  onNextRef,
  onGoto,
}) {
  const firstDay = getDay(new Date(month.getFullYear(), month.getMonth(), 1))

  function isToday(d) {
    const now = new Date()
    return (
      month.getFullYear() === now.getFullYear() &&
      month.getMonth() === now.getMonth() &&
      d === now.getDate()
    )
  }

  function isReferred(d) {
    const date = new Date(month.getFullYear(), month.getMonth(), d)
    return data.has(date.getTime())
  }

  return (
    <div class="kef-days-calendar">
      <header class="kef-days-header">
        <div class="kef-days-date">
          {intlFormat(month, { year: "numeric", month: "long" }, { locale })}
        </div>
        <div class="kef-days-span" />
        <div class="kef-days-controls">Today</div>
      </header>
      <main class="kef-days-month-view">
        {mapRange(0, 7, (d) => {
          d = (d + weekStart) % 7
          return (
            <div class="kef-days-weekday">
              {intlFormat(
                previousDay(month, d),
                { weekday: "short" },
                { locale },
              )}
            </div>
          )
        })}
        {mapRange(0, getDaysInMonth(month), (d) => (
          <div
            class="kef-days-day"
            style={
              d === 0
                ? { gridColumnStart: mod(firstDay - weekStart, 7) + 1 }
                : null
            }
          >
            <div
              class={cls(
                "kef-days-num",
                isToday(d + 1) && "kef-days-today",
                isReferred(d + 1) && "kef-days-referred",
              )}
              onClick={() => onGoto(d + 1)}
            >
              {d + 1}
            </div>
            <div
              class="kef-days-prop"
              style={{ backgroundColor: "#ff5a00" }}
              title="Hello World"
            >
              Hello World
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
