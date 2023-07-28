import Color from "color"
import {
  addDays,
  format,
  getDay,
  getDaysInMonth,
  getWeek,
  intlFormat,
  isSameMonth,
  isToday,
  isWeekend,
  lastDayOfMonth,
  previousDay,
  startOfMonth,
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

  const firstDay = startOfMonth(month)
  const lastDay = lastDayOfMonth(month)
  const prevDaysNum = mod(getDay(firstDay) - weekStart, 7)
  const nextDaysNum = 6 - mod(getDay(lastDay) - weekStart, 7)
  const monthDaysNum = getDaysInMonth(month)
  const days = new Array(prevDaysNum + monthDaysNum + nextDaysNum)
  for (let i = 0; i < prevDaysNum; i++) {
    days[i] = addDays(firstDay, i - prevDaysNum)
  }
  for (let i = 0; i < monthDaysNum; i++) {
    days[prevDaysNum + i] = new Date(
      month.getFullYear(),
      month.getMonth(),
      i + 1,
    )
  }
  for (let i = 0; i < nextDaysNum; i++) {
    days[prevDaysNum + monthDaysNum + i] = addDays(lastDay, i + 1)
  }

  // HACK: Logseq prevents mouse down, this breaks clicks too.
  function allowClick(e) {
    e.stopPropagation()
  }

  function onDateChange(val) {
    setEditingDate(false)
    onMonthChange(val)
  }

  function onDayClick(e, d) {
    e.preventDefault()
    e.stopPropagation()
    onGotoJournal(d, e.shiftKey)
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
        {days.map((d, i) => {
          const dayData = data.get(d.getTime())
          const isFirstWeekDay = i % 7 === 0

          return (
            <div class="kef-days-day">
              {isFirstWeekDay && (
                <div className="kef-days-weeknum">w{getWeek(d)}</div>
              )}
              <div
                class={cls(
                  "kef-days-num",
                  isWeekend(d) && "kef-days-weekend",
                  dayData?.uuid != null && "kef-days-highlight",
                  isToday(d) && "kef-days-today",
                  dayData?.current && "kef-days-current",
                  !isSameMonth(d, month) && "kef-days-outside",
                )}
                onClick={(e) => onDayClick(e, d)}
              >
                <span>{d.getDate()}</span>
                {dayData?.contentful && <div class="kef-days-contentful" />}
                {dayData?.hasTask && <div class="kef-days-has-task" />}
                {dayData?.uuid && <div class="kef-days-referred" />}
              </div>
              {dayData?.properties?.map(({ name, color, jumpKey }) => (
                <div
                  key={jumpKey}
                  class="kef-days-prop"
                  onClick={() => onGotoPropertyOrigin(jumpKey)}
                >
                  <span class="kef-days-prop-placeholder">&lrm;</span>
                  <div
                    class="kef-days-prop-text"
                    style={{
                      color,
                      backgroundColor: Color(color).lightness(90).string(),
                    }}
                    dangerouslySetInnerHTML={{ __html: name }}
                  ></div>
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
