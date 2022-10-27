import "@logseq/libs"
import { setup } from "logseq-l10n"
import { render } from "preact"
import Calendar from "./comps/Calendar"
import zhCN from "./translations/zh-CN.json"

const routeOffHooks = {}

const DYNAMIC = "*"

async function main() {
  await setup({ builtinTranslations: { "zh-CN": zhCN } })

  logseq.App.onMacroRendererSlotted(daysRenderer)

  logseq.Editor.registerSlashCommand("Days", async () => {
    await logseq.Editor.insertAtEditingCursor("{{renderer :days}}")
    // NOTE: Leave this cursor moving code for future reference.
    const input = parent.document.activeElement
    const pos = input.selectionStart - 2
    input.setSelectionRange(pos, pos)
  })

  // NOTE: enable when settings schema can support object arrays.
  // logseq.useSettingsSchema([
  //   {
  //     key: "weekStart",
  //     type: "number",
  //     default: 0,
  //     description: t("0 is Sunday, 1 is Monday, etc."),
  //   },
  // ])

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
      await renderCalendar(id, name)
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
        await renderCalendar(id, name)
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

function renderCalendar(id, q) {
  render(<Calendar slot={id} query={q} />, parent.document.getElementById(id))
}

logseq.ready(main).catch(console.error)
