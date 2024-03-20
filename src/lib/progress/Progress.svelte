<script lang="ts">
	export let currentValue: number = 0;
  export let maxValue: number = 100;
</script>

<div class="relative h-6 w-[300px] overflow-hidden rounded-[99999px] bg-magnum-100">
	<div
		class="h-full w-full bg-magnum-400 transition-transform duration-[660ms]
        ease-[cubic-bezier(0.65,0,0.35,1)]"
		style={`transform: translateX(-${100 - (currentValue / maxValue) * 100}%)`}
	/>
</div>
