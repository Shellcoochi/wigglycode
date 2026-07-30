/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export class LowCodeDesignerPanel {
	static readonly viewType = 'wigglycode.lowcode.designer';
	private static readonly panToolActiveContext = 'wigglycode.lowcode.panToolActive';
	private static currentPanel: vscode.WebviewPanel | undefined;
	private static isReady = false;
	private static readonly pendingMessages: Array<{ command: string; payload?: unknown }> = [];

	static post(command: string, payload?: unknown): void {
		const message = { command, payload };
		if (!LowCodeDesignerPanel.currentPanel || !LowCodeDesignerPanel.isReady) {
			LowCodeDesignerPanel.pendingMessages.push(message);
			return;
		}
		LowCodeDesignerPanel.currentPanel.webview.postMessage(message);
	}

	static show(extensionUri: vscode.Uri): void {
		if (LowCodeDesignerPanel.currentPanel) {
			LowCodeDesignerPanel.currentPanel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			LowCodeDesignerPanel.viewType,
			'WigglyCode Page Designer',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, 'media')
				]
			}
		);

		LowCodeDesignerPanel.currentPanel = panel;
		LowCodeDesignerPanel.isReady = false;
		panel.webview.html = this.getHtml(panel.webview, extensionUri);
		panel.webview.onDidReceiveMessage((message: { command?: string; payload?: { panActive?: boolean } }) => {
			if (message.command === 'ready') {
				LowCodeDesignerPanel.isReady = true;
				for (const pendingMessage of LowCodeDesignerPanel.pendingMessages.splice(0)) {
					panel.webview.postMessage(pendingMessage);
				}
			} else if (message.command === 'viewportState') {
				vscode.commands.executeCommand('setContext', LowCodeDesignerPanel.panToolActiveContext, !!message.payload?.panActive);
			}
		});
		panel.onDidDispose(() => {
			LowCodeDesignerPanel.currentPanel = undefined;
			LowCodeDesignerPanel.isReady = false;
			LowCodeDesignerPanel.pendingMessages.splice(0);
			vscode.commands.executeCommand('setContext', LowCodeDesignerPanel.panToolActiveContext, false);
		});
	}

	private static getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'index.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'index.css'));
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="${styleUri}" rel="stylesheet">
	<title>WigglyCode Page Designer</title>
</head>
<body>
	<div id="root"></div>
	<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
