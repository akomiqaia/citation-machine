<script>
  async function handleUpload() {
    window.svelteEvents.tokenisePDF();
  }
</script>

<button on:click={handleUpload}>Upload</button>
