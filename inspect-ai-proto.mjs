import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

const result = streamText({
  model: google('gemini-1.5-flash'),
  prompt: 'hello'
});

console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
