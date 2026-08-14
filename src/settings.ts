/**
 * 符号剔除器 - 预设配置与设置页
 */

import { App, Notice, PluginSettingTab, Setting, setIcon, SettingPage, type SettingDefinitionItem } from 'obsidian';
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
	contextMenuPresets: boolean;
	contextMenuEraserBrush: boolean;
	followingToolbar: boolean;
	doubleClickEraserBrush: boolean;
}

/** 默认预设列表 */
export const DEFAULT_PRESETS: RemovePreset[] = [
	{ name: '剔除数字/Strip Digits', mode: 'char', items: ['0123456789'] },
	{ name: '剔除空白/Strip Whitespace', mode: 'regex', items: ['\\s+'] },
	{ name: '剔除中文标点/Strip Cn Punctuation', mode: 'regex', items: ["[，。！？、；：\u201c\u201d\u2018\u2019【】（）《》…—]"] },
	{ name: '剔除英文标点/Strip En Punctuation', mode: 'char', items: ['.,!?;:\'\"()[]{}<>'] },
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
}

/** 主设置页面 - 自定义Tab分页UI */
class MainSettingPage extends SettingPage {
	plugin!: SymbolStripperPlugin;
	tab!: SymbolStripperSettingTab;
	private activeTab: string = 'general';
	private openPresetIndex: number = -1;

	private readonly TABS: TabDef[] = [
		{ id: 'general', name: '' },
		{ id: 'presets', name: '' },
		{ id: 'importExport', name: '' },
	];

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 更新Tab名称（支持语言切换）
		this.TABS[0].name = t('tab.general');
		this.TABS[1].name = t('tab.presets');
		this.TABS[2].name = t('tab.importExport');

		// 渲染Tab栏
		const tabBar = containerEl.createEl('div', { cls: 'symbol-stripper-tabs' });
		for (const tabDef of this.TABS) {
			const tabEl = tabBar.createEl('div', { cls: 'symbol-stripper-tab' });
			tabEl.createSpan({ text: tabDef.name });
			if (tabDef.id === this.activeTab) {
				tabEl.addClass('active');
			}
			tabEl.addEventListener('click', () => {
				if (this.activeTab !== tabDef.id) {
					this.activeTab = tabDef.id;
					this.display();
				}
			});
		}

