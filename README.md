# logseq-plugin-days

生成一个日历视图，视图上高亮了与某一主题相关的那些日子。主题是一个页面或一个块。

Generate a calendar with all days related to a topic highlighted. A topic is either a page or a block.

## 功能展示 (Feature Highlights)

- 高亮提示引用了页面或块的那些日子 (Highlight those days that have references to the page or block)
- 跳转到上一个或下一个有引用页面或块的月份 (Jump to the previous/next month with references to the page or block)
- 点击有引用的那一天会定位到那一天被引用了的地方 (Clicking on a day with reference will take you to that day and block)
- 点击任意天会跳转到那一天的日记页面 (Clicking on any day will jump to that day's journal page)
- 可为值为日期的属性配置高亮色及重复，这些日期会特别显示在日历中 (You can configure color and repetition for special properties whose value is dates, these dates will be displayed on the calendar on their own rows)
- 支持全球化，目前内置了简体中文及英文，欢迎提 PR (i18n is supported, Chinese Simplified and English are builtin for now, PR is welcomed)
- 一周的开始跟随 Logseq 的设定，请在 Logseq 中修改 (The week's start day follows Logseq's settings, feel free to configure it in Logseq)

## 使用展示 (Usage)

## 使用示例 (Examples)

```
生成一个指定页面或块的事件日历，包括与此页面或块相关的特殊日期。
Generate an event calendar for a specific page or block with special property dates related to it.
{{renderer :days, [[page]]}}
{{renderer :days, ((block ref))}}

针对当前主页面生成事件日历，但显示全部特殊日期。
Generate an event calendar for the main page with all special property dates.
{{renderer :days, *}}

生成没有主题但显示全部特殊日期的事件日历。
Generate a topicless calendar with all special property dates.
{{renderer :days}}
```
