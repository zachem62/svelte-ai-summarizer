//  Contract for Summarization API input
// Used by both frontend and backend to ensure structural consistency of the input
export interface SummarizeRequest {
    // The raw text input to be summarized
    text: string;
}