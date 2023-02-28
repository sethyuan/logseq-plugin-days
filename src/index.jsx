import "@logseq/libs"
import { setDefaultOptions } from "date-fns"
import { zhCN as dateZhCN } from "date-fns/locale"
import { waitMs } from "jsutils"
import { setup, t } from "logseq-l10n"
import { render } from "preact"
import Calendar from "./comps/Calendar"
import zhCN from "./translations/zh-CN.json"

const routeOffHooks = {}

const DYNAMIC = "*"
const CUSTOM = "@"

const TB_ICON = `<svg t="1675670224876" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1511" width="200" height="200"><path d="M896 384H128c-17.6 0-32-14.4-32-32s14.4-32 32-32h768c17.6 0 32 14.4 32 32s-14.4 32-32 32z" p-id="1512"></path><path d="M832 928H192c-52.8 0-96-43.2-96-96V224c0-52.8 43.2-96 96-96 17.6 0 32 14.4 32 32s-14.4 32-32 32-32 14.4-32 32v608c0 17.6 14.4 32 32 32h640c17.6 0 32-14.4 32-32V224c0-17.6-14.4-32-32-32s-32-14.4-32-32 14.4-32 32-32c52.8 0 96 43.2 96 96v608c0 52.8-43.2 96-96 96z" p-id="1513"></path><path d="M320 224c-17.6 0-32-14.4-32-32V128c0-17.6 14.4-32 32-32s32 14.4 32 32v64c0 17.6-14.4 32-32 32zM576 192h-128c-17.6 0-32-14.4-32-32s14.4-32 32-32h128c17.6 0 32 14.4 32 32s-14.4 32-32 32zM704 224c-17.6 0-32-14.4-32-32V128c0-17.6 14.4-32 32-32s32 14.4 32 32v64c0 17.6-14.4 32-32 32z" p-id="1514"></path></svg>`
const SIDEBAR_CONTENTS_SELECTOR = ".sidebar-item #contents"

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  provideStyles()

  logseq.App.onMacroRendererSlotted(daysRenderer)

  logseq.Editor.registerSlashCommand("Days", async () => {
    await logseq.Editor.insertAtEditingCursor("{{renderer :days, }}")
    const input = parent.document.activeElement
    const pos = input.selectionStart - 2
    input.setSelectionRange(pos, pos)
  })

  logseq.App.registerPageMenuItem(t("Open Days"), async ({ page }) =>
    openPageDays(page),
  )
  logseq.App.registerUIItem("toolbar", {
    key: t("open-days"),
    template: `<a class="kef-days-tb-icon" data-on-click="openDays" title="${t(
      "Open Days",
    )}">${TB_ICON}</a>`,
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

  const slotEl = parent.document.getElementById(slot)
  if (!slotEl) return
  const renderered = slotEl.childElementCount > 0
  if (renderered) return

  const q = args[1]?.trim()
  const withAll = args[2]?.trim()
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
      await renderCalendar(id, name, true, false, true)
    } else if (q === CUSTOM) {
      const block = await logseq.Editor.getBlock(uuid, {
        includeChildren: true,
      })
      const lines = block.children[0]?.content?.split("\n")
      const query = lines
        ?.filter((_, i) => i > 0 && i < lines.length - 1)
        .join("\n")
      if (query) {
        await renderCalendar(id, query, withAll === "all", true)
      } else {
        await renderCalendar(id, null, true)
      }
    } else {
      await renderCalendar(
        id,
        q.startsWith("[[") || q.startsWith("((")
          ? q.substring(2, q.length - 2)
          : q,
        withAll === "all",
      )
    }
  }, 0)
}

function observeRoute(id) {
  if (routeOffHooks[id] == null) {
    routeOffHooks[id] = logseq.App.onRouteChanged(
      async ({ path, template }) => {
        const rootEl = parent.document.getElementById(id)
        if (rootEl == null || !rootEl.isConnected) {
          routeOffHooks[id]?.()
          routeOffHooks[id] = undefined
          return
        }

        if (template === "/page/:name") {
          const name = decodeURIComponent(
            path.substring("/page/".length).toLowerCase(),
          )
          await renderCalendar(id, name, true, false, true)
        } else {
          await renderCalendar(id, null, true, false, true)
        }
      },
    )
  }
}

