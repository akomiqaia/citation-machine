<script lang="ts">
	import { createTreeView } from '@melt-ui/svelte';
	import { setContext } from 'svelte';

	import type { TreeItem } from './Tree.svelte';
	import Tree from './Tree.svelte';

	export let treeItems: TreeItem[];

	const ctx = createTreeView({
		defaultExpanded: ['lib-0', 'tree-0']
	});
	setContext('tree', ctx);

	const {
		elements: { tree }
	} = ctx;
</script>

<div
	class="flex h-[100%] w-[18.75rem] flex-col rounded-xl bg-white text-neutral-900"
>
	<div class="flex flex-col gap-1 px-4 pt-4">
		<h3 class="text-lg font-bold">Sources</h3>
		<hr />
	</div>

	<ul class="overflow-auto px-4 pb-4 pt-2" {...$tree}>
		<Tree {treeItems} />
	</ul>
</div>
