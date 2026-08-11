/**
 * 符号剔除器 - 核心剔除逻辑
 * 从 Python 版本直译而来
 */

/** 字符模式：将每个元素中的所有字符逐个剔除 */
export function removeChars(source: string, charItems: string[]): string {
	const charSet = new Set<string>();
	for (const item of charItems) {
		for (const ch of item) {
			charSet.add(ch);
		}
	}
	if (charSet.size === 0) return source;
	return [...source].filter(ch => !charSet.has(ch)).join('');
}

/** 正则模式：对每个正则模式逐一执行替换 */
export function removeRegex(source: string, regexItems: string[]): string {
	let result = source;
	for (const pattern of regexItems) {
		try {
			result = result.replace(new RegExp(pattern, 'g'), '');
		} catch (e) {
			throw new Error(`正则表达式错误 '${pattern}'：${e}`);
		}
	}
	return result;
}