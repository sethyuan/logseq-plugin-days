import { useEffect, useState } from "preact/hooks"
import NextIcon from "../icons/NextIcon"
import PrevIcon from "../icons/PrevIcon"
import { getYearData, getYearDataFromQuery } from "../libs/query"
import YearView from "./YearView"

export default function Year({
  q,
  userTitle,
  isCustom,
  startingYear,
  weekStart,
  locale,
  dateFormat,
  uuid,
}) {
  const [days, setDays] = useState()
  const [title, setTitle] = useState()
  const [year, setYear] = useState(startingYear)

  async function refresh(year) {
    if (!q) return

    if (isCustom) {
      const days = await getYearDataFromQuery(q, year, dateFormat)
      setTitle(userTitle ?? "")
      setDays(days)
    } else {
      const [days, blockTitle] = await getYearData(q, year, dateFormat)
      setTitle(userTitle ?? blockTitle)
      setDays(days)
    }
    setYear(year)
  }

  function onPrev(e) {
    refresh(year - 1)
  }

  function onNext(e) {
    refresh(year + 1)
  }

  async function onEdit(e) {
    await logseq.Editor.editBlock(uuid)
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
          <button
            class="kef-days-control-icon kef-days-control-edit"
            onClick={onEdit}
          >
            &#xeb04;
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
