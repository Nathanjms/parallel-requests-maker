<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col bg-gray-100">
	<div class="w-full flex-grow">
		{@render children()}
	</div>
	<footer>
		<div class="text-center bg-gray-50">
			<small
				>Website Created by
				<a
					class="link"
					href="https://github.co.uk/nathanjms"
					target="_blank"
					rel="noopener noreferrer">NathanJms</a
				></small
			>
		</div>
	</footer>
</div>
