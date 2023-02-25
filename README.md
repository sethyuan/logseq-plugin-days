中文 | [English](README.en.md)

# logseq-plugin-days

生成一个日历视图，视图上高亮了与某一主题相关的那些日子。主题是一个页面或一个块。

## 功能展示

- 高亮提示引用了页面或块的那些日子
- 可提示有日记内容的那些日子
- 可提示有任务（或 scheduled/deadline）的那些日子
- 跳转到上一个或下一个有引用页面或块的月份
- 点击有引用的那一天会定位到那一天被引用了的地方
- 点击任意天会跳转到那一天的日记页面
- 可为值为日期的属性配置高亮色及重复，这些日期会特别显示在日历中
- 支持全球化，目前内置了简体中文及英文，欢迎提 PR
- 一周的开始跟随 Logseq 的设定，请在 Logseq 中修改
- 支持返回日记页面的自定义查询

## 使用展示

https://user-images.githubusercontent.com/3410293/198977267-2e51bc38-bb6f-4546-b50a-86358352975d.mp4

https://user-images.githubusercontent.com/3410293/198977388-af5e7e1c-9fba-4ccb-8227-f3af7ab95b7a.mp4

https://user-images.githubusercontent.com/3410293/199194795-d54b5153-76bb-4313-9b87-2c3e34537ac0.mp4

## 使用示例

```
生成一个指定页面或块的事件日历，包括与此页面或块相关的特殊日期。
{{renderer :days, [[page]]}}
{{renderer :days, ((block ref))}}

同上，但显示全部特殊日期。
{{renderer :days, [[page]], all}}
{{renderer :days, ((block ref)), all}}

针对当前主页面生成事件日历，显示全部特殊日期并同时标出有日记内容的那些天。
{{renderer :days, *}}

自定义查询，需返回日记页面。查询语句需以代码块的方式放在第一个子块中。`all`代表要包含全部特殊日期。
{{renderer :days, @}}
{{renderer :days, @, all}}

生成没有主题但显示全部特殊日期的事件日历。
{{renderer :days}}
```

## 返回日期的高级查询模板

```clojure
[:find (pull ?j [*])
 :where
 [?t :block/name "Tip"]
 [?b :block/refs ?t]
 [?b :block/page ?j]
 [?j :block/journal? true]]
```
