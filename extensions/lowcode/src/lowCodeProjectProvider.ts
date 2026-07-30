/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

class LowCodeProjectItem extends vscode.TreeItem {
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly children: LowCodeProjectItem[] = [],
		command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.command = command;
	}
}

export class LowCodeProjectProvider implements vscode.TreeDataProvider<LowCodeProjectItem> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<LowCodeProjectItem | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: LowCodeProjectItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: LowCodeProjectItem): LowCodeProjectItem[] {
		if (element) {
			return element.children;
		}

		return [
			new LowCodeProjectItem('Pages', vscode.TreeItemCollapsibleState.Collapsed, [
				new LowCodeProjectItem('Open Page Designer', vscode.TreeItemCollapsibleState.None, [], {
					command: 'wigglycode.lowcode.openDesigner',
					title: 'Open Page Designer'
				})
			]),
			new LowCodeProjectItem('Datasources', vscode.TreeItemCollapsibleState.None),
			new LowCodeProjectItem('Workflows', vscode.TreeItemCollapsibleState.None),
			new LowCodeProjectItem('Deployments', vscode.TreeItemCollapsibleState.None)
		];
	}
}
