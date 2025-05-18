import type { RequestHandler } from '@sveltejs/kit';
import OpenAI from 'openai';
import type { SummarizeRequest } from '$lib/types';

if (!process.env.OPENAI_API_KEY) {
	throw new Error('Missing OpenAI API key');
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse raw JSON without trusting its shape yet
		const raw = await request.json();

		// Validate the structure and content of input before assigning type (type is what 
		// ensures consistency between frontend and backend for input)
		if (!raw.text || typeof raw.text !== 'string' || raw.text.trim().length === 0) {
			return new Response(JSON.stringify({ error: 'Invalid input' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Safe to trust the shape of the input JSON now
		const requestBody: SummarizeRequest = {
			text: raw.text
		};

		const prompt = `Summarize the following text into a cohesive markdown-formatted blog post:\n\n${ requestBody.text }`;

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 1500
		});

		const content = response.choices[0]?.message?.content;
		const markdown = content ? content.trim() : '';

		if (!markdown) {
			return new Response(JSON.stringify({ error: 'No content received from OpenAI.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({ markdown }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('OpenAI API Error:', error);

		const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';

		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
