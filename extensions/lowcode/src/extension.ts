/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LowCodeComponentsViewProvider } from './lowCodeComponentsView';
import { LowCodeDesignerPanel } from './lowCodeDesignerPanel';
import { LowCodeProjectProvider } from './lowCodeProjectProvider';
import { LowCodeWorkbenchViewProvider } from './lowCodeWorkbenchViews';

export function activate(context: vscode.ExtensionContext): void {
	const projectProvider = new LowCodeProjectProvider();

	context.subscriptions.push(vscode.window.registerTreeDataProvider('wigglycode.project', projectProvider));
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('wigglycode.components', new LowCodeComponentsViewProvider(context.extensionUri), {
		webviewOptions: { retainContextWhenHidden: true }
	}));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('wigglycode.variables', new LowCodeWorkbenchViewProvider('variables')));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('wigglycode.datasources', new LowCodeWorkbenchViewProvider('datasources')));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('wigglycode.outline', new LowCodeWorkbenchViewProvider('outline')));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.openDesigner', () => {
		LowCodeDesignerPanel.show(context.extensionUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.designMode', () => {
		LowCodeDesignerPanel.post('designMode');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.previewMode', () => {
		LowCodeDesignerPanel.post('previewMode');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.codeMode', () => {
		LowCodeDesignerPanel.post('codeMode');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.selectTool', () => {
		LowCodeDesignerPanel.post('selectTool');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.panTool', () => {
		LowCodeDesignerPanel.post('panTool');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.zoomOut', () => {
		LowCodeDesignerPanel.post('zoomOut');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.zoomIn', () => {
		LowCodeDesignerPanel.post('zoomIn');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.resetViewport', () => {
		LowCodeDesignerPanel.post('resetViewport');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.undo', () => {
		LowCodeDesignerPanel.post('undo');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.redo', () => {
		LowCodeDesignerPanel.post('redo');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.save', () => {
		LowCodeDesignerPanel.post('save');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.share', () => {
		LowCodeDesignerPanel.post('share');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.publish', () => {
		LowCodeDesignerPanel.post('publish');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.insertComponent', (snippetId: string) => {
		LowCodeDesignerPanel.show(context.extensionUri);
		LowCodeDesignerPanel.post('insertComponent', { snippetId });
	}));

	context.subscriptions.push(vscode.commands.registerCommand('wigglycode.lowcode.initializeProject', async () => {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			vscode.window.showWarningMessage(vscode.l10n.t('Open a workspace folder before initializing a WigglyCode project.'));
			return;
		}

		const lowcodeDir = vscode.Uri.joinPath(workspaceFolder.uri, '.lowcode');
		const pagesDir = vscode.Uri.joinPath(lowcodeDir, 'pages');
		const projectFile = vscode.Uri.joinPath(lowcodeDir, 'project.json');

		await vscode.workspace.fs.createDirectory(pagesDir);
		await vscode.workspace.fs.writeFile(projectFile, new TextEncoder().encode(JSON.stringify({
			name: workspaceFolder.name,
			version: '0.0.1',
			pages: []
		}, null, 2)));

		projectProvider.refresh();
		vscode.window.showInformationMessage(vscode.l10n.t('WigglyCode project initialized.'));
	}));
}
