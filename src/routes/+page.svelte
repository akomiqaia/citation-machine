<script lang="ts">
	// import { invoke } from '@tauri-apps/api/tauri';
	import { appWindow } from '@tauri-apps/api/window'
	import { open } from '@tauri-apps/api/dialog';
	// import { Command } from '@tauri-apps/api/shell';
	// alternatively, use `window.__TAURI__.shell.Command`
	// `binaries/my-sidecar` is the EXACT value specified on `tauri.conf.json > tauri > bundle > externalBin`
	// we need to cut posteriors otherwise it will be hard
	let query = 'default query';
	let response: { score: String; text: string }[] = [];
	async function handleQuery() {}
  let textDetails = ''
	let error = 'no error';
	appWindow.listen('message', (message) => {
		textDetails = textDetails + JSON.stringify(message);
	});
  
	async function handleUpload() {
    try {
		const files = await open({
			multiple: true
		});
    let result = '';
			const fetchSentenceQuery = await fetch(`http://localhost:8135/tokenise-sentence?q=this is a normal sentence`);
			result = await fetchSentenceQuery.json();
      error = result.toString();
      response.push({
        score: '54',
        text: result.result
      });
      response = [...response];
    } catch (e) {
      textDetails =  textDetails + JSON.stringify(e);
    }
	}
</script>

<div class="wrapper">
	<div>
		<label for="many">Upload multiple files of any type:</label>
		<button on:click={handleUpload}>Upload</button>
	</div>

	<textarea placeholder="Type your query" bind:value={query} />
	<button on:click={handleQuery}>Find</button>
</div>
{error}
{#if response}
	<div>
		{#each response as { score, text }}
			<div>
				<p>{text}</p>
				<p>{score}</p>
			</div>
		{/each}
	</div>
{/if}

{textDetails}

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		height: 50vh;
	}
</style>
