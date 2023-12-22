<script>
  import Upload from "./ui-components/Upload.svelte";

  let query = "";
  let response;
  async function handleQuery() {
    window.svelteEvents.getSimilarSentences(query);
    window.svelteEvents.similarSearch((d) => (response = d));
  }
</script>

<div class="wrapper">
  <div>
    <Upload />
  </div>

  <input type="text" placeholder="Type your query" bind:value={query} />
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
