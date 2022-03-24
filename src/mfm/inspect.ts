import { MfmNode } from './prelude';

// taken from mfm-js v0.21.0, which is licensed under the MIT License
// Copyright (c) 2020-2022 Marihachi and other contributors

export function inspect(node: MfmNode, action: (node: MfmNode) => void): void
export function inspect(nodes: MfmNode[], action: (node: MfmNode) => void): void
export function inspect(node: (MfmNode | MfmNode[]), action: (node: MfmNode) => void): void {
	if (Array.isArray(node)) {
		for (const n of node) {
			inspectOne(n, action);
		}
	}
	else {
		inspectOne(node, action);
	}
}

function inspectOne(node: MfmNode, action: (node: MfmNode) => void) {
	action(node);
	if (node.children != null) {
		for (const child of node.children) {
			inspectOne(child, action);
		}
	}
}
