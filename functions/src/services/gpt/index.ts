import { logger } from 'firebase-functions';
import OpenAI from 'openai';

let openai: OpenAI;

const createPrompt = (
    categories: string[],
    expenseNotes: string[],
) => `Pro každý výdaj vyber nejvhodnější kategorii z poskytnutých kategorií:
Výdaje: "${expenseNotes.join(', ')}"
Kategorie: "${categories.join(', ')}"

Výstup: 
- Pouze jednotlivé kategorie odělenné čárkou, odpovídajících výdajům v pořadí v jakém jsou výdaje zadány
- Pokuď výdaj nemá odpovídající kategorii, dosaď null na odpovídající místo`;

export async function categorizeExpenses(categories: string[], expenseNotes: string[]) {
    if (!openai) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            dangerouslyAllowBrowser: true,
        });
    }

    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: createPrompt(categories, expenseNotes) }],
        model: 'gpt-4',
    });

    const result = chatCompletion.choices[0].message.content;

    logger.log('categorizeExpenses', result);

    const parsedResult = result ? result.split(',').map(s => s.trim()) : [];

    logger.log('categorizeExpenses', { expenseNotes, parsedResult });

    if (parsedResult.length !== expenseNotes.length) {
        logger.error('Parsed result length does not match the number of expenses');
    }

    return parsedResult;
}
