# logseq-plugin-days

生成一个日历视图，视图上高亮了与某一主题相关的那些日子。主题是一个页面或一个块。

Generate a calendar with all days related to a topic highlighted. A topic is either a page or a block.

## 功能展示 (Feature Highlights)

## 使用展示 (Usage)

## 使用示例 (Examples)

```
生成一个指定页面或块的事件日历。
Generate an event calendar for a specific page or block.
{{renderer :days, [[page]]}}
{{renderer :days, ((block ref))}}

针对当前主页面生成事件日历。
Generate an event calendar for the main page.
{{renderer :days, *}}

生成没有主题但显示全部特殊日期的事件日历。
{{renderer :days}}
```