		// 渲染内容区域
		const contentEl = containerEl.createEl('div', { cls: 'symbol-stripper-content' });
		switch (this.activeTab) {
			case 'general':
				this.displayGeneral(contentEl);
				break;
			case 'presets':
				this.displayPresets(contentEl);
				break;
			case 'importExport':
				this.displayImportExport(contentEl);
				break;
		}
	}

	/** 常规设置 */
	private displayGeneral(containerEl: HTMLElement): void {
		const s = this.plugin.settings;

		// 右键菜单组
		new Setting(containerEl).setName(t('general.contextMenu')).setHeading();

		new Setting(containerEl)
			.setName(t('general.contextMenuPresets'))
			.setDesc(t('general.contextMenuPresets.desc'))
			.addToggle(toggle => toggle
				.setValue(s.useModes.contextMenuPresets)
				.onChange(async (value) => {
					s.useModes.contextMenuPresets = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t('general.contextMenuEraserBrush'))
			.setDesc(t('general.contextMenuEraserBrush.desc'))
			.addToggle(toggle => toggle
				.setValue(s.useModes.contextMenuEraserBrush)
				.onChange(async (value) => {
					s.useModes.contextMenuEraserBrush = value;
					await this.plugin.saveSettings();
				})
			);

		// 跟随栏组
		new Setting(containerEl).setName(t('general.followingToolbar')).setHeading();

		new Setting(containerEl)
			.setName(t('general.followingToolbar'))
			.setDesc(t('general.followingToolbar.desc'))
			.addToggle(toggle => toggle
				.setValue(s.useModes.followingToolbar)
				.onChange(async (value) => {
					s.useModes.followingToolbar = value;
					await this.plugin.saveSettings();
				})
			);

		// 位置九宫格
		const posSetting = new Setting(containerEl)
			.setName(t('general.displayPosition'))
			.setDesc(t('general.displayPosition.desc'));

		const grid = posSetting.controlEl.createDiv({ cls: 'sr-position-grid' });
		let activeBtn: HTMLDivElement | null = null;

		for (let i = 0; i < TOOLBAR_POSITIONS.length; i++) {
			if (i === 4) {
				const centerEl = grid.createDiv({ cls: 'sr-position-btn sr-position-center' });
				setIcon(centerEl, POSITION_CENTER.icon);
				centerEl.createSpan({ cls: 'sr-position-label', text: t('position.center') });
			}

			const pos = TOOLBAR_POSITIONS[i];
			const btn = grid.createDiv({ cls: 'sr-position-btn' });
			setIcon(btn, pos.icon);
			btn.createSpan({ cls: 'sr-position-label', text: t(`position.${pos.value}`) });

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

		// 剔除刷组
		new Setting(containerEl).setName(t('general.eraserBrush')).setHeading();

		new Setting(containerEl)
			.setName(t('general.commonPreset'))
			.setDesc(t('general.commonPreset.desc'))
			.addDropdown(dropdown => dropdown
				.addOptions(Object.fromEntries(s.presets.map(p => [p.name, p.name])))
				.setValue(s.followingToolbarPreset)
				.onChange(async (value: string) => {
					s.followingToolbarPreset = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t('general.doubleClickEnable'))
			.setDesc(t('general.doubleClickEnable.desc'))
			.addToggle(toggle => toggle
				.setValue(s.useModes.doubleClickEraserBrush)
				.onChange(async (value) => {
					s.useModes.doubleClickEraserBrush = value;
					await this.plugin.saveSettings();
				})
			);

		// 语言组
		new Setting(containerEl).setName('语言/Language').setHeading();

		new Setting(containerEl)
			.setName('语言切换/Switch Language')
			.setDesc('若显示语言显示错误，或者你只是想切换着玩，这里切换语言 / If the display language is incorrect, or you just want to switch for fun, change it here.')
			.addDropdown(dropdown => dropdown
				.addOptions({ 'auto': '跟随系统/Follow System', 'zh-CN': '中文', 'en': 'English' })
				.setValue(s.language)
				.onChange(async (value: string) => {
					s.language = value as LangOption;
					initLang(value as LangOption);
					await this.plugin.saveSettings();
					this.display();
				})
			);
	}

	/** 预设管理 */
	private displayPresets(containerEl: HTMLElement): void {
		const doRefresh = () => this.refresh();

		// === 使用说明 ===
		new Setting(containerEl).setName(t('presets.guide')).setHeading();

		const guide = containerEl.createEl('div', { cls: 'sr-guide' });
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
			[t('regex.(.syntax'), t('regex.(.desc'), t('regex.(.example')],
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
		new Setting(containerEl).setName(t('presets.title')).setHeading();

		// 筛选框
		const filterSetting = new Setting(containerEl)
			.setName(t('presets.filter'))
			.setDesc(t('presets.filter.desc'))
			.addDropdown(dropdown => dropdown
				.addOptions({ name: t('presets.filter.name'), content: t('presets.filter.content') })
				.setValue(this.tab.presetFilterMode)
				.onChange((value: string) => {
					this.tab.presetFilterMode = value as 'name' | 'content';
					doRefresh();
				})
			)
			.addText(text => text
				.setValue(this.tab.presetFilter)
				.setPlaceholder(t('presets.filter.placeholder'))
				.onChange((value) => {
					if (this.tab.isComposing) return;
					this.tab.presetFilter = value;
					doRefresh();
				})
			);

		const input = filterSetting.controlEl.querySelector('input');
		if (input) {
			input.addEventListener('compositionstart', () => { this.tab.isComposing = true; });
			input.addEventListener('compositionend', () => {
				this.tab.isComposing = false;
				this.tab.presetFilter = input.value;
				doRefresh();
			});
		}

		if (this.tab.presetFilter) {
			if (input) {
				input.focus();
				input.setSelectionRange(input.value.length, input.value.length);
			}
		}

		const filter = this.tab.presetFilter.toLowerCase();
		for (let i = 0; i < this.plugin.settings.presets.length; i++) {
			const preset = this.plugin.settings.presets[i];

			if (filter) {
				if (this.tab.presetFilterMode === 'name') {
					if (!preset.name.toLowerCase().includes(filter)) continue;
				} else {
					if (!preset.items.some(item => item.toLowerCase().includes(filter))) continue;
				}
			}

			const details = containerEl.createEl('details', { cls: 'preset-details' });
			if (i === this.openPresetIndex) {
				details.open = true;
			}
			const summary = details.createEl('summary');
			summary.createEl('span', { text: preset.name });
			const deleteBtn = summary.createEl('button', { cls: 'sr-preset-delete-btn', text: t('presets.delete') });
			deleteBtn.addEventListener('click', (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				this.plugin.settings.presets.splice(i, 1);
				void this.plugin.saveSettings().then(() => doRefresh());
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

		new Setting(containerEl)
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
	private displayImportExport(containerEl: HTMLElement): void {
		// 导出配置
		new Setting(containerEl)
			.setName(t('importExport.export'))
			.setDesc(t('importExport.export.desc'))
			.addButton(btn => btn
				.setButtonText(t('importExport.export.btn'))
				.onClick(() => {
					const json = JSON.stringify(this.plugin.settings.presets, null, 2);
					const blob = new Blob([json], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const temp = containerEl.createDiv({ cls: 'sr-hidden' });
					const a = temp.createEl('a', { attr: { href: url, download: 'symbol-stripper-presets.json' } });
					a.click();
					temp.remove();
					URL.revokeObjectURL(url);
				})
			);

		// 导入配置
		new Setting(containerEl)
			.setName(t('importExport.import'))
			.setDesc(t('importExport.import.desc'))
			.addButton(btn => btn
				.setButtonText(t('importExport.import.btn'))
				.onClick(() => {
					const temp = containerEl.createDiv({ cls: 'sr-hidden' });
					const input = temp.createEl('input', { type: 'file', attr: { accept: '.json' } });
					input.onchange = async () => {
						const file = input.files?.[0];
						if (!file) return;
						const text = await file.text();
						try {
							const presets = JSON.parse(text);
							if (!Array.isArray(presets)) throw new Error(t('import.notArray'));
							for (let i = 0; i < presets.length; i++) {
								const p = presets[i];
								if (typeof p.name !== 'string' || !p.name.trim()) throw new Error(t('import.invalidName', i + 1));
								if (p.mode !== 'char' && p.mode !== 'regex') throw new Error(t('import.invalidMode', i + 1));
								if (!Array.isArray(p.items)) throw new Error(t('import.invalidItems', i + 1));
							}
							this.plugin.settings.presets = presets;
							await this.plugin.saveSettings();
							new Notice(t('notice.importSuccess'));
						} catch (e: unknown) {
							const msg = e instanceof Error ? e.message : String(e);
							new Notice(t('notice.importFailed', msg), 5000);
						} finally {
							temp.remove();
						}
					};
					input.click();
				})
			);
	}

	/** 刷新预设页面（保持滚动位置） */
	private refresh(): void {
		const shouldAutoScroll = this.openPresetIndex >= 0;
		const scrollContainer = this.containerEl.closest('.vertical-tab-content') as HTMLElement;
		const savedScroll = scrollContainer?.scrollTop ?? 0;

		if (scrollContainer) {
			scrollContainer.classList.add('sr-scroll-locked');
		}

		this.containerEl.empty();
		this.display();

		if (scrollContainer) {
			scrollContainer.scrollTop = savedScroll;
			scrollContainer.classList.remove('sr-scroll-locked');
		}

		if (shouldAutoScroll) {
			const detailsList = this.containerEl.querySelectorAll('.preset-details');
			const target = detailsList[this.openPresetIndex] as HTMLElement;
			this.openPresetIndex = -1;
			if (target && scrollContainer) {
				const containerRect = scrollContainer.getBoundingClientRect();
				const targetRect = target.getBoundingClientRect();
				const targetScrollTop = scrollContainer.scrollTop
					+ targetRect.top - containerRect.top
					- scrollContainer.clientHeight / 2
					+ target.clientHeight / 2;
				scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
			}
		}
	}
}

/** 设置页面 */
export class SymbolStripperSettingTab extends PluginSettingTab {
	plugin: SymbolStripperPlugin;
	presetFilter: string = '';
	presetFilterMode: 'name' | 'content' = 'name';
	isComposing: boolean = false;

	constructor(app: App, plugin: SymbolStripperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: 'page',
				name: t('plugin.name'),
				page: () => {
					const p = new MainSettingPage();
					p.plugin = this.plugin;
					p.tab = this;
					return p;
				},
			},
		];
	}

	override getControlValue(key: string): unknown {
		const s = this.plugin.settings;
		if (key === 'language') return s.language;
		if (key === 'followingToolbarPreset') return s.followingToolbarPreset;
		if (key === 'followingToolbarPosition') return s.followingToolbarPosition;
		if (key in s.useModes) return s.useModes[key as keyof UseModes];
		return undefined;
	}

	override setControlValue(key: string, value: unknown): void {
		const s = this.plugin.settings;
		let needsUpdate = false;

		if (key === 'language') {
			s.language = value as LangOption;
			initLang(value as LangOption);
			needsUpdate = true;
		} else if (key === 'followingToolbarPreset') {
			s.followingToolbarPreset = value as string;
		} else if (key === 'followingToolbarPosition') {
			s.followingToolbarPosition = value as ToolbarDirection;
		} else if (key in s.useModes) {
			(s.useModes as unknown as Record<string, unknown>)[key] = value;
		}

		void this.plugin.saveSettings();

		if (needsUpdate) {
			this.update();
		}
	}
}