async function getCurrentPageName() {
  let page = await logseq.Editor.getCurrentPage()
  if (page?.page != null) {
    page = await logseq.Editor.getPage(page.page.id)
  }
  return page?.name
}

async function renderCalendar(
  id,
  q,
  withAll = false,
  isCustom = false,
  withJournal = false,
) {
  const el = parent.document.getElementById(id)
  if (el == null) return

  const { preferredLanguage, preferredStartOfWeek, preferredDateFormat } =
    await logseq.App.getUserConfigs()
  const weekStart = (+(preferredStartOfWeek ?? 6) + 1) % 7
  setDefaultOptions({
    locale: preferredLanguage === "zh-CN" ? dateZhCN : undefined,
    weekStartsOn: weekStart,
  })
  render(
    <Calendar
      query={q}
      withAll={withAll}
      isCustom={isCustom}
      withJournal={withJournal}
      weekStart={weekStart}
      locale={preferredLanguage}
      dateFormat={preferredDateFormat}
    />,
    el,
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
      align-items: center;
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
    .kef-days-go-today {
      line-height: 24px;
      height: 24px;
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
      user-select: none;
    }
    .kef-days-num:hover {
      background-color: var(--ls-quaternary-background-color);
    }
    .kef-days-highlight {
      font-weight: 600;
    }
    .kef-days-today {
      color: var(--ls-selection-text-color);
      background-color: var(--ls-selection-background-color);
    }
    .kef-days-today:hover {
      color: var(--ls-selection-text-color);
      background-color: var(--ls-selection-background-color);
    }
    .kef-days-current {
      color: #fff;
      background-color: var(--ls-active-secondary-color);
    }
    .kef-days-current:hover {
      color: #fff;
      background-color: var(--ls-active-secondary-color);
    }
    .kef-days-contentful {
      width: 8px;
      height: 2px;
      background: var(--ls-success-text-color);
      position: absolute;
      top: 3px;
    }
    .kef-days-has-task {
      position: absolute;
      top: 0;
      right: 2px;
      width: 1px;
      height: 4px;
      background: var(--ls-active-secondary-color);
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .kef-days-has-sch {
      transform: rotate(-45deg) translate(2px, 2px);
    }
    .kef-days-referred {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--ls-active-primary-color);
      position: absolute;
      bottom: 2px;
    }
    .kef-days-prop {
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
      font-size: 0.8em;
      cursor: pointer;
      border-radius: 2px;
      text-align: center;
    }
    .kef-days-prop:hover {
      overflow: initial;
      z-index: var(--ls-z-index-level-1);
    }
    .kef-days-prop-text {
      padding: 0 2px;
      border-radius: 2px;
    }
    .kef-days-outside {
      opacity: 0.35;
    }

    .kef-days-tb-icon {
      display: flex;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      justify-content: center;
      align-items: center;
      color: var(--ls-header-button-background);
    }
    .kef-days-tb-icon svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .kef-days-tb-icon:hover {
      background: var(--ls-tertiary-background-color);
    }
  `)
}

async function openPageDays(pageName) {
  await logseq.Editor.appendBlockInPage(
    "contents",
    `{{renderer :days, [[${pageName}]]}}`,
  )
  // HACK: exitEditingMode does not work if called immediately after appending.
  await waitMs(50)
  await logseq.Editor.exitEditingMode()

  // Open contents in sidebar if not already opened.
  let contentsEl = parent.document.querySelector(SIDEBAR_CONTENTS_SELECTOR)
  if (contentsEl == null) {
    const contentsPage = await logseq.Editor.getPage("contents")
    logseq.Editor.openInRightSidebar(contentsPage.uuid)
  }
}

const model = {
  async openDays() {
    const pageName = await getCurrentPageName()
    if (pageName) {
      openPageDays(pageName)
    } else {
      logseq.UI.showMsg(t("No page detected.", "warn"))
    }
  },
}

logseq.ready(model, main).catch(console.error)
