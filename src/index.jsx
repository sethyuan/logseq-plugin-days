import "@logseq/libs"
import { setDefaultOptions } from "date-fns"
import { zhCN as dateZhCN } from "date-fns/locale"
import { setup, t } from "logseq-l10n"
import { render } from "preact"
import Calendar from "./comps/Calendar"
import zhCN from "./translations/zh-CN.json"

const routeOffHooks = {}

const DYNAMIC = "*"

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  logseq.App.onMacroRendererSlotted(daysRenderer)

  logseq.Editor.registerSlashCommand("Days", async () => {
    await logseq.Editor.insertAtEditingCursor("{{renderer :days}}")
    const input = parent.document.activeElement
    const pos = input.selectionStart - 2
    input.setSelectionRange(pos, pos)
  })

  logseq.useSettingsSchema([
    {
      key: "property1",
      type: "heading",
      title: t("Property 1"),
    },
    {
      key: "name1",
      type: "string",
      default: "",
      description: t("Name of the property containing a date as value."),
    },
    {
      key: "color1",
      type: "string",
      inputAs: "color",
      default: "#ffa500",
      description: t("Highlight color."),
    },
    {
      key: "repeat1",
      type: "string",
      default: "",
      description: t(
        "Repeat interval in days (d), weeks (w), months (m) or years (y), e.g, 2w. Leave it empty if not repeated.",
      ),
    },
    {
      key: "repeatCount1",
      type: "number",
      default: -1,
      description: t(
        "End the repeat after the specified times. -1 means to repeat endlessly.",
      ),
    },
    {
      key: "repeatEndAt1",
      type: "string",
      inputAs: "date",
      default: "",
      description: t("End the repeat at the specified date."),
    },
    {
      key: "property2",
      type: "heading",
      title: t("Property 2"),
    },
    {
      key: "name2",
      type: "string",
      default: "",
      description: t("Name of the property containing a date as value."),
    },
    {
      key: "color2",
      type: "string",
      inputAs: "color",
      default: "#ffa500",
      description: t("Highlight color."),
    },
    {
      key: "repeat2",
      type: "string",
      default: "",
      description: t(
        "Repeat interval in days (d), weeks (w), months (m) or years (y), e.g, 2w. Leave it empty if not repeated.",
      ),
    },
    {
      key: "repeatCount2",
      type: "number",
      default: -1,
      description: t(
        "End the repeat after the specified times. -1 means to repeat endlessly.",
      ),
    },
    {
      key: "repeatEndAt2",
      type: "string",
      inputAs: "date",
      default: "",
      description: t("End the repeat at the specified date."),
    },
    {
      key: "property3",
      type: "heading",
      title: t("Property 3"),
    },
    {
      key: "name3",
      type: "string",
      default: "",
      description: t("Name of the property containing a date as value."),
    },
    {
      key: "color3",
      type: "string",
      inputAs: "color",
      default: "#ffa500",
      description: t("Highlight color."),
    },
    {
      key: "repeat3",
      type: "string",
      default: "",
      description: t(
        "Repeat interval in days (d), weeks (w), months (m) or years (y), e.g, 2w. Leave it empty if not repeated.",
      ),
    },
    {
      key: "repeatCount3",
      type: "number",
      default: -1,
      description: t(
        "End the repeat after the specified times. -1 means to repeat endlessly.",
      ),
    },
    {
      key: "repeatEndAt3",
      type: "string",
      inputAs: "date",
      default: "",
      description: t("End the repeat at the specified date."),
    },
    {
      key: "property4",
      type: "heading",
      title: t("Property 4"),
    },
    {
      key: "name4",
      type: "string",
      default: "",
      description: t("Name of the property containing a date as value."),
    },
    {
      key: "color4",
      type: "string",
      inputAs: "color",
      default: "#ffa500",
      description: t("Highlight color."),
    },
    {
      key: "repeat4",
      type: "string",
      default: "",
      description: t(
        "Repeat interval in days (d), weeks (w), months (m) or years (y), e.g, 2w. Leave it empty if not repeated.",
      ),
    },
    {
      key: "repeatCount4",
      type: "number",
      default: -1,
      description: t(
        "End the repeat after the specified times. -1 means to repeat endlessly.",
      ),
    },
    {
      key: "repeatEndAt4",
      type: "string",
      inputAs: "date",
      default: "",
      description: t("End the repeat at the specified date."),
    },
    {
      key: "property5",
      type: "heading",
      title: t("Property 5"),
    },
    {
      key: "name5",
      type: "string",
      default: "",
      description: t("Name of the property containing a date as value."),
    },
    {
      key: "color5",
      type: "string",
      inputAs: "color",
      default: "#ffa500",
      description: t("Highlight color."),
    },
    {
      key: "repeat5",
      type: "string",
      default: "",
      description: t(
        "Repeat interval in days (d), weeks (w), months (m) or years (y), e.g, 2w. Leave it empty if not repeated.",
      ),
    },
    {
      key: "repeatCount5",
      type: "number",
      default: -1,
      description: t(
        "End the repeat after the specified times. -1 means to repeat endlessly.",
      ),
    },
    {
      key: "repeatEndAt5",
      type: "string",
      inputAs: "date",
      default: "",
      description: t("End the repeat at the specified date."),
    },
  ])

  logseq.beforeunload(() => {
    for (const off of Object.values(routeOffHooks)) {
      off?.()
    }
  })

  console.log("#days loaded")
}

