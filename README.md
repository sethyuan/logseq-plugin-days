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
- 年视图，全览有引用的那些天（`/Days (Year View)`）

## 使用展示

https://user-images.githubusercontent.com/3410293/198977267-2e51bc38-bb6f-4546-b50a-86358352975d.mp4

https://user-images.githubusercontent.com/3410293/198977388-af5e7e1c-9fba-4ccb-8227-f3af7ab95b7a.mp4

https://user-images.githubusercontent.com/3410293/199194795-d54b5153-76bb-4313-9b87-2c3e34537ac0.mp4

https://github.com/sethyuan/logseq-plugin-days/assets/3410293/65010455-02c6-4b62-8b02-d303bb534eaa

https://github.com/sethyuan/logseq-plugin-days/assets/3410293/89417ec4-c2ad-4164-895a-1da5c9e79804

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

年视图，生成指定年份的引用视图。
{{renderer :days-year, [[page]]}}
{{renderer :days-year, ((block ref))}}
{{renderer :days-year, [[page]], 2000}}
{{renderer :days-year, ((block ref)), 2000}}
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

## 自定义日历宽度

```css
.kef-days-day {
  width: 36px;
}
```

## Buy me a coffee

如果您认为我所开发的软件对您有所帮助，并且愿意给予肯定和支持，不妨扫描下方的二维码进行打赏。感谢您的支持与关注。

![wx](https://user-images.githubusercontent.com/3410293/236807219-cf21180a-e7f8-44a9-abde-86e1e6df999b.jpg) ![ap](https://user-images.githubusercontent.com/3410293/236807256-f79768a7-16e0-4cbf-a9f3-93f230feee30.jpg)
