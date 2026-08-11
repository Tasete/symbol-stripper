/**
 * 符号剔除器 - 英文字典
 */

export const en: Record<string, string> = {
	// 语言切换
	'language.title': '语言/Language',
	'language.switchLanguage': '语言切换/Switch Language',
	'language.desc': '若显示语言显示错误，或者你只是想切换着玩，这里切换语言 / If the display language is incorrect, or you just want to switch for fun, change it here.',
	'language.auto': 'Follow System',
	'language.zh-CN': '中文',
	'language.en': 'English',

	// 插件名
	'plugin.name': 'Symbol Stripper',

	// Tab
	'tab.general': 'General',
	'tab.presets': 'Presets',
	'tab.importExport': 'Import/Export',

	// 常规 - 右键菜单
	'general.contextMenu': 'Context Menu',
	'general.contextMenuPresets': 'Strip Presets',
	'general.contextMenuPresets.desc': 'Add a "Strip" submenu to the context menu, containing all presets',
	'general.contextMenuEraserBrush': 'Eraser Brush',
	'general.contextMenuEraserBrush.desc': 'Add an "Eraser Brush" toggle to the context menu, auto-strip selected text with the common preset; right-click or Esc to exit',

	// 常规 - 跟随栏
	'general.followingToolbar': 'Following Toolbar',
	'general.followingToolbar.desc': 'Show a strip toolbar next to the cursor after selecting text and releasing the left mouse button',
	'general.displayPosition': 'Display Position',
	'general.displayPosition.desc': 'Position of the floating toolbar relative to the cursor',

	// 常规 - 剔除刷
	'general.eraserBrush': 'Eraser Brush',
	'general.commonPreset': 'Common Preset',
	'general.commonPreset.desc': 'Preset shared by the Eraser Brush and the toolbar "Common" button; double-click "Common" to enter brush mode',
	'general.doubleClickEnable': 'Double-Click Enable',
	'general.doubleClickEnable.desc': 'Double-click the toolbar "Common" button to activate Eraser Brush mode, auto-strip selected text; right-click or Esc to exit',

	// 九宫格
	'position.top-left': 'Top Left',
	'position.top': 'Top',
	'position.top-right': 'Top Right',
	'position.left': 'Left',
	'position.right': 'Right',
	'position.bottom-left': 'Bottom Left',
	'position.bottom': 'Bottom',
	'position.bottom-right': 'Bottom Right',
	'position.center': 'Cursor',

	// 右键菜单
	'contextMenu.strip': 'Strip',
	'contextMenu.enableEraserBrush': 'Enable Eraser Brush',
	'contextMenu.disableEraserBrush': 'Disable Eraser Brush',

	// 命令面板
	'command.strip': 'Strip: {0}',

	// Notice
	'notice.selectFirst': 'Please select text first',
	'notice.eraserBrushActivated': 'Eraser Brush activated: {0}',
	'notice.eraserBrushDeactivated': 'Eraser Brush deactivated',
	'notice.noPreset': 'No preset',
	'notice.executed': 'Executed: {0}',
	'notice.stripFailed': 'Strip failed: {0}',
	'notice.importSuccess': 'Import successful',
	'notice.importFailed': 'Import failed: {0}',

	// Tooltip
	'tooltip.common': 'Common: {0}{1}',
	'tooltip.doubleClickHint': ' (double-click for Eraser Brush)',
	'tooltip.morePresets': 'More presets',

	// 剔除刷指示器
	'eraserBrush.indicator': 'Eraser Brush: {0}',

	// 预设管理
	'presets.guide': 'Usage Guide',
	'presets.guide.intro': 'Each preset contains three items: name, mode, and content:',
	'presets.guide.name': 'Name: the display name of the preset, used for menu and toolbar identification',
	'presets.guide.charMode': '<b>Char Mode</b>: Strip specified characters one by one. e.g. <code>0123456789</code> strips all digits',
	'presets.guide.regexMode': '<b>Regex Mode</b>: Strip by regex pattern matching. e.g. <code>\\s+</code> strips all consecutive whitespace',
	'presets.guide.separator': 'Separator: both char and regex modes allow multiple items on one line or separated by newlines, with the same effect',
	'presets.guide.regexSyntax': 'Supported regex syntax:',
	'presets.regex.syntax': 'Syntax',
	'presets.regex.desc': 'Description',
	'presets.regex.example': 'Example',
	'presets.title': 'Strip Presets',
	'presets.filter': 'Filter Presets',
	'presets.filter.desc': 'Enter keywords to filter presets',
	'presets.filter.name': 'Name',
	'presets.filter.content': 'Content',
	'presets.filter.placeholder': 'Search...',
	'presets.delete': 'Delete',
	'presets.name': 'Name',
	'presets.mode': 'Mode',
	'presets.mode.desc': 'Char Mode: strip specified characters one by one; Regex Mode: strip by regex pattern matching',
	'presets.mode.char': 'Char Mode',
	'presets.mode.regex': 'Regex Mode',
	'presets.content': 'Content',
	'presets.content.char.desc': 'Characters to strip, one item per line',
	'presets.content.regex.desc': 'Regex patterns, one pattern per line',
	'presets.add': 'Add Preset',
	'presets.add.desc': 'Click the button below to add a new strip preset',
	'presets.add.btn': '+ Add',
	'presets.newPreset': 'New Preset',

	// Preset content placeholder
	'presets.content.char.placeholder': 'e.g.:\n0123456789\n.,!?;:\'\"()[]{}<>',
	'presets.content.regex.placeholder': 'e.g.:\n\\s+\n\\d+',

	// 导入/导出
	'importExport.export': 'Export Config',
	'importExport.export.desc': 'Export current preset configuration as a JSON file',
	'importExport.export.btn': 'Export',
	'importExport.import': 'Import Config',
	'importExport.import.desc': 'Import preset configuration from a JSON file (will replace all current presets)',
	'importExport.import.btn': 'Import',

	// 导入校验
	'import.notArray': 'Invalid format: top level is not an array',
	'import.invalidName': 'Item {0} is missing a valid name',
	'import.invalidMode': 'Item {0} has an invalid mode (must be char or regex)',
	'import.invalidItems': 'Item {0} has invalid content format',

	// 正则表 - 每项拆为 syntax/desc/example 三个键
	'regex.\\d.syntax': '\\d', 'regex.\\d.desc': 'Match digits', 'regex.\\d.example': '\\d+ → strip all digits',
	'regex.\\s.syntax': '\\s', 'regex.\\s.desc': 'Match whitespace (space, tab, newline, etc.)', 'regex.\\s.example': '\\s+ → strip consecutive whitespace',
	'regex.\\w.syntax': '\\w', 'regex.\\w.desc': 'Match word characters (letters, digits, underscores)', 'regex.\\w.example': '\\w → strip word characters',
	'regex.[abc].syntax': '[abc]', 'regex.[abc].desc': 'Match any character in the set', 'regex.[abc].example': '[aeiou] → strip vowels',
	'regex.[^abc].syntax': '[^abc]', 'regex.[^abc].desc': 'Match any character not in the set', 'regex.[^abc].example': '[^0-9] → strip non-digits',
	'regex...syntax': '.', 'regex...desc': 'Match any single character (except newline)', 'regex...example': 'a.b → strip matches with any character between a and b',
	'regex.*.syntax': '*', 'regex.*.desc': 'Match previous item 0 or more times', 'regex.*.example': '\\s* → strip 0 or more whitespace',
	'regex.+.syntax': '+', 'regex.+.desc': 'Match previous item 1 or more times', 'regex.+.example': '\\d+ → strip 1 or more digits',
	'regex.?.syntax': '?', 'regex.?.desc': 'Match previous item 0 or 1 time', 'regex.?.example': 'https? → strip http or https',
	'regex.{n,m}.syntax': '{n,m}', 'regex.{n,m}.desc': 'Match previous item n to m times', 'regex.{n,m}.example': '\\d{2,4} → strip 2~4 digit numbers',
	'regex.^.syntax': '^', 'regex.^.desc': 'Match start of line', 'regex.^.example': '^\\s+ → strip leading whitespace',
	'regex.$.syntax': '$', 'regex.$.desc': 'Match end of line', 'regex.$.example': '\\s+$ → strip trailing whitespace',
	'regex.|.syntax': '|', 'regex.|.desc': 'OR operation', 'regex.|.example': 'a|b → strip a or b',
	'regex.().syntax': '()', 'regex.().desc': 'Grouping', 'regex.().example': '(ab)+ → strip consecutive ab',
	'regex.\\uXXXX.syntax': '\\uXXXX', 'regex.\\uXXXX.desc': 'Match Unicode character', 'regex.\\uXXXX.example': '\\u3000 → strip full-width space',
};