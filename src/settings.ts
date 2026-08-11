/**
 * 符号剔除器 - 预设配置与设置页
 */

import { App, Notice, PluginSettingTab, Setting, setIcon } from 'obsidian';
import type SymbolStripperPlugin from './main';
import { type LangOption, initLang, t } from './i18n';

/** 单个剔除预设 */
export interface RemovePreset {
	name: string;
	mode: 'char' | 'regex';
	items: string[];
}

/** 使用模式开关 */
export interface UseModes {
	contextMenuPresets: boolean;     // 右键菜单：剔除预设
	contextMenuEraserBrush: boolean; // 右键菜单：剔除刷
	followingToolbar: boolean;       // 跟随栏
	doubleClickEraserBrush: boolean; // 双击启用剔除刷
}

/** 默认预设列表 */
export const DEFAULT_PRESETS: RemovePreset[] = [
	{ name: '剔除数字/Strip Digits', mode: 'char', items: ['0123456789'] },
	{ name: '剔除空白/Strip Whitespace', mode: 'regex', items: ['\\s+'] },
	{ name: '剔除中文标点/Strip Cn Punctuation', mode: 'regex', items: ["[，。！？、；：\u201c\u201d\u2018\u2019【】（）《》…—]"] },
	{ name: '剔除英文标点/Strip En Punctuation', mode: 'char', items: ['.,!?;:\'"()[]{}<>'] },
];

/** 跟随栏位置选项（3×3九宫格顺序：左上→右上，左→右，左下→右下，不含中心占位） */
export const TOOLBAR_POSITIONS = [
	{ value: 'top-left', label: '左上方', icon: 'arrow-up-left' },
	{ value: 'top', label: '正上方', icon: 'arrow-up' },
	{ value: 'top-right', label: '右上方', icon: 'arrow-up-right' },
	{ value: 'left', label: '正左侧', icon: 'arrow-left' },
	{ value: 'right', label: '正右侧', icon: 'arrow-right' },
	{ value: 'bottom-left', label: '左下方', icon: 'arrow-down-left' },
	{ value: 'bottom', label: '正下方', icon: 'arrow-down' },
	{ value: 'bottom-right', label: '右下方', icon: 'arrow-down-right' },
] as const;

/** 九宫格中心占位（不可选，仅作视觉锚点） */
export const POSITION_CENTER = { label: '光标', icon: 'scan' } as const;

/** 工具栏定位方向类型（从 TOOLBAR_POSITIONS 推导） */
export type ToolbarDirection = typeof TOOLBAR_POSITIONS[number]['value'];

/** 插件设置 */
export interface SymbolStripperSettings {
	presets: RemovePreset[];
	useModes: UseModes;
	followingToolbarPreset: string;
	followingToolbarPosition: ToolbarDirection;
	language: LangOption;
}

export const DEFAULT_SETTINGS: SymbolStripperSettings = {
	presets: DEFAULT_PRESETS,
	useModes: {
		contextMenuPresets: true,
		contextMenuEraserBrush: true,
		followingToolbar: true,
		doubleClickEraserBrush: false,
	},
	followingToolbarPreset: DEFAULT_PRESETS[0]?.name ?? '',
	followingToolbarPosition: 'bottom-right',
	language: 'auto',
};

/** Tab 定义 */
interface TabDef {
	id: string;
	name: string;
	icon: string;
}

/** 设置页面 */
export class SymbolStripperSettingTab extends PluginSettingTab {
	plugin: SymbolStripperPlugin;
	activeTab: string = 'general';
	openPresetIndex: number = -1;
	presetFilter: string = '';
	presetFilterMode: 'name' | 'content' = 'name';
	private isComposing: boolean = false;

