<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<nav class="bg-gray-100">
		<div class="container mx-auto px-2">
			<div class="relative flex h-16 items-center justify-between">
				<div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-between">
					<div class="flex flex-shrink-0 items-center">
						<a href="/"> Parallel Requests Maker</a>
					</div>
				</div>
			</div>
		</div>
	</nav>
	<div class="w-full flex-grow">
		{@render children()}
	</div>
	<footer>
		<div class="text-center">
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
