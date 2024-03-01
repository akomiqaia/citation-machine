<script>
  import Upload from "./ui-components/Upload.svelte";
  // we need to cut posteriors otherwise it will be hard
  let query = "";
  let response;
  async function handleQuery() {
    const res = await fetch("http://localhost:8000/tokenise-sentence?q=" + query, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json()
    window.svelteEvents.getSimilarSentences(data.result);
    window.svelteEvents.similarSearch((d) => (response = d));
  }
</script>

<div class="wrapper">
  <div>
    <Upload />
  </div>

  <textarea type="text" placeholder="Type your query" bind:value={query} />
  <button on:click={handleQuery}>Find</button>
</div>
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

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 50vh;
  }
</style>
