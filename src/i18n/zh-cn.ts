/**
 * 符号剔除器 - 中文字典
 */

export const zhCN: Record<string, string> = {
	// 语言切换
	'language.title': '语言/Language',
	'language.switchLanguage': '语言切换/Switch Language',
	'language.desc': '若显示语言显示错误，或者你只是想切换着玩，这里切换语言 / If the display language is incorrect, or you just want to switch for fun, change it here.',
	'language.auto': '跟随系统',
	'language.zh-CN': '中文',
	'language.en': 'English',

	// 插件名
	'plugin.name': '符号剔除器',

	// Tab
	'tab.general': '常规',
	'tab.presets': '预设',
	'tab.importExport': '导入/导出',

	// 常规 - 右键菜单
	'general.contextMenu': '右键菜单',
	'general.contextMenuPresets': '剔除预设',
	'general.contextMenuPresets.desc': '在右键菜单中添加"剔除"子菜单，包含所有预设',
	'general.contextMenuEraserBrush': '剔除刷',
	'general.contextMenuEraserBrush.desc': '在右键菜单中添加"剔除刷"模式开关，使用常用预设自动剔除选中文本；右键或 Esc 退出',

	// 常规 - 跟随栏
	'general.followingToolbar': '跟随栏',
	'general.followingToolbar.desc': '选中文本后松开左键，在光标旁显示剔除跟随栏',
	'general.displayPosition': '显示位置',
	'general.displayPosition.desc': '浮动工具栏相对于光标的显示位置',

	// 常规 - 剔除刷
	'general.eraserBrush': '剔除刷',
	'general.commonPreset': '常用预设',
	'general.commonPreset.desc': '剔除刷和跟随栏"常用"按钮共用的预设；双击"常用"按钮进入刷模式',
	'general.doubleClickEnable': '双击启用',
	'general.doubleClickEnable.desc': '双击跟随栏"常用"按钮激活剔除刷模式，选中文本自动剔除；右键或 Esc 退出',

	// 九宫格
	'position.top-left': '左上方',
	'position.top': '正上方',
	'position.top-right': '右上方',
	'position.left': '正左侧',
	'position.right': '正右侧',
	'position.bottom-left': '左下方',
	'position.bottom': '正下方',
	'position.bottom-right': '右下方',
	'position.center': '光标',

	// 右键菜单
	'contextMenu.strip': '剔除',
	'contextMenu.enableEraserBrush': '启用剔除刷',
	'contextMenu.disableEraserBrush': '停用剔除刷',

	// 命令面板
	'command.strip': '剔除: {0}',

	// Notice
	'notice.selectFirst': '请先选中文本',
	'notice.eraserBrushActivated': '剔除刷已激活: {0}',
	'notice.eraserBrushDeactivated': '剔除刷已关闭',
	'notice.noPreset': '无预设',
	'notice.executed': '已执行: {0}',
	'notice.stripFailed': '剔除失败: {0}',
	'notice.importSuccess': '导入成功',
	'notice.importFailed': '导入失败: {0}',

	// Tooltip
	'tooltip.common': '常用: {0}{1}',
	'tooltip.doubleClickHint': '（双击进入剔除刷）',
	'tooltip.morePresets': '更多预设',

	// 剔除刷指示器
	'eraserBrush.indicator': '剔除刷: {0}',

	// 预设管理
	'presets.guide': '使用说明',
	'presets.guide.intro': '每个预设包含名称、模式和内容三项：',
	'presets.guide.name': '名称：预设的显示名称，用于菜单和工具栏标识',
	'presets.guide.charMode': '<b>字符模式</b>：逐个剔除指定字符。如输入 <code>0123456789</code> 将剔除所有数字',
	'presets.guide.regexMode': '<b>正则模式</b>：按正则表达式匹配剔除。如输入 <code>\\s+</code> 将剔除所有连续空白',
	'presets.guide.separator': '分隔方式：字符模式与正则模式均可将多个项连续写在一行，也可换行分隔，效果相同',
	'presets.guide.regexSyntax': '支持的正则表达式语法：',
	'presets.regex.syntax': '语法',
	'presets.regex.desc': '说明',
	'presets.regex.example': '示例',
	'presets.title': '剔除预设',
	'presets.filter': '筛选预设',
	'presets.filter.desc': '输入关键词筛选预设',
	'presets.filter.name': '标题',
	'presets.filter.content': '内容',
	'presets.filter.placeholder': '搜索...',
	'presets.delete': '删除',
	'presets.name': '名称',
	'presets.mode': '模式',
	'presets.mode.desc': '字符模式：逐个剔除指定字符；正则模式：按正则表达式匹配剔除',
	'presets.mode.char': '字符模式',
	'presets.mode.regex': '正则模式',
	'presets.content': '内容',
	'presets.content.char.desc': '要剔除的字符，每行一个剔除项',
	'presets.content.regex.desc': '正则表达式，每行一个剔除项',
	'presets.add': '添加预设',
	'presets.add.desc': '点击下方按钮添加新的剔除预设',
	'presets.add.btn': '+ 添加',
	'presets.newPreset': '新预设',

	// 预设内容 placeholder
	'presets.content.char.placeholder': '如:\n0123456789\n.,!?;:\'\"()[]{}<>',
	'presets.content.regex.placeholder': '如:\n\\s+\n\\d+',

	// 导入/导出
	'importExport.export': '导出配置',
	'importExport.export.desc': '将当前预设配置导出为 JSON 文件',
	'importExport.export.btn': '导出',
	'importExport.import': '导入配置',
	'importExport.import.desc': '从 JSON 文件导入预设配置（将替换当前所有预设）',
	'importExport.import.btn': '导入',

	// 导入校验
	'import.notArray': '格式错误：顶层不是数组',
	'import.invalidName': '第 {0} 项缺少有效名称',
	'import.invalidMode': '第 {0} 项模式无效（需为 char 或 regex）',
	'import.invalidItems': '第 {0} 项内容格式无效',

	// 正则表 - 每项拆为 syntax/desc/example 三个键
	'regex.\\d.syntax': '\\d', 'regex.\\d.desc': '匹配数字', 'regex.\\d.example': '\\d+ → 剔除所有数字',
	'regex.\\s.syntax': '\\s', 'regex.\\s.desc': '匹配空白字符（空格、制表符、换行等）', 'regex.\\s.example': '\\s+ → 剔除连续空白',
	'regex.\\w.syntax': '\\w', 'regex.\\w.desc': '匹配单词字符（字母、数字、下划线）', 'regex.\\w.example': '\\w → 剔除单词字符',
	'regex.[abc].syntax': '[abc]', 'regex.[abc].desc': '匹配字符集中的任意字符', 'regex.[abc].example': '[aeiou] → 剔除元音字母',
	'regex.[^abc].syntax': '[^abc]', 'regex.[^abc].desc': '匹配不在字符集中的任意字符', 'regex.[^abc].example': '[^0-9] → 剔除非数字',
	'regex...syntax': '.', 'regex...desc': '匹配任意单个字符（换行符除外）', 'regex...example': 'a.b → 剔除 a 与 b 之间有任意字符的匹配',
	'regex.*.syntax': '*', 'regex.*.desc': '匹配前一项 0 次或多次', 'regex.*.example': '\\s* → 剔除 0 个或多个空白',
	'regex.+.syntax': '+', 'regex.+.desc': '匹配前一项 1 次或多次', 'regex.+.example': '\\d+ → 剔除 1 个或多个数字',
	'regex.?.syntax': '?', 'regex.?.desc': '匹配前一项 0 次或 1 次', 'regex.?.example': 'https? → 剔除 http 或 https',
	'regex.{n,m}.syntax': '{n,m}', 'regex.{n,m}.desc': '匹配前一项 n 到 m 次', 'regex.{n,m}.example': '\\d{2,4} → 剔除 2~4 位数字',
	'regex.^.syntax': '^', 'regex.^.desc': '匹配行首', 'regex.^.example': '^\\s+ → 剔除行首空白',
	'regex.$.syntax': '$', 'regex.$.desc': '匹配行尾', 'regex.$.example': '\\s+$ → 剔除行尾空白',
	'regex.|.syntax': '|', 'regex.|.desc': '或运算', 'regex.|.example': 'a|b → 剔除 a 或 b',
	'regex.().syntax': '()', 'regex.().desc': '分组', 'regex.().example': '(ab)+ → 剔除连续的 ab',
	'regex.\\uXXXX.syntax': '\\uXXXX', 'regex.\\uXXXX.desc': '匹配 Unicode 字符', 'regex.\\uXXXX.example': '\\u3000 → 剔除全角空格',
};