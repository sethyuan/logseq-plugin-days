import { useEffect, useState } from "preact/hooks"
import NextIcon from "../icons/NextIcon"
import PrevIcon from "../icons/PrevIcon"
import { getYearData } from "../libs/query"
import YearView from "./YearView"

export default function Year({
  q,
  startingYear,
  weekStart,
  locale,
  dateFormat,
}) {
  const [days, setDays] = useState()
  const [title, setTitle] = useState()
  const [year, setYear] = useState(startingYear)

  async function refresh(year) {
    const [days, title] = await getYearData(q, year, dateFormat)
    setTitle(title)
    setYear(year)
    setDays(days)
  }

  function onPrev(e) {
    refresh(year - 1)
  }

  function onNext(e) {
    refresh(year + 1)
  }

  useEffect(() => {
    refresh(year)
  }, [q, year])

  if (days == null) return null

  return (
    <>
      <section class="kef-days-yearview-header">
        <div
          class="kef-days-yearview-title"
          dangerouslySetInnerHTML={{ __html: title }}
        ></div>
        <div class="kef-days-yearview-controls">
          <button class="kef-days-control-icon" onClick={onPrev}>
            <PrevIcon />
          </button>
          <span>{year}</span>
          <button class="kef-days-control-icon" onClick={onNext}>
            <NextIcon />
          </button>
        </div>
      </section>
      <YearView
        days={days}
        year={year}
        weekStart={weekStart}
        locale={locale}
        dateFormat={dateFormat}
      />
    </>
  )
}
