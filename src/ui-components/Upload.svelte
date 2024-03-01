<script>


  let files;

  $: if (files) {
    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      fetch("https://nlp-backend-1.onrender.com/tokenise-text", {
        method: "POST",
        body: data,
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          window.svelteEvents.saveTokens(data)
        });
      console.log(`${file.name}: ${file.size} bytes`);
    }
  }
</script>

<label for="many">Upload multiple files of any type:</label>
<input bind:files id="many" multiple type="file" />