	constructor(app: App, plugin: SymbolStripperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		const shouldAutoScroll = this.openPresetIndex >= 0;
		const scrollContainer = containerEl.closest('.vertical-tab-content') as HTMLElement;
		const savedScroll = scrollContainer?.scrollTop ?? 0;

		// 锁定滚动容器，防止 empty() 导致可见的跳顶
		if (scrollContainer) {
			scrollContainer.style.overflow = 'hidden';
		}

		containerEl.empty();

		containerEl.createEl('h2', { text: t('plugin.name') });

		// === Tab 栏 ===
		const tabs: TabDef[] = [
			{ id: 'general', name: t('tab.general'), icon: 'gear' },
			{ id: 'presets', name: t('tab.presets'), icon: 'lucide-rectangle-ellipsis' },
			{ id: 'importexport', name: t('tab.importExport'), icon: 'lucide-import' },
		];
		const tabBar = containerEl.createEl('div', { cls: 'symbol-stripper-tabs' });
		for (const tab of tabs) {
			const tabEl = tabBar.createEl('div', {
				cls: 'symbol-stripper-tab' + (this.activeTab === tab.id ? ' active' : ''),
			});
			setIcon(tabEl, tab.icon);
			tabEl.createEl('span', { text: tab.name });
			tabEl.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.display();
			});
		}

		// === Tab 内容区 ===
		const content = containerEl.createEl('div', { cls: 'symbol-stripper-content' });

		if (this.activeTab === 'general') {
			this.displayGeneral(content);
		} else if (this.activeTab === 'presets') {
			this.displayPresets(content);
		} else if (this.activeTab === 'importexport') {
			this.displayImportExport(content);
		}

		// 恢复滚动位置并解锁容器（overflow:hidden 期间不渲染跳顶）
		if (scrollContainer) {
			scrollContainer.scrollTop = savedScroll;
			scrollContainer.style.overflow = '';
		}

		// 手动计算目标 scrollTop 并平滑滚动，避免 scrollIntoView 的布局延迟
		if (shouldAutoScroll) {
			const detailsList = containerEl.querySelectorAll('.preset-details');
			const target = detailsList[this.openPresetIndex] as HTMLElement;
			this.openPresetIndex = -1;
			if (target && scrollContainer) {
				const containerRect = scrollContainer.getBoundingClientRect();
				const targetRect = target.getBoundingClientRect();
				// 目标居中：当前scrollTop + 相对偏移 - 半容器高 + 半目标高
				const targetScrollTop = scrollContainer.scrollTop
					+ targetRect.top - containerRect.top
					- scrollContainer.clientHeight / 2
					+ target.clientHeight / 2;
				scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
			}
		}
	}

	/** 常规设置 */
	private displayGeneral(container: HTMLElement): void {
		// === 语言/Language ===
		container.createEl('h3', { text: '语言/Language' });

		new Setting(container)
			.setName('语言切换/Switch Language')
			.setDesc('若显示语言显示错误，或者你只是想切换着玩，这里切换语言 / If the display language is incorrect, or you just want to switch for fun, change it here.')
			.addDropdown(dropdown => dropdown
				.addOptions({ 'auto': '跟随系统/Follow System', 'zh-CN': '中文', 'en': 'English' })
				.setValue(this.plugin.settings.language)
				.onChange(async (value: string) => {
					this.plugin.settings.language = value as LangOption;
					initLang(value as LangOption);
					await this.plugin.saveSettings();
					this.display();
				})
			);

		// === 右键菜单 ===
		container.createEl('h3', { text: t('general.contextMenu') });

		new Setting(container)
			.setName(t('general.contextMenuPresets'))
			.setDesc(t('general.contextMenuPresets.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useModes.contextMenuPresets)
				.onChange(async (value) => {
					this.plugin.settings.useModes.contextMenuPresets = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(container)
			.setName(t('general.contextMenuEraserBrush'))
			.setDesc(t('general.contextMenuEraserBrush.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useModes.contextMenuEraserBrush)
				.onChange(async (value) => {
					this.plugin.settings.useModes.contextMenuEraserBrush = value;
					await this.plugin.saveSettings();
				})
			);

		// === 跟随栏 ===
		container.createEl('h3', { text: t('general.followingToolbar') });

		new Setting(container)
			.setName(t('general.followingToolbar'))
			.setDesc(t('general.followingToolbar.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useModes.followingToolbar)
				.onChange(async (value) => {
					this.plugin.settings.useModes.followingToolbar = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(container)
			.setName(t('general.displayPosition'))
			.setDesc(t('general.displayPosition.desc'))
			.then(setting => {
				const grid = setting.controlEl.createDiv({ cls: 'sr-position-grid' });
				let activeBtn: HTMLDivElement | null = null;

				for (let i = 0; i < TOOLBAR_POSITIONS.length; i++) {
					// 在第4个位置（left 之后）插入中心占位格
					if (i === 4) {
						const centerEl = grid.createDiv({ cls: 'sr-position-btn sr-position-center' });
						setIcon(centerEl, POSITION_CENTER.icon);
						centerEl.createSpan({ cls: 'sr-position-label', text: t('position.center') });
					}

					const pos = TOOLBAR_POSITIONS[i];
					const btn = grid.createDiv({ cls: 'sr-position-btn' });
					setIcon(btn, pos.icon);
					btn.createSpan({ cls: 'sr-position-label', text: t(`position.${pos.value}` as string) });

					if (this.plugin.settings.followingToolbarPosition === pos.value) {
						btn.addClass('sr-position-active');
						activeBtn = btn;
					}

					btn.addEventListener('click', () => {
						if (activeBtn) activeBtn.removeClass('sr-position-active');
						btn.addClass('sr-position-active');
						activeBtn = btn;
						this.plugin.settings.followingToolbarPosition = pos.value;
						void this.plugin.saveSettings();
					});
				}
			});

		// === 剔除刷 ===
		container.createEl('h3', { text: t('general.eraserBrush') });

		new Setting(container)
			.setName(t('general.commonPreset'))
			.setDesc(t('general.commonPreset.desc'))
			.addDropdown(dropdown => {
				for (const preset of this.plugin.settings.presets) {
					dropdown.addOption(preset.name, preset.name);
				}
				dropdown.setValue(this.plugin.settings.followingToolbarPreset || this.plugin.settings.presets[0]?.name || '')
					.onChange(async (value) => {
						this.plugin.settings.followingToolbarPreset = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName(t('general.doubleClickEnable'))
			.setDesc(t('general.doubleClickEnable.desc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useModes.doubleClickEraserBrush)
				.onChange(async (value) => {
					this.plugin.settings.useModes.doubleClickEraserBrush = value;
					await this.plugin.saveSettings();
				})
			);
	}

	/** 预设管理 */
	displayPresets(container: HTMLElement, refresh?: () => void): void {
		const doRefresh = refresh ?? (() => this.display());
		// === 使用说明 ===
		container.createEl('h3', { text: t('presets.guide') });

		const guide = container.createEl('div', { cls: 'sr-guide' });

		guide.createEl('p', { text: t('presets.guide.intro') });
		const formatList = guide.createEl('ul');
		formatList.createEl('li', { text: t('presets.guide.name') });
		const charModeLi = formatList.createEl('li');
		charModeLi.createEl('strong', { text: t('presets.guide.charMode.label') });
		charModeLi.appendText(t('presets.guide.charMode.desc'));
		charModeLi.createEl('code', { text: t('presets.guide.charMode.code') });
		charModeLi.appendText(t('presets.guide.charMode.suffix'));
		const regexModeLi = formatList.createEl('li');
		regexModeLi.createEl('strong', { text: t('presets.guide.regexMode.label') });
		regexModeLi.appendText(t('presets.guide.regexMode.desc'));
		regexModeLi.createEl('code', { text: t('presets.guide.regexMode.code') });
		regexModeLi.appendText(t('presets.guide.regexMode.suffix'));
		formatList.createEl('li', { text: t('presets.guide.separator') });

		guide.createEl('p', { text: t('presets.guide.regexSyntax'), cls: 'sr-guide-subtitle' });
		const regexTable = guide.createEl('table', { cls: 'sr-regex-table' });
		const thead = regexTable.createEl('thead');
		const headRow = thead.createEl('tr');
		headRow.createEl('th', { text: t('presets.regex.syntax') });
		headRow.createEl('th', { text: t('presets.regex.desc') });
		headRow.createEl('th', { text: t('presets.regex.example') });
		const tbody = regexTable.createEl('tbody');
		const regexItems: [string, string, string][] = [
			[t('regex.\\d.syntax'), t('regex.\\d.desc'), t('regex.\\d.example')],
			[t('regex.\\s.syntax'), t('regex.\\s.desc'), t('regex.\\s.example')],
			[t('regex.\\w.syntax'), t('regex.\\w.desc'), t('regex.\\w.example')],
			[t('regex.[abc].syntax'), t('regex.[abc].desc'), t('regex.[abc].example')],
			[t('regex.[^abc].syntax'), t('regex.[^abc].desc'), t('regex.[^abc].example')],
			[t('regex...syntax'), t('regex...desc'), t('regex...example')],
			[t('regex.*.syntax'), t('regex.*.desc'), t('regex.*.example')],
			[t('regex.+.syntax'), t('regex.+.desc'), t('regex.+.example')],
			[t('regex.?.syntax'), t('regex.?.desc'), t('regex.?.example')],
			[t('regex.{n,m}.syntax'), t('regex.{n,m}.desc'), t('regex.{n,m}.example')],
			[t('regex.^.syntax'), t('regex.^.desc'), t('regex.^.example')],
			[t('regex.$.syntax'), t('regex.$.desc'), t('regex.$.example')],
			[t('regex.|.syntax'), t('regex.|.desc'), t('regex.|.example')],
			[t('regex.().syntax'), t('regex.().desc'), t('regex.().example')],
			[t('regex.\\uXXXX.syntax'), t('regex.\\uXXXX.desc'), t('regex.\\uXXXX.example')],
		];
		for (const [syntax, desc, example] of regexItems) {
			const row = tbody.createEl('tr');
			const syntaxTd = row.createEl('td');
			syntaxTd.createEl('code', { text: syntax });
			row.createEl('td', { text: desc });
			const exampleTd = row.createEl('td');
			exampleTd.createEl('code', { text: example });
		}

		// === 剔除预设 ===
		container.createEl('h3', { text: t('presets.title') });

		// 筛选框（处理中文输入法组合问题）
		const filterSetting = new Setting(container)
			.setName(t('presets.filter'))
			.setDesc(t('presets.filter.desc'))
			.addDropdown(dropdown => dropdown
				.addOptions({ name: t('presets.filter.name'), content: t('presets.filter.content') })
				.setValue(this.presetFilterMode)
				.onChange((value: string) => {
					this.presetFilterMode = value as 'name' | 'content';
					doRefresh();
				})
			)
			.addText(text => text
				.setValue(this.presetFilter)
				.setPlaceholder(t('presets.filter.placeholder'))
				.onChange((value) => {
					if (this.isComposing) return;
					this.presetFilter = value;
					doRefresh();
				})
			);

		// 监听输入法组合事件，解决中文输入时 onChange 过早触发
		const input = filterSetting.controlEl.querySelector('input');
		if (input) {
			input.addEventListener('compositionstart', () => { this.isComposing = true; });
			input.addEventListener('compositionend', () => {
				this.isComposing = false;
				this.presetFilter = input.value;
				doRefresh();
			});
		}

		// 恢复筛选框焦点和光标位置
		if (this.presetFilter) {
			if (input) {
				input.focus();
				input.setSelectionRange(input.value.length, input.value.length);
			}
		}

		const filter = this.presetFilter.toLowerCase();
		for (let i = 0; i < this.plugin.settings.presets.length; i++) {
			const preset = this.plugin.settings.presets[i];

			// 筛选：根据模式匹配预设名或内容
			if (filter) {
				if (this.presetFilterMode === 'name') {
					if (!preset.name.toLowerCase().includes(filter)) continue;
				} else {
					if (!preset.items.some(item => item.toLowerCase().includes(filter))) continue;
				}
			}

			const details = container.createEl('details', { cls: 'preset-details' });
			if (i === this.openPresetIndex) {
				details.open = true;
			}
			const summary = details.createEl('summary');
			summary.createEl('span', { text: preset.name });
			const deleteBtn = summary.createEl('button', { cls: 'sr-preset-delete-btn', text: t('presets.delete') });
			deleteBtn.addEventListener('click', async (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.plugin.settings.presets.splice(i, 1);
				await this.plugin.saveSettings();
				doRefresh();
			});

			const body = details.createEl('div', { cls: 'preset-body' });

			new Setting(body)
				.setName(t('presets.name'))
				.addText(text => text
					.setValue(preset.name)
					.onChange(async (value) => {
						preset.name = value;
						details.querySelector('summary span')!.textContent = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(body)
				.setName(t('presets.mode'))
				.setDesc(t('presets.mode.desc'))
				.addDropdown(dropdown => dropdown
					.addOptions({ char: t('presets.mode.char'), regex: t('presets.mode.regex') })
					.setValue(preset.mode)
					.onChange(async (value: string) => {
						preset.mode = value as 'char' | 'regex';
						await this.plugin.saveSettings();
					})
				);

			new Setting(body)
				.setName(t('presets.content'))
				.setDesc(preset.mode === 'char'
					? t('presets.content.char.desc')
					: t('presets.content.regex.desc'))
				.addTextArea(text => text
					.setValue(preset.items.join('\n'))
					.setPlaceholder(preset.mode === 'char' ? t('presets.content.char.placeholder') : t('presets.content.regex.placeholder'))
					.onChange(async (value) => {
						preset.items = value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
						await this.plugin.saveSettings();
					})
				);
		}

		new Setting(container)
			.setName(t('presets.add'))
			.setDesc(t('presets.add.desc'))
			.addButton(btn => btn
				.setButtonText(t('presets.add.btn'))
				.onClick(async () => {
					this.plugin.settings.presets.push({
						name: t('presets.newPreset'),
						mode: 'char',
						items: [''],
					});
					await this.plugin.saveSettings();
					this.openPresetIndex = this.plugin.settings.presets.length - 1;
					doRefresh();
				})
			);
	}

	/** 导入/导出 */
	displayImportExport(container: HTMLElement, refresh?: () => void): void {
		const doRefresh = refresh ?? (() => this.display());
		new Setting(container)
			.setName(t('importExport.export'))
			.setDesc(t('importExport.export.desc'))
			.addButton(btn => btn
				.setButtonText(t('importExport.export.btn'))
				.onClick(() => {
					const json = JSON.stringify(this.plugin.settings.presets, null, 2);
					const blob = new Blob([json], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'symbol-stripper-presets.json';
					a.click();
					URL.revokeObjectURL(url);
				})
			);

		new Setting(container)
			.setName(t('importExport.import'))
			.setDesc(t('importExport.import.desc'))
			.addButton(btn => btn
				.setButtonText(t('importExport.import.btn'))
				.onClick(() => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = '.json';
					input.onchange = async () => {
						const file = input.files?.[0];
						if (!file) return;
						const text = await file.text();
						try {
							const presets = JSON.parse(text);
							if (!Array.isArray(presets)) throw new Error(t('import.notArray'));
							// 校验每个预设的结构
							for (let i = 0; i < presets.length; i++) {
								const p = presets[i];
								if (typeof p.name !== 'string' || !p.name.trim()) throw new Error(t('import.invalidName', i + 1));
								if (p.mode !== 'char' && p.mode !== 'regex') throw new Error(t('import.invalidMode', i + 1));
								if (!Array.isArray(p.items)) throw new Error(t('import.invalidItems', i + 1));
							}
							this.plugin.settings.presets = presets;
							await this.plugin.saveSettings();
							doRefresh();
							new Notice(t('notice.importSuccess'));
						} catch (e: any) {
							new Notice(t('notice.importFailed', e.message ?? String(e)), 5000);
						}
					};
					input.click();
				})
			);
	}
}