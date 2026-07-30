/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import path from 'path';
import fs from 'fs/promises';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { run } from '../esbuild-webview-common.mts';

const srcDir = path.join(import.meta.dirname, 'webview-ui', 'src');
const outDir = path.join(import.meta.dirname, 'media');

const tailwindPlugin = {
	name: 'lowcode-tailwind',
	setup(build: any) {
		build.onLoad({ filter: /\.css$/ }, async (args: { path: string }) => {
			const source = await fs.readFile(args.path, 'utf8');
			const result = await postcss([tailwindcss()]).process(source, {
				from: args.path,
				to: path.join(outDir, path.basename(args.path))
			});

			return {
				contents: result.css,
				loader: 'css'
			};
		});
	}
};

run({
	entryPoints: [
		path.join(srcDir, 'index.tsx'),
		path.join(srcDir, 'components-view.tsx')
	],
	srcDir,
	outdir: outDir,
	additionalOptions: {
		jsx: 'automatic',
		alias: {
			'@': srcDir
		},
		plugins: [
			tailwindPlugin
		],
		loader: {
			'.tsx': 'tsx',
			'.ts': 'ts',
			'.css': 'css'
		}
	}
}, process.argv);
