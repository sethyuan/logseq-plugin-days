import Color from "color"
import {
  format,
  getDay,
  getDaysInMonth,
  intlFormat,
  isToday,
  isWeekend,
  previousDay,
} from "date-fns"
import { mod } from "jsutils"
import { t } from "logseq-l10n"
import { useRef, useState } from "preact/hooks"
import { cls } from "reactutils"
import NextEventIcon from "../icons/NextEventIcon"
import NextIcon from "../icons/NextIcon"
import PrevEventIcon from "../icons/PrevEventIcon"
import PrevIcon from "../icons/PrevIcon"
import RefreshIcon from "../icons/RefreshIcon"
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
  onRefresh,
}) {
  const [editingDate, setEditingDate] = useState(false)

  const firstDay = getDay(new Date(month.getFullYear(), month.getMonth(), 1))

  // HACK: Logseq prevents mouse down, this breaks clicks too.
  function allowClick(e) {
    e.stopPropagation()
  }

  function onDateChange(val) {
    setEditingDate(false)
    onMonthChange(val)
  }

  return (
    <div class="kef-days-calendar" onMouseDown={allowClick}>
      <header class="kef-days-header">
        {editingDate ? (
          <DateInput
            className="kef-days-dateinput"
            date={month}
            onChange={onDateChange}
          />
        ) : (
          <button class="kef-days-date" onClick={() => setEditingDate(true)}>
            {intlFormat(month, { year: "numeric", month: "long" }, { locale })}
          </button>
        )}
        <div class="kef-days-span" />
        <div class="kef-days-controls">
          <button
            class="kef-days-control-icon kef-days-refresh"
            onClick={onRefresh}
          >
            <RefreshIcon />
          </button>
          <button class="kef-days-control-icon" onClick={onPrevRef}>
            <PrevEventIcon />
          </button>
          <button class="kef-days-control-icon" onClick={onPrevMonth}>
            <PrevIcon />
          </button>
          <button
            class="kef-days-go-today"
            onClick={() => onMonthChange(new Date())}
          >
            {t("Today")}
          </button>
          <button class="kef-days-control-icon" onClick={onNextMonth}>
            <NextIcon />
          </button>
          <button class="kef-days-control-icon" onClick={onNextRef}>
            <NextEventIcon />
          </button>
        </div>
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
                  isWeekend(date) && "kef-days-weekend",
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
                      backgroundColor: Color(color).lightness(90).string(),
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

function DateInput({ className, date, onChange }) {
  const ref = useRef()

  return (
    <div class={className}>
      <input
        ref={ref}
        class="kef-days-dateinput-input"
        type="date"
        defaultValue={format(date, "yyyy-MM-dd")}
      />
      <button
        class="kef-days-dateinput-btn"
        onClick={() => onChange(ref.current.valueAsDate)}
      >
        {t("OK")}
      </button>
    </div>
  )
}
