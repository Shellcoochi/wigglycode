import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentPanel from './components/web-designer/sidebar-panel/component-panel';
import materials from './components/web-designer/material';
import './styles.css';

declare const acquireVsCodeApi: undefined | (() => { postMessage(message: unknown): void });

const rootElement = document.getElementById('root');
const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
const nativeDragMimeType = 'application/vnd.wigglycode.snippet';

if (rootElement) {
	createRoot(rootElement).render(
		<React.StrictMode>
			<DndProvider backend={HTML5Backend}>
				<ComponentPanel
					templates={materials.categories}
					nativeDragMimeType={nativeDragMimeType}
					onInsert={(template) => {
						vscode?.postMessage({
							command: 'insertComponent',
							snippetId: template.id
						});
					}}
				/>
			</DndProvider>
		</React.StrictMode>
	);
}
