/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

type LowCodeViewKind = 'components' | 'variables' | 'datasources' | 'outline';

class LowCodeWorkbenchItem extends vscode.TreeItem {
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
		public readonly children: LowCodeWorkbenchItem[] = [],
		command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.command = command;
	}
}

export class LowCodeWorkbenchViewProvider implements vscode.TreeDataProvider<LowCodeWorkbenchItem> {
	constructor(private readonly kind: LowCodeViewKind) { }

	getTreeItem(element: LowCodeWorkbenchItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: LowCodeWorkbenchItem): LowCodeWorkbenchItem[] {
		if (element) {
			return element.children;
		}

		switch (this.kind) {
			case 'components':
				return [
					new LowCodeWorkbenchItem('Basic', vscode.TreeItemCollapsibleState.Expanded, [
						this.createComponentItem('Button', 'button'),
						this.createComponentItem('Container', 'Container'),
						this.createComponentItem('Text', 'text-paragraph'),
						this.createComponentItem('Image', 'image-default'),
						this.createComponentItem('Text Input', 'text-input'),
						this.createComponentItem('Switch', 'switch')
					])
				];
			case 'variables':
				return [
					new LowCodeWorkbenchItem('Page Variables', vscode.TreeItemCollapsibleState.Expanded, [
						new LowCodeWorkbenchItem('userName: string'),
						new LowCodeWorkbenchItem('userAge: number')
					])
				];
			case 'datasources':
				return [
					new LowCodeWorkbenchItem('No datasources configured')
				];
			case 'outline':
				return [
					new LowCodeWorkbenchItem('Product Intro Page', vscode.TreeItemCollapsibleState.Expanded, [
						new LowCodeWorkbenchItem('Hero Section'),
						new LowCodeWorkbenchItem('Features'),
						new LowCodeWorkbenchItem('CTA'),
						new LowCodeWorkbenchItem('Footer')
					])
				];
		}
	}

	private createComponentItem(label: string, snippetId: string): LowCodeWorkbenchItem {
		const item = new LowCodeWorkbenchItem(label, vscode.TreeItemCollapsibleState.None, [], {
			command: 'wigglycode.lowcode.insertComponent',
			title: vscode.l10n.t('Insert Component'),
			arguments: [snippetId]
		});
		item.tooltip = vscode.l10n.t('Insert {0} into the active WigglyCode page', label);
		item.iconPath = new vscode.ThemeIcon('add');
		return item;
	}
}
