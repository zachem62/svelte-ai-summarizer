<script lang="ts">
	import axios from 'axios';
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { clsx } from 'clsx';
	import type { SummarizeRequest } from '$lib/types';

	let input = writable<string>('');
	let markdown = writable<string>('');
	let loading = writable<boolean>(false);
	let error = writable<string>('');
	
	const handleInputChange = (value: string) => {
		input.update((current) => {
			current = value;

			return current;
		});
	};

	const handleSubmit = async () => {
		// Trim input to remove leading/trailing spaces
		// Prevent empty or whitespace-only submissions
		const trimmed = $input.trim();

		if (trimmed.length === 0) {
			// Set a user-visible error message
			error.set("Please enter some text.");
			return;
		}
		
		// Construct request body based on shared input contract (SummarizeRequest)
		// Ensures structural consistency with backend expectations
		const requestBody: SummarizeRequest = {
			text: trimmed
		}
		loading.set(true);
		error.set('');
		markdown.set('');

		try {
			// Send the input to the backend summarization endpoint
			const response = await axios.post('/api/summarize', requestBody);

			// Save returned summary to reactive store for display
			markdown.set(response.data.markdown);

			// Clear any prior errors
			error.set('');
		} catch (err: any) {
			// Fallback for failed request (network or backend error)
			console.error('Submission Error:', err);
			
			error.set(err.response?.data?.error || 'An error occurred');
		} finally {
			loading.set(false);
		}
	};

	const downloadMarkdown = () => {
		const blob = new Blob([$markdown], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = 'blogpost.md';

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
</script>

<div class="max-w-3xl mx-auto p-4">
	<h2 class="text-2xl font-bold mb-4">Generate A Blog Post</h2>
	<p class="mb-4">Enter the text you want to summarize below.</p>
	<div class="mb-4">
		<textarea
			class="w-full p-2 border rounded-md"
			rows="16"
			bind:value={$input}
			on:input={(e) => handleInputChange(e.currentTarget.value)}
			placeholder="Enter your text here..."
		></textarea>
	</div>
	<div class="flex gap-4">
		<button
			on:click={handleSubmit}
			disabled={$loading || !$input}
			class={clsx(
				'bg-green-700 text-white px-4 py-2 rounded-md',
				!$input && 'cursor-not-allowed opacity-50'
			)}
		>
			{$loading ? 'Summarizing...' : 'Summarize'}
		</button>
		<button
			on:click={downloadMarkdown}
			disabled={!$markdown}
			class={clsx(
				'bg-blue-700 text-white px-4 py-2 rounded-md',
				!$markdown && 'cursor-not-allowed opacity-50'
			)}
		>
			Download Markdown
		</button>
	</div>
	{#if $error}
		<p class="text-red-500 mt-4">{$error}</p>
	{/if}
	<div class="mt-8">
		<div class="prose">
			{@html marked($markdown)}
		</div>
	</div>
</div>
