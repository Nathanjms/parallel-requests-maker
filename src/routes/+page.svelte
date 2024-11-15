<script lang="ts">
	import type { RequestInterface } from '$lib/interfaces';
	import TheSettings from '$lib/TheSettings.svelte';
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

	const baseFormFields: RequestInterface = {
		id: 0,
		method: 'GET',
		url: '',
		headers: [{ key: '', value: '' }],
		body: ''
	};

	let requests = $state<RequestInterface[]>([]);
	let formFields = $state<RequestInterface>(baseFormFields);
	let showParallelCurls = $state<boolean>(false);
	let clipboardStatusText = $state<string>('Copy to Clipboard');
	let currentId = $state<number>(new Date().getTime());
	let editingId = $state<number>();

	let curlOptions = $state({
		suppressOutput: true
	});

	onMount(() => {
		requests = JSON.parse(window.localStorage.getItem('requests') || '[]');
	});

	const canSubmit = $derived(formFields.method && formFields.url);

	const curls = $derived<string[]>(
		requests.map((request) => {
			let headerMap: Record<string, string> = {};
			request.headers.forEach((header) => {
				if (!header.key || !header.value) return;
				headerMap[header.key] = header.value;
			});
			return CurlGenerator(
				{
					method: request.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
					url: request.url,
					headers: headerMap,
					body: request.body.replace(/"/g, '\\"'), // The library always uses double quotes, so escape all in the body here
				},
				{
					silent: true,
					...(curlOptions.suppressOutput ? { output: '/dev/null' } : {})
				}
			);
		})
	);

	const parallelCurls = $derived<string>(curls.join(' & \n') + '\nwait' + '\necho "Done"');

	function setEditRequest(id: number) {
		let existingRequest = requests.find((request) => request.id === id);
		if (!existingRequest) {
			return;
		}
		formFields = JSON.parse(JSON.stringify(existingRequest)) as RequestInterface;
		editingId = id;
	}

	function submitRequest(clearForm: boolean) {
		if (!editingId) {
			requests.push({ ...formFields, id: ++currentId });
		} else {
			// FInd the record and alter it;
			requests = requests.map((request) => {
				if (request.id === editingId) {
					return { ...formFields, id: request.id };
				}
				return request;
			});
		}
		window.localStorage.setItem('requests', JSON.stringify(requests));
		if (clearForm) {
			formFields = { ...baseFormFields };
			editingId = undefined;
		}
		editingId = undefined;
	}

	function handleRemoveRequest(id: number) {
		if (confirm('Are you sure you want to remove this request?')) {
			requests = requests.filter((request) => request.id !== id);
		}
	}

	function clearForm() {
		formFields = JSON.parse(JSON.stringify(baseFormFields)) as RequestInterface;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(parallelCurls);

		clipboardStatusText = 'Copied!';
		setTimeout(() => {
			clipboardStatusText = 'Copy to Clipboard';
		}, 2000);
	}

	function resetRequests() {
		if (confirm('Are you sure you want to clear all requests?')) {
			requests = [];
			window.localStorage.removeItem('requests');
		}
	}

	function setRequestsFromRestore(newRequests: RequestInterface[]) {
		requests = JSON.parse(JSON.stringify(newRequests));

		window.localStorage.setItem('requests', JSON.stringify(requests));
	}
</script>

<div class="container mx-auto my-2 px-2">
	<div class="mb-6 text-center">
		<h1 class="text-3xl">Parallel Requests Builder</h1>
		<p>Builds a series of <i>curl</i> commands in a script, so that they can be ran in parallel.</p>
		<p>Runs entirely in your browser, so nothing is sent to a server.</p>
		<p class="text-xs">
			Github: <a class="link" href="https://github.com/NathanJms/parallel-requests-maker"
				>https://github.com/NathanJms/parallel-requests-maker</a
			>
		</p>
	</div>
	<div class="rounded-2xl bg-gray-200 p-4">
		<h2 class="mb-3 text-xl font-bold">Build Request</h2>
		<div class="mb-1">
			<label for="method" class="block text-sm font-medium text-gray-900">Method</label>
			<select
				bind:value={formFields.method}
				required
				id="method"
				name="method"
				class="mt-1.5 w-full rounded-2xl border-gray-300 text-gray-700 sm:text-sm"
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
				class="mt-1.5 w-full rounded-2xl border-gray-300 text-gray-700 sm:text-sm"
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
						class="w-full rounded-2xl border-gray-300 text-gray-700 sm:text-sm"
					/>
					<input
						bind:value={header.value}
						type="text"
						list="headerValueList"
						id={`headers-value-${index}`}
						placeholder="Value"
						name="headers"
						class="w-full rounded-2xl border-gray-300 text-gray-700 sm:text-sm"
					/>
					{#if formFields.headers.length > 1}
						<button
							type="button"
							class="inline-block rounded-2xl border text-sm focus:outline-none focus:ring"
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
				class="mt-1 inline-block rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
				onclick={() => formFields.headers.push({ key: '', value: '' })}>Add Header</button
			>
		</div>

		<div class="mb-1">
			<label for="body" class="block text-sm font-medium text-gray-900">Body</label>
			<textarea
				bind:value={formFields.body}
				class="mt-1.5 w-full rounded-2xl border-gray-300 text-gray-700 sm:text-sm"
				id="body"
				rows="3"
			></textarea>
		</div>

		<div class="flex justify-between">
			<div>
				<button
					class="inline-block rounded-2xl border border-gray-600 px-2 py-1 text-sm focus:outline-none focus:ring disabled:opacity-50"
					onclick={clearForm}>Clear</button
				>
			</div>
			<div>
				<button
					disabled={!canSubmit}
					class="inline-block rounded-2xl border border-gray-600 px-2 py-1 text-sm focus:outline-none focus:ring disabled:opacity-50"
					onclick={() => submitRequest(true)}
					>{editingId ? 'Update & Clear' : 'Submit & Clear'}</button
				>
				<button
					disabled={!canSubmit}
					class="inline-block rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring disabled:opacity-50"
					onclick={() => submitRequest(false)}
				>
					{editingId ? 'Update' : 'Submit'}
				</button>
			</div>
		</div>
	</div>

	<div class="mt-4 rounded-2xl bg-gray-200 px-4 py-2">
		<div class="my-2 flex justify-between">
			<h2 class="text-xl font-bold">Requests/Curls</h2>
			<button
				class="inline-block h-fit rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
				onclick={resetRequests}>Clear All Requests</button
			>
		</div>
		<div class="mb-1">
			{#if requests.length === 0}
				No Requests added yet, add at least 1 (or two to, you know, make this worthwhile) first.
			{:else}
				<div class="my-1 rounded-2xl bg-slate-100 p-3 text-sm">
					<h3 class="text-lg">Options</h3>
					<div>
						<input type="checkbox" id="suppressOutput" bind:checked={curlOptions.suppressOutput} />
						<label for="suppressOutput">Suppress Output</label>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => (showParallelCurls = !showParallelCurls)}
						class="inline-block flex-1 rounded-2xl border border-gray-600 px-2 py-1 text-sm focus:outline-none focus:ring disabled:opacity-50"
						type="submit">Show Script Contents</button
					>
					<button
						class="inline-block flex-1 rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
						onclick={copyToClipboard}>{clipboardStatusText}</button
					>
				</div>
				{#if showParallelCurls}
					<pre class="my-2 rounded-xl bg-slate-100 p-3 text-xs">{parallelCurls}</pre>
				{/if}
			{/if}
		</div>
		<div>
			<h3 class="text-lg">Requests</h3>
			<div class="grid grid-cols-2 gap-2">
				{#each requests as request, index}
					<div class="my-2 divide-y rounded-2xl bg-gray-300 p-2">
						<div class="relative py-1">
							<div class="absolute right-1 top-1">
								<button class="" onclick={() => setEditRequest(request.id)} aria-label="Edit">
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
											d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
										/>
									</svg>
								</button>
								<button
									type="button"
									class="inline-block rounded-2xl text-sm focus:outline-none focus:ring"
									onclick={() => handleRemoveRequest(request.id)}
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
							</div>
							<h3 class="font-bold">{request.url}</h3>
							<h4 class="text-xs">{request.method}</h4>
							{#if request.body}
								<pre class="overflow-auto text-xs">{request.body.substring(0, 100) +
										(request.body.length > 100 ? '...' : '')}</pre>
							{/if}
						</div>
						<div class="py-1">
							<pre class="overflow-auto text-xs">{curls[index]}</pre>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-4 rounded-2xl bg-gray-200 px-4 py-2">
		<h2 class="mb-2 text-xl font-bold">Settings</h2>
		<TheSettings {requests} {setRequestsFromRestore} />
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
