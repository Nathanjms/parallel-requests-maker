<script lang="ts">
	let { requests, setRequestsFromRestore } = $props();

	console.log(requests);

	let backup = $state({
		isLoading: false,
		error: undefined as string | undefined
	});

	let restore = $state({
		isLoading: false,
		error: undefined as string | undefined
	});

	const backupStatusText = $derived.by<string>(() =>
		statusText('Backup', backup.isLoading, backup.error)
	);

	const restoreStatusTexts = $derived.by<string>(() =>
		statusText('Restore', restore.isLoading, restore.error)
	);

	function statusText(defaultText: string, isLoading: boolean, error?: string) {
		if (isLoading) {
			return 'Loading...';
		}

		if (error) {
			return 'Error';
		}

		return defaultText;
	}

	function handleBackup() {
		backup.isLoading = true;
		try {
			const blob = new Blob([JSON.stringify({ requests })], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'requests.json';
			a.click();

			URL.revokeObjectURL(url);
		} catch (error) {
			backup.error = 'An Error Occurred!';
		} finally {
			backup.isLoading = false;
		}
	}

	function handleRestoreClicked() {
		document.getElementById('restore-file')!.click();
	}

	async function handleRestore(e: Event) {
		restore.isLoading = true;
		restore.error = undefined;

		try {
			const target = e.target as HTMLInputElement;
			const file = target.files![0];
			if (!file || (file.type !== 'application/json' && file.type !== 'text/plain')) {
				throw new Error('Invalid File Type');
			}

			const json = await parseJSONFile(file);

			requests = json.requests;

			setRequestsFromRestore(requests);
		} catch (error) {
			restore.error = 'An Error Occurred!';
		} finally {
			restore.isLoading = false;
		}
	}

	async function parseJSONFile(file: File): Promise<any> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (event) => {
				try {
					const json = JSON.parse(event.target!.result as string);
					resolve(json);
				} catch (error) {
					reject(error);
				}
			};

			reader.onerror = () => {
				reject(new Error('Error reading the file'));
			};

			reader.readAsText(file);
		});
	}
</script>

<h3 class="text-lg">Backup/Restore</h3>
<div>
	<p>Click below to backup/restore your config so it can be re-uploaded to this site later.</p>
	<div class="flex gap-2">
		<button
			class="inline-block flex-1 rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
			onclick={handleBackup}>{backupStatusText}</button
		>
		<button
			class="inline-block flex-1 rounded-2xl border border-gray-600 bg-gray-600 px-2 py-1 text-sm text-white focus:outline-none focus:ring"
			onclick={handleRestoreClicked}>{restoreStatusTexts}</button
		>
	</div>
	<input type="file" accept=".json" class="hidden" id="restore-file" onchange={handleRestore} />
</div>
