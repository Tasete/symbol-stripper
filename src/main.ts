/**
 * 符号剔除器 - Obsidian 插件入口
 * 
 * 功能：选中文本后，通过浮动工具栏、右键菜单或命令面板一键剔除指定字符/正则匹配
 */

import { Editor, MarkdownView, Menu, MenuItem, Notice, Plugin, setIcon } from 'obsidian';
import { removeChars, removeRegex } from './remover';
import { initLang, t, type LangOption } from './i18n';
import {
	type SymbolStripperSettings,
	type RemovePreset,
	type ToolbarDirection,
	DEFAULT_SETTINGS,
	SymbolStripperSettingTab,
	TOOLBAR_POSITIONS,
} from './settings';

/** 工具栏估算尺寸（用于首次定位，实测后修正） */
const TOOLBAR_EST_W = 70;
const TOOLBAR_EST_H = 36;

/** 光标坐标信息（视口坐标系） */
interface CursorCoords {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/** CodeMirror 6 EditorView 内部 API 类型声明（仅声明本插件使用的属性） */
interface CMEditorView {
	coordsAtPos(pos: number, side?: number): { left: number; right: number; top: number; bottom: number } | null;
	readonly state: { doc: { line(n: number): { from: number } } };
}

/** 旧版 cursorCoords 返回值类型声明 */
interface LegacyCursorCoords {
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
}

/** 获取光标在视口中的坐标（支持 CM6 和旧版 API） */
function getCursorCoords(editor: Editor, view: MarkdownView): CursorCoords | null {
	// 方法1：CodeMirror 6 API（coordsAtPos 返回视口坐标，无需减侧边栏偏移）
	try {
		const cm = (view.editor as unknown as { cm?: CMEditorView }).cm;
		if (cm && cm.coordsAtPos) {
			const head = editor.getCursor('head');
			const line = cm.state.doc.line(head.line + 1);
			const pos = line.from + head.ch;
			const result = cm.coordsAtPos(pos, 1);
			if (result) {
				return {
					left: result.left,
					right: result.right,
					top: result.top,
					bottom: result.bottom,
				};
			}
		}
	} catch {
		// CodeMirror API 不可用
	}

	// 方法2：旧版 editor.cursorCoords API
	try {
		const result = (editor as unknown as { cursorCoords?: (pos: string, context: string) => LegacyCursorCoords | null }).cursorCoords?.('head', 'window');
		if (result) {
			return {
				left: result.left ?? 0,
				right: result.right ?? (result.left ?? 0) + 1,
				top: result.top ?? 0,
				bottom: result.bottom ?? 0,
			};
		}
	} catch {
		// 忽略
	}

	return null;
}

/** 根据方向计算工具栏位置 */
function calcToolbarPosition(
	direction: ToolbarDirection,
	coords: CursorCoords,
	toolbarW: number,
	toolbarH: number,
	gap: number
): { left: number; top: number } {
	const cursorX = (coords.left + coords.right) / 2;
	const cursorY = (coords.top + coords.bottom) / 2;

	switch (direction) {
		case 'top':          return { left: cursorX - toolbarW / 2, top: coords.top - toolbarH - gap };
		case 'bottom':       return { left: cursorX - toolbarW / 2, top: coords.bottom + gap };
		case 'left':         return { left: coords.left - toolbarW - gap, top: cursorY - toolbarH / 2 };
		case 'right':        return { left: coords.right + gap, top: cursorY - toolbarH / 2 };
		case 'top-left':     return { left: coords.left - toolbarW - gap, top: coords.top - toolbarH - gap };
		case 'top-right':    return { left: coords.right + gap, top: coords.top - toolbarH - gap };
		case 'bottom-left':  return { left: coords.left - toolbarW - gap, top: coords.bottom + gap };
		case 'bottom-right': return { left: coords.right + gap, top: coords.bottom + gap };
	}
}

/** 将工具栏限制在视口边界内 */
function clampToViewport(el: HTMLElement, gap: number): void {
	const rect = el.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	if (rect.left < 0) el.style.setProperty('--sr-left', `${gap}px`);
	if (rect.right > vw) el.style.setProperty('--sr-left', `${vw - rect.width - gap}px`);
	if (rect.top < 0) el.style.setProperty('--sr-top', `${gap}px`);
	if (rect.bottom > vh) el.style.setProperty('--sr-top', `${vh - rect.height - gap}px`);
}

export default class SymbolStripperPlugin extends Plugin {
	settings: SymbolStripperSettings = DEFAULT_SETTINGS;
	private floatingToolbar: HTMLElement | null = null;
	private moreDropdown: HTMLElement | null = null;
	private isEraserBrushActive: boolean = false;
	private eraserBrushIndicator: HTMLElement | null = null;
	private lastSelection: string = '';
	private currentEditor: Editor | null = null;