function daysRenderer({ slot, payload: { arguments: args, uuid } }) {
  const [type] = args
  if (type.trim() !== ":days") return

  const renderered = parent.document.getElementById(slot)?.childElementCount > 0
  if (renderered) return

  const q = args.slice(1).join(", ").trim()
  const id = `kef-days-${slot}`

  logseq.provideUI({
    key: `days-${slot}`,
    slot,
    template: `<div id="${id}"></div>`,
    reset: true,
    style: {
      cursor: "default",
    },
  })

  // Let div root element get generated first.
  setTimeout(async () => {
    if (q === DYNAMIC) {
      observeRoute(id)
      const name = await getCurrentPageName()
      await renderCalendar(id, name, true)
    } else {
      await renderCalendar(id, q)
    }
  }, 0)
}

function observeRoute(id) {
  if (routeOffHooks[id] == null) {
    routeOffHooks[id] = logseq.App.onRouteChanged(async ({ template }) => {
      const rootEl = parent.document.getElementById(id)
      if (rootEl == null || !rootEl.isConnected) {
        routeOffHooks[id]?.()
        routeOffHooks[id] = undefined
        return
      }

      if (template === "/") {
        await renderCalendar(id, null)
      } else {
        const name = await getCurrentPageName()
        await renderCalendar(id, name, true)
      }
    })
  }
}

async function getCurrentPageName() {
  let page = await logseq.Editor.getCurrentPage()
  if (page?.page != null) {
    page = await logseq.Editor.getPage(page.page.id)
  }
  return page && `[[${page.name}]]`
}

async function renderCalendar(id, q, withAll = false) {
  const { preferredLanguage, preferredStartOfWeek, preferredDateFormat } =
    await logseq.App.getUserConfigs()
  const weekStart = (preferredStartOfWeek + 1) % 7
  setDefaultOptions({
    locale: preferredLanguage === "zh-CN" ? dateZhCN : undefined,
    weekStartsOn: weekStart,
  })
  render(
    <Calendar
      query={q}
      withAll={withAll}
      weekStart={weekStart}
      locale={preferredLanguage}
      dateFormat={preferredDateFormat}
    />,
    parent.document.getElementById(id),
  )
}

function provideStyles() {
  logseq.provideStyle(`
    .kef-days-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
    }
    .kef-days-date {
      flex: 0 0 auto;
      font-size: 1.25em;
      font-weight: 500;
      line-height: 2;
    }
    .kef-days-dateinput {
      flex: 0 0 auto;
      display: flex;
      margin-right: 8px;
    }
    .kef-days-dateinput-input {
      height: 30px;
      width: 130px;
      padding: 2px;
      margin: 5px 2px 5px 0;
    }
    .kef-days-dateinput-btn:hover {
      color: var(--ls-active-primary-color);
    }
    .kef-days-span {
      flex: 1;
    }
    .kef-days-controls {
      flex: 0 0 auto;
      font-size: 0.9375em;
      display: flex;
      align-items: flex-start;
    }
    .kef-days-control-icon {
      height: 24px;
      padding: 4px 0;
      color: var(--ls-primary-text-color);
    }
    .kef-days-control-icon:hover {
      color: var(--ls-active-primary-color);
    }
    .kef-days-refresh {
      margin-right: 6px;
      padding: 5px 0;
    }
    .kef-days-go-today:hover {
      color: var(--ls-active-primary-color);
    }
    .kef-days-month-view {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: auto;
      grid-auto-rows: 1fr;
      gap: 7px;
      font-size: 0.875em;
    }
    .kef-days-weekday {
      text-align: center;
      opacity: 0.85;
    }
    .kef-days-weekend {
      color: var(--ls-active-secondary-color);
    }
    .kef-days-day {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      width: 36px;
      min-height: 36px;
    }
    .kef-days-num {
      width: 30px;
      aspect-ratio: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      opacity: 0.6;
    }
    .kef-days-num:hover {
      background-color: var(--ls-quaternary-background-color);
    }
    .kef-days-highlight {
      opacity: 1;
      font-weight: 500;
    }
    .kef-days-today {
      color: var(--ls-tag-text-hover-color);
      background-color: var(--ls-active-primary-color);
    }
    .kef-days-today:hover {
      color: var(--ls-tag-text-hover-color);
      background-color: var(--ls-active-primary-color);
    }
    .kef-days-referred {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--ls-active-primary-color);
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
    }
    .kef-days-today .kef-days-referred {
      background-color: var(--ls-tag-text-hover-color);
    }
    .kef-days-prop {
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
      font-size: 0.7em;
      cursor: pointer;
      border-radius: 2px;
    }
    .kef-days-prop:hover {
      overflow: initial;
    }
    .kef-days-prop-text {
      padding: 0 2px;
      border-radius: 2px;
    }
  `)
}

logseq.ready(main).catch(console.error)
