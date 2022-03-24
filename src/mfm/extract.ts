import { MfmNode } from './prelude';
import { inspect } from './inspect';

// taken from mfm-js v0.21.0, which is licensed under the MIT License
// Copyright (c) 2020-2022 Marihachi and other contributors

export function extract(nodes: MfmNode[], predicate: (node: MfmNode) => boolean): MfmNode[] {
	const dest = [] as MfmNode[];

	inspect(nodes, (node) => {
		if (predicate(node)) {
			dest.push(node);
		}
	});

	return dest;
}
