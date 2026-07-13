import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

async function main() {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: 'hello'
    });
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}
main();
