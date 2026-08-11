/**
 * 符号剔除器 - 国际化入口
 * 
 * 提供 t() 翻译函数，支持简单插值 {0}, {1}, ...
 */

import { zhCN } from './zh-cn';
import { en } from './en';

/** 语言选项 */
export type LangOption = 'auto' | 'zh-CN' | 'en';

const dicts: Record<string, Record<string, string>> = { 'zh-CN': zhCN, en };

/** 当前语言设置（由插件设置驱动） */
let currentLangSetting: LangOption = 'auto';

/** 注册语言设置（在插件 loadSettings 后调用） */
export function initLang(langSetting: LangOption): void {
	currentLangSetting = langSetting;
}

/** 获取当前语言（优先手动选择，其次 navigator.language，兜底 zh-CN） */
function getLang(): string {
	if (currentLangSetting !== 'auto') return currentLangSetting;
	const nav = navigator.language;
	if (nav.startsWith('zh')) return 'zh-CN';
	if (nav.startsWith('en')) return 'en';
	return 'zh-CN';
}

/**
 * 翻译函数
 * @param key 字典键
 * @param args 插值参数，替换 {0}, {1}, ...
 */
export function t(key: string, ...args: (string | number)[]): string {
	const dict = dicts[getLang()] ?? dicts['zh-CN'];
	let text = dict[key] ?? zhCN[key] ?? key;
	args.forEach((arg, i) => {
		text = text.replace(`{${i}}`, String(arg));
	});
	return text;
}

/** 获取当前生效的语言代码（用于 UI 显示） */
export function getCurrentLang(): string {
	return getLang();
}