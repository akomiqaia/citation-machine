import {preprocessMeltUI} from "@melt-ui/pp";
import sequence from "svelte-sequential-preprocessor";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'


const config = {
  // ... other svelte config options
  preprocess: sequence([
    // ... other preprocessors
    vitePreprocess(),
    preprocessMeltUI() // add to the end!
  ])
}

export default config