	async onload() {
		await this.loadSettings();
		initLang(this.settings.language);

		// 右键菜单：始终注册，在处理器内检查开关（registerEvent 无法单独注销）
		this.registerContextMenu();

		// 注册命令面板命令：始终可用
		this.registerCommands();

		// 浮动工具栏：始终注册，在处理器内检查开关（registerDomEvent 无法单独注销）
		this.registerFollowingToolbar();

		// 设置页面
		this.addSettingTab(new SymbolStripperSettingTab(this.app, this));

		}

	onunload() {
		this.removeFloatingToolbar();
		this.hideMoreDropdown();
		this.deactivateEraserBrush();
		}

	/** 注册右键菜单 */
	private registerContextMenu(): void {
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				const selection = editor.getSelection();
				if (!selection) return;

				// 剔除预设子菜单
				if (this.settings.useModes.contextMenuPresets) {
					menu.addItem((item: MenuItem) => {
						item.setTitle(t('contextMenu.strip'));
						const submenu = (item as unknown as { setSubmenu(): Menu }).setSubmenu();
						
						for (const preset of this.settings.presets) {
							submenu.addItem((subItem: MenuItem) => {
								subItem
									.setTitle(preset.name)
									.onClick(() => {
										this.applyPreset(editor, selection, preset);
									});
							});
						}
					});
				}

				// 剔除刷开关项
				if (this.settings.useModes.contextMenuEraserBrush) {
					menu.addItem((item: MenuItem) => {
						item
							.setTitle(this.isEraserBrushActive ? t('contextMenu.disableEraserBrush') : t('contextMenu.enableEraserBrush'))
							.onClick(() => {
								if (this.isEraserBrushActive) {
									this.deactivateEraserBrush();
								} else {
									this.currentEditor = editor;
									this.activateEraserBrush();
								}
							});
					});
				}
			})
		);
	}

	/** 注册命令面板命令 */
	private registerCommands(): void {
		for (const preset of this.settings.presets) {
			this.addCommand({
				id: `symbol-stripper-${preset.name}`,
				name: t('command.strip', preset.name),
				editorCallback: (editor) => {
					const selection = editor.getSelection();
					if (!selection) {
						new Notice(t('notice.selectFirst'));
						return;
					}
					this.applyPreset(editor, selection, preset);
				},
			});
		}
	}

	/** 注册浮动工具栏 */
	private registerFollowingToolbar(): void {
		// 鼠标释放时检查选区
		this.registerDomEvent(document, 'mouseup', (evt: MouseEvent) => {
			if (this.isClickOnUI(evt)) return;
			// 延迟一帧，确保选区已更新
			window.setTimeout(() => this.handleSelectionChange(), 50);
		});

		// 点击工具栏外部时隐藏
		this.registerDomEvent(document, 'mousedown', (evt: MouseEvent) => {
			if (this.isClickOnUI(evt)) return;
			this.hideMoreDropdown();
			this.hideFloatingToolbar();
		});

		// 键盘选区：方向键/Shift等释放后检查选区
		this.registerDomEvent(document, 'keyup', (evt: KeyboardEvent) => {
			if (evt.key.startsWith('Arrow') || evt.key === 'Home' || evt.key === 'End' ||
				evt.key === 'PageUp' || evt.key === 'PageDown' || evt.key === 'Shift') {
				window.setTimeout(() => this.handleSelectionChange(), 50);
			}
		});

		// Esc 退出剔除刷模式
		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			if (evt.key === 'Escape') {
				if (this.isEraserBrushActive) {
					this.deactivateEraserBrush();
				}
				this.hideFloatingToolbar();
			}
		});

		// 右键退出剔除刷模式（注册到插件生命周期，卸载时自动清理）
		this.registerDomEvent(document, 'contextmenu', () => {
			if (this.isEraserBrushActive) {
				this.deactivateEraserBrush();
			}
		}, true);
	}

	/** 处理选区变化：决定显示/隐藏工具栏或应用剔除刷 */
	private handleSelectionChange(): void {
		// 跟随栏禁用时，隐藏已有工具栏并跳过
		if (!this.settings.useModes.followingToolbar) {
			this.hideFloatingToolbar();
			return;
		}

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			if (!this.isEraserBrushActive) this.hideFloatingToolbar();
			return;
		}

		const editor = activeView.editor;
		const selection = editor.getSelection();

		if (!selection || !selection.trim()) {
			if (!this.isEraserBrushActive) this.hideFloatingToolbar();
			return;
		}

		// 剔除刷模式：自动应用预设
		if (this.isEraserBrushActive) {
			const preset = this.getCommonPreset();
			if (preset) {
				this.applyPreset(editor, selection, preset);
			}
			return;
		}

		// 正常模式：显示浮动工具栏
		this.lastSelection = selection;
		this.showFloatingToolbar(editor, activeView);
	}

	/** 检查点击是否在 UI 元素上 */
	private isClickOnUI(evt: MouseEvent): boolean {
		if (this.floatingToolbar && this.floatingToolbar.contains(evt.target as Node)) return true;
		if (this.moreDropdown && this.moreDropdown.contains(evt.target as Node)) return true;
		if (this.eraserBrushIndicator && this.eraserBrushIndicator.contains(evt.target as Node)) return true;
		return false;
	}

	/** 获取"常用"预设 */
	private getCommonPreset(): RemovePreset | undefined {
		const presetName = this.settings.followingToolbarPreset;
		const found = this.settings.presets.find(p => p.name === presetName);
		if (found) return found;
		// 配置的预设名不存在时，回退到第一个预设
		const fallback = this.settings.presets[0];
		if (fallback) {
			this.settings.followingToolbarPreset = fallback.name;
		}
		return fallback;
	}

	/** 确保浮动工具栏 DOM 已创建（单例模式） */
	private ensureToolbarDOM(): HTMLElement {
		if (this.floatingToolbar) return this.floatingToolbar;

		const toolbar = document.body.createEl('div', { cls: 'symbol-stripper-toolbar' });
		this.floatingToolbar = toolbar;

		// "常用"按钮
		const commonBtn = toolbar.createEl('button', { cls: 'symbol-stripper-btn sr-btn-common' });
		setIcon(commonBtn, 'lucide-star');

		// 使用 event.detail 区分单击/双击（无延迟，无需定时器）
		commonBtn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			const editor = this.currentEditor;
			if (!editor) return;
			const preset = this.getCommonPreset();
			if (e.detail >= 2) {
				// 双击
				if (this.settings.useModes.doubleClickEraserBrush) {
					this.activateEraserBrush();
					this.hideMoreDropdown();
					this.hideFloatingToolbar();
				} else if (preset) {
					this.applyPreset(editor, this.lastSelection, preset);
				}
			} else {
				// 单击
				if (preset) {
					this.applyPreset(editor, this.lastSelection, preset);
				}
			}
		});

		// 更新 tooltip
		this.updateCommonBtnTooltip(commonBtn);

		// "更多"按钮（仅在有剩余预设时显示）
		this.updateMoreButton(toolbar);

		return toolbar;
	}

	/** 更新"常用"按钮的 tooltip */
	private updateCommonBtnTooltip(btn?: HTMLElement): void {
		const el = btn ?? this.floatingToolbar?.querySelector('.sr-btn-common');
		if (!el) return;
		const preset = this.getCommonPreset();
		const suffix = this.settings.useModes.doubleClickEraserBrush ? t('tooltip.doubleClickHint') : '';
		el.title = preset ? t('tooltip.common', preset.name, suffix) : t('tooltip.common', '', '');
	}

	/** 更新"更多"按钮（预设列表变化时调用） */
	private updateMoreButton(toolbar: HTMLElement): void {
		// 移除旧的"更多"按钮
		toolbar.querySelectorAll('.sr-btn-more').forEach(b => b.remove());

		const remainingPresets = this.settings.presets.filter(
			p => p.name !== this.settings.followingToolbarPreset
		);

		if (remainingPresets.length > 0) {
			const moreBtn = toolbar.createEl('button', { cls: 'symbol-stripper-btn sr-btn-more' });
			setIcon(moreBtn, 'lucide-more-horizontal');
			moreBtn.title = t('tooltip.morePresets');

			moreBtn.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.toggleMoreDropdown(moreBtn);
			});
		}
	}

	/** 显示浮动工具栏（单例模式：只更新位置和可见性） */
	private showFloatingToolbar(editor: Editor, view: MarkdownView): void {
		this.hideMoreDropdown();
		this.currentEditor = editor;

		const coords = getCursorCoords(editor, view);
		if (!coords) return;

		const toolbar = this.ensureToolbarDOM();

		// 更新按钮状态（预设可能已变更）
		this.updateCommonBtnTooltip();
		this.updateMoreButton(toolbar);

			// 定位
		const direction = this.settings.followingToolbarPosition;
		const gap = 8;
		const estW = TOOLBAR_EST_W, estH = TOOLBAR_EST_H;
		const pos = calcToolbarPosition(direction, coords, estW, estH, gap);

		toolbar.style.setProperty('--sr-left', `${pos.left}px`);
		toolbar.style.setProperty('--sr-top', `${pos.top}px`);
		toolbar.classList.remove('sr-hidden');

		// 用实测尺寸修正定位 + 视口边界修正
		window.requestAnimationFrame(() => {
			if (!this.floatingToolbar) return;
			const rect = this.floatingToolbar.getBoundingClientRect();

			// 如果估算与实测差异大，用实测值重新计算
			if (Math.abs(rect.width - estW) > 4 || Math.abs(rect.height - estH) > 4) {
				const corrected = calcToolbarPosition(direction, coords, rect.width, rect.height, gap);
				this.floatingToolbar.style.setProperty('--sr-left', `${corrected.left}px`);
				this.floatingToolbar.style.setProperty('--sr-top', `${corrected.top}px`);
			}

			// 视口边界修正
			clampToViewport(this.floatingToolbar, gap);
		});
	}

	/** 隐藏浮动工具栏（保留DOM，仅隐藏可见性） */
	private hideFloatingToolbar(): void {
		if (this.floatingToolbar) {
			this.floatingToolbar.classList.add('sr-hidden');
		}
		this.currentEditor = null;
	}

	/** 销毁浮动工具栏（插件卸载时调用） */
	private removeFloatingToolbar(): void {
		if (this.floatingToolbar) {
			this.floatingToolbar.remove();
			this.floatingToolbar = null;
		}
		this.currentEditor = null;
	}

	/** 切换"更多"下拉菜单 */
	private toggleMoreDropdown(anchorBtn: HTMLElement): void {
		if (this.moreDropdown) {
			this.hideMoreDropdown();
			return;
		}

		const dropdown = document.body.createEl('div', { cls: 'sr-more-dropdown' });
		this.moreDropdown = dropdown;

		const remainingPresets = this.settings.presets.filter(
			p => p.name !== this.settings.followingToolbarPreset
		);

		for (const preset of remainingPresets) {
			const item = dropdown.createEl('div', { cls: 'sr-more-item', text: preset.name });
			item.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				const editor = this.currentEditor;
				if (!editor) return;
				const selection = editor.getSelection();
				if (selection) {
					this.applyPreset(editor, selection, preset);
				} else {
					this.applyPreset(editor, this.lastSelection, preset);
				}
				this.hideMoreDropdown();
				this.hideFloatingToolbar();
			});
		}

		// 定位下拉菜单
		const btnRect = anchorBtn.getBoundingClientRect();
		dropdown.style.setProperty('--sr-left', `${btnRect.left}px`);
		dropdown.style.setProperty('--sr-top', `${btnRect.bottom + 4}px`);
	}

	/** 隐藏"更多"下拉菜单 */
	private hideMoreDropdown(): void {
		if (this.moreDropdown) {
			this.moreDropdown.remove();
			this.moreDropdown = null;
		}
	}

	/** 激活剔除刷 */
	private activateEraserBrush(): void {
		if (this.isEraserBrushActive) return;
		this.isEraserBrushActive = true;
		document.body.classList.add('sr-eraser-brush-active');
		const preset = this.getCommonPreset();
		new Notice(t('notice.eraserBrushActivated', preset?.name ?? t('notice.noPreset')));
		this.showEraserBrushIndicator();
	}

	/** 停用剔除刷 */
	private deactivateEraserBrush(): void {
		if (!this.isEraserBrushActive) return;
		this.isEraserBrushActive = false;
		document.body.classList.remove('sr-eraser-brush-active');
		this.hideEraserBrushIndicator();
		new Notice(t('notice.eraserBrushDeactivated'));
	}

	/** 显示剔除刷指示器 */
	private showEraserBrushIndicator(): void {
		this.hideEraserBrushIndicator();
		const indicator = document.body.createEl('div', { cls: 'sr-eraser-indicator' });
		const preset = this.getCommonPreset();
		indicator.createEl('span', { cls: 'sr-eraser-indicator-text', text: t('eraserBrush.indicator', preset?.name ?? t('notice.noPreset')) });
		const closeBtn = indicator.createEl('button', { cls: 'sr-eraser-indicator-close' });
		setIcon(closeBtn, 'lucide-x');
		closeBtn.addEventListener('click', () => {
			this.deactivateEraserBrush();
		});
		this.eraserBrushIndicator = indicator;
	}

	/** 隐藏剔除刷指示器 */
	private hideEraserBrushIndicator(): void {
		if (this.eraserBrushIndicator) {
			this.eraserBrushIndicator.remove();
			this.eraserBrushIndicator = null;
		}
	}

	/** 应用预设到选中文本 */
	private applyPreset(editor: Editor, selection: string, preset: RemovePreset): void {
		try {
			const result = preset.mode === 'char'
				? removeChars(selection, preset.items)
				: removeRegex(selection, preset.items);

			editor.replaceSelection(result);
			new Notice(t('notice.executed', preset.name));
		} catch (e) {
			new Notice(t('notice.stripFailed', String(e)), 5000);
		}
	}

	/** 加载设置 */
	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData() as Partial<SymbolStripperSettings>) };
		// 确保 useModes 字段完整（字段级合并，兼容旧配置缺少部分字段）
		this.settings.useModes = { ...DEFAULT_SETTINGS.useModes, ...this.settings.useModes };
		// 兼容旧版 contextMenu 字段 → 拆分为 contextMenuPresets + contextMenuEraserBrush
		if ((this.settings.useModes as unknown as Record<string, unknown>).contextMenu !== undefined && (this.settings.useModes as unknown as Record<string, unknown>).contextMenuPresets === undefined) {
			const oldVal = (this.settings.useModes as unknown as Record<string, unknown>).contextMenu as boolean;
			this.settings.useModes.contextMenuPresets = oldVal;
			this.settings.useModes.contextMenuEraserBrush = oldVal;
			delete (this.settings.useModes as unknown as Record<string, unknown>).contextMenu;
		}
		// 兼容旧版 eraserBrush 字段 → doubleClickEraserBrush
		if ((this.settings.useModes as unknown as Record<string, unknown>).eraserBrush !== undefined && (this.settings.useModes as unknown as Record<string, unknown>).doubleClickEraserBrush === undefined) {
			this.settings.useModes.doubleClickEraserBrush = (this.settings.useModes as unknown as Record<string, unknown>).eraserBrush as boolean;
			delete (this.settings.useModes as unknown as Record<string, unknown>).eraserBrush;
		}
		// 确保 followingToolbarPreset 存在（兼容旧配置）
		if (!this.settings.followingToolbarPreset) {
			this.settings.followingToolbarPreset = this.settings.presets[0]?.name ?? '';
		}
		// 校验 followingToolbarPosition 是否为合法方向值
		if (!TOOLBAR_POSITIONS.some(p => p.value === this.settings.followingToolbarPosition)) {
			this.settings.followingToolbarPosition = DEFAULT_SETTINGS.followingToolbarPosition;
		}
	}

	/** 保存设置 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}