<script lang="ts">
	import { open } from '@tauri-apps/api/dialog';
	// import { fetch as rustFetch } from '@tauri-apps/api/http';
	import {  appLocalDataDir } from '@tauri-apps/api/path';

	import Tree from '$lib/tree/Index.svelte';
	import Separator from '$lib/separator/Separator.svelte';
	import Progress from '$lib/progress/Progress.svelte';
  let message = "empty message"

	type responseDetails = { page: number; sentence: string; similarity: number };
	let query =
		'The accuracy of each posterior is measured using the predictive KL divergence metrics. Their mean values ove';
	let response: responseDetails[] = [];
	let totalPages = 0;
	let currentPage = 0;
	async function handleQuery() {
		try {
			const appLocalDataDirPath = await appLocalDataDir();
			const fetchSentenceQuery = await fetch(
				`http://localhost:8135/find-similar-sentences?q=${query}&data_dir=${appLocalDataDirPath}`
			);
			const res = await fetchSentenceQuery.json();
			console.log(`🚀 ~ res:`, res);
			const result = (res as { similar_sentences: responseDetails[] }).similar_sentences;
			response = result;
		} catch (e) {
			console.log(`🚀 ~ e:`, e);
		}
	}

	async function handleUpload() {
		// measure execution time
		const files = (await open({
			multiple: true
		})) as string[];
		const dataDirPath = await appLocalDataDir();
		query = dataDirPath;
		files &&
			(await Promise.all(
				files.map(async (filePath) => {
          message = "started"
					const fileName = filePath.split('/').pop();
					const streamRes = await fetch(
						`http://localhost:8135/tokenise-text?pdf_path=${filePath}&data_dir=${dataDirPath}&name=${fileName}`
					);
					const stream = await streamRes.body;
					const reader = stream?.getReader();
					const text = new TextDecoder('utf-8');
					while (true) {
						const { done, value } = (await reader?.read()) as ReadableStreamReadResult<Uint8Array>;
						if (done) {
							break;
						}
						const streamResponse = JSON.parse(text.decode(value));
						const { status } = streamResponse;

						if (status === 'starting') {
							console.log(`🚀 ~ result:`, JSON.parse(text.decode(value)));
							totalPages = streamResponse.number_of_pages;
              message = streamResponse.number_of_pages

						} else if (status === 'progress') {
							console.log(`🚀 ~ result:`, JSON.parse(text.decode(value)));
							currentPage = streamResponse.current_page;
              message = streamResponse.current_page
						}
					}
				})
			));
	}

	const treeItems = [
		{ title: 'index.svelte', icon: 'file' },
		{ title: 'index.svelte', icon: 'file' },
		{ title: 'index.svelte', icon: 'file' }
	];

	// add 20 more items to the tree
	for (let i = 0; i < 20; i++) {
		treeItems.push({ title: `index.svelte ${i}`, icon: 'file' });
	}


  async function handleTestRequests() {
    const streamTestRes = await fetch(
      `http://localhost:8135/test-streaming-video`
    );
    const stream = await streamTestRes.body;
    const reader = stream?.getReader();
    const text = new TextDecoder('utf-8');
    while (true) {
      const { done, value } = (await reader?.read()) as ReadableStreamReadResult<Uint8Array>;
      if (done) {
        break;
      }
      console.log(text.decode(value))
      message = text.decode(value);
    }
    
  }
</script>

{message}
<div class="flex h-[90vh]">
	<div class="ml-[10px] flex flex-col justify-between">
		<Tree {treeItems} />
		<button class="rounded bg-magnum-500 px-4 py-2 font-bold" on:click={handleUpload}
			>Add source</button
		>
	</div>
	<Separator orientation="vertical" />
	<div class="mr-[10px] w-full">
		<div class="flex justify-evenly px-4 py-2">
			<textarea
				class="rouned w-[80%] border-2 border-magnum-300 bg-magnum-50 pt-4"
				placeholder="Find your cite"
				bind:value={query}
			/>
			<button class="rounded bg-magnum-300 px-6 py-2" on:click={handleQuery}>Find</button>
		</div>
		<div>
			{#if response.length > 0}
				<div>
					<h2>We found following similarities:</h2>
					{#each response as { page, sentence, similarity }, i}
						<div class="content mb-[10px]">
							<div class="flex">
								<span class="inline-block bg-magnum-200 px-5 py-4">{similarity}</span>
								<p class="px-5 py-4">{sentence}</p>
							</div>
							<div>
								<p class="">This was found on {page}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<h2>Results will be shown here:</h2>
        <button on:click={handleTestRequests}>Test requests</button>
			{/if}
		</div>
		<div>
			<p>{currentPage} out of {totalPages} processed</p>
			<Progress currentValue={currentPage} maxValue={totalPages} />
		</div>
	</div>
</div>

<style>
	.content {
		border-bottom: 2px solid theme('colors.magnum.300');
	}
</style>
