<script lang="ts">
	import { CurlGenerator } from 'curl-generator';
	import { onMount } from 'svelte';
	// define type for the requests:

	const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

	let commonHeaderKeys = $state<string[]>(['Accept', 'Content-Type']);

	let commonHeaderValues = $state<string[]>([
		'application/json',
		'application/x-www-form-urlencoded',
		'multipart/form-data',
		'text/plain',
		'text/html',
		'application/xml'
	]);
	interface Header {
		key: string;
		value: string;
	}
	interface RequestInterface {
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		url: string;
		headers: Header[];
		body: any;
	}

	const baseFormFields: RequestInterface = {
		method: 'GET',
		url: '',
		headers: [{ key: '', value: '' }],
		body: ''
	};

	let requests = $state<RequestInterface[]>([]);
	let formFields = $state<RequestInterface>(baseFormFields);
	let showParallelCurls = $state<boolean>(false);

	onMount(() => {
		requests = JSON.parse(window.localStorage.getItem('requests') || '[]');
	});

	const canSubmit = $derived(formFields.method && formFields.url);

	const curls = $derived<string[]>(
		requests.map((request) => {
			let headerMap: Record<string, string> = {};
			request.headers.forEach((header) => {
				headerMap[header.key] = header.value;
			});
			return CurlGenerator(
				{
					method: request.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
					url: request.url,
					headers: headerMap,
					body: request.body
				},
				{
					silent: true
				}
			);
		})
	);

	const parallelCurls = $derived<string>(curls.join(' & \n') + '\nwait' + '\necho "Done!"');

	function addRequest(e: Event) {
		e.preventDefault();
		console.log({ ...formFields });

		requests.push({ ...formFields });

		formFields = { ...baseFormFields };

		window.localStorage.setItem('requests', JSON.stringify(requests));
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(parallelCurls);
	}
</script>

<div class="container mx-auto my-2 px-2">
	<div class="text-center">
		<h1 class="text-3xl">Parallel Requests Builder</h1>
		<p>Builds a series of <i>curl</i> commands in a script, so that they can be ran in parallel.</p>
		<p>Runs entirely in your browser, so nothing is sent to a server.</p>
		<p>
			Github: <a class="link" href="https://github.com/NathanJms/parallel-requests-maker"
				>https://github.com/NathanJms/parallel-requests-maker</a
			>
		</p>
	</div>
	<div class="rounded-lg bg-gray-200 p-2">
		<h2 class="text-xl font-bold">Build Requests</h2>
		<form onsubmit={addRequest}>
			<div class="mb-1">
				<label for="method" class="block text-sm font-medium text-gray-900">Method</label>
				<select
					bind:value={formFields.method}
					required
					id="method"
					name="method"
					class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
				>
					{#each HTTP_METHODS as method}
						<option value={method}>{method}</option>
					{/each}
				</select>
			</div>

			<div class="mb-1">
				<label for="url" class="block text-sm font-medium text-gray-900">URL</label>
				<input
					bind:value={formFields.url}
					required
					type="text"
					id="url"
					name="url"
					class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
				/>
			</div>

			<div class="mb-1">
				<label for="headers" class="block text-sm font-medium text-gray-900">Headers</label>
				{#each formFields.headers as header, index}
					<div class="mb-1 flex gap-2">
						<input
							bind:value={header.key}
							type="text"
							list="headerKeyList"
							id={`headers-key-${index}`}
							placeholder="Key"
							name="headers"
							class="w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
						/>
						<input
							bind:value={header.value}
							type="text"
							list="headerValueList"
							id={`headers-value-${index}`}
							placeholder="Value"
							name="headers"
							class="w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
						/>
						{#if formFields.headers.length > 1}
							<button
								type="button"
								class="inline-block rounded border text-sm focus:outline-none focus:ring"
								onclick={() => formFields.headers.splice(index, 1)}
								aria-label="Remove"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="size-6"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
				<button
					type="button"
					class="mt-1 inline-block rounded border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
					onclick={() => formFields.headers.push({ key: '', value: '' })}>Add Header</button
				>
			</div>

			<div class="mb-1">
				<label for="body" class="block text-sm font-medium text-gray-900">Body</label>
				<textarea
					bind:value={formFields.body}
					class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
					id="body"
					rows="3"
				></textarea>
			</div>

			<div class="flex justify-between">
				<button
					disabled={!canSubmit}
					class="inline-block rounded border border-gray-600 px-2 py-1 text-sm focus:outline-none focus:ring disabled:opacity-50"
					type="submit">Add Request & Clear</button
				>
				<button
					disabled={!canSubmit}
					class="inline-block rounded border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring disabled:opacity-50"
					type="submit">Add Request</button
				>
			</div>
		</form>
	</div>

	<div class="mt-4 rounded-lg bg-gray-200 p-2">
		<h2 class="text-xl font-bold">Script</h2>
		<div>
			{#if requests.length === 0}
				No Requests added yet, add at least 1 (or two to, you know, make this worthwhile) first.
			{:else}
				<button
					class="inline-block rounded border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
					onclick={copyToClipboard}>Copy to Clipboard</button
				>
				{#if showParallelCurls}
					<textarea class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
						>{parallelCurls}</textarea
					>
				{/if}
			{/if}
		</div>
	</div>

	<div class="mt-4 rounded-lg bg-gray-200 p-2">
		<h2 class="text-xl font-bold">Requests</h2>
		<div>
			{#if requests.length === 0}
				No Requests added yet
			{/if}
			{#each requests as request}
				<div class="my-2 rounded-lg bg-gray-300 p-2">
					<h3 class="font-bold">{request.url}</h3>
					<h4>{request.method}</h4>
					{#if request.body}
						<pre class="text-xs">{request.body.substring(0, 100) + '...'}</pre>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-4 rounded-lg bg-gray-200 p-2">
		<h2 class="text-xl font-bold">CURLs</h2>
		<div class="grid grid-cols-2 gap-2">
			{#if requests.length === 0}
				No Requests added yet
			{/if}
			{#each curls as curl}
				<div class="my-2 rounded-lg bg-gray-300 p-2">
					<pre class="text-xs">{curl}</pre>
				</div>
			{/each}
		</div>
	</div>

	<datalist id="headerKeyList">
		{#each commonHeaderKeys as header}
			<option>{header}</option>
		{/each}
	</datalist>
	<datalist id="headerValueList">
		{#each commonHeaderValues as header}
			<option>{header}</option>
		{/each}
	</datalist>
</div>
