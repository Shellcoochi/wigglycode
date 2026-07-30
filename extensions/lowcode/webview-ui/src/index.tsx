import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from './components/ui/sonner';
import Designer from './components/web-designer/designer';
import './styles.css';

declare const acquireVsCodeApi: undefined | (() => { postMessage(message: unknown): void });

const rootElement = document.getElementById('root');
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

if (rootElement) {
	createRoot(rootElement).render(
		<React.StrictMode>
			<Designer vscode={vscode} />
			<Toaster position="bottom-right" richColors />
		</React.StrictMode>
	);

	vscode?.postMessage({ command: 'ready' });
}
