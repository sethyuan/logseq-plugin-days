import Color from "color"
import {
  getDay,
  getDaysInMonth,
  intlFormat,
  isToday,
  previousDay,
} from "date-fns"
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
  onGotoJournal,
  onGotoPropertyOrigin,
}) {
  const firstDay = getDay(new Date(month.getFullYear(), month.getMonth(), 1))

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
            <div
              class={cls(
                "kef-days-weekday",
                (d === 0 || d === 6) && "kef-days-weekend",
              )}
            >
              {intlFormat(
                previousDay(month, d),
                { weekday: "short" },
                { locale },
              )}
            </div>
          )
        })}
        {mapRange(0, getDaysInMonth(month), (d) => {
          const date = new Date(month.getFullYear(), month.getMonth(), d + 1)
          const dayData = data.get(date.getTime())

          return (
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
                  dayData != null && "kef-days-highlight",
                  isToday(date) && "kef-days-today",
                )}
                onClick={() => onGotoJournal(d + 1)}
              >
                <span>{d + 1}</span>
                {dayData && dayData.uuid && <div class="kef-days-referred" />}
              </div>
              {dayData?.properties?.map(({ name, color, jumpKey }) => (
                <div
                  key={jumpKey}
                  class="kef-days-prop"
                  onClick={() => onGotoPropertyOrigin(jumpKey)}
                >
                  <span
                    class="kef-days-prop-text"
                    style={{
                      color,
                      backgroundColor: Color(color).alpha(0.15).string(),
                    }}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </div>
  )
}
