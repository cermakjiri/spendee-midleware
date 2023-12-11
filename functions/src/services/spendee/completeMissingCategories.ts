import { logger } from 'firebase-functions';
import Levenshtein from 'levenshtein';

import { categorizeExpenses } from '../gpt';
import type { Me } from './auth';
import { Category, Transaction } from './types';
import { updateTransactionsCategory } from './update';

/**
 * Note example: `"Částka: 688 CZK 26.11.2023Místo: allegro.czPoznan"`
 * We want to extract the `Místo` part and compare only that
 */
function parseNote(note: string) {
    const [amountWithDate, placeWithDescription] = note.split('Místo:').map(s => s.trim());

    return placeWithDescription ?? amountWithDate;
}

type TransactionCategory = NonNullable<Transaction['category']>;
type TransactionsWithSameCategoryCount = number;
type CategoryIndex = Record<TransactionCategory, TransactionsWithSameCategoryCount>;

function getMostPopularCategory(categories: CategoryIndex) {
    const categoryEntries = Object.entries(categories);
    const mostPopularCategory = {
        id: categoryEntries[0][0],
        count: categoryEntries[0][1],
    };

    for (const [categoryId, transactionsCount] of categoryEntries) {
        if (transactionsCount > mostPopularCategory.count) {
            mostPopularCategory.id = categoryId;
            mostPopularCategory.count = transactionsCount;
        }
    }

    return mostPopularCategory.id;
}

export interface CompleteMissingCategoriesProps {
    transactionsWithCategory: Transaction[];
    transactionsWithoutCategory: Transaction[];
    categoriesById: Map<Category['path']['category'], Category>;
}

export async function completeMissingCategoriesBasedOnSimilarTransactions(
    me: Me,
    { transactionsWithCategory, transactionsWithoutCategory, categoriesById }: CompleteMissingCategoriesProps,
): Promise<Transaction[]> {
    const byNoteInitial = new Map<Transaction['note'], CategoryIndex>();

    // Index all transactions with category by note as:
    //  - each note can have multiple categories
    //  - each category can have multiple matching transactions (storing their IDs)
    const byNote = transactionsWithCategory.reduce((acc, t) => {
        const parsedNote = parseNote(t.note);

        const existingEntry = acc.get(parsedNote) ?? {};
        const category = t.category!;
        const transactionsOfCategory = existingEntry[category] ?? 0;

        acc.set(parsedNote, {
            ...existingEntry,
            [category]: transactionsOfCategory + 1,
        });

        return acc;
    }, byNoteInitial);

    logger.log('index created:', Object.fromEntries(byNote.entries()));

    // Try to find a category for each transaction without a category based on note similarity
    const transactions = transactionsWithoutCategory.map(t => {
        const parsedNote = parseNote(t.note);

        // Exact note match
        if (byNote.has(parsedNote)) {
            const categories = byNote.get(parsedNote)!;

            logger.log('exact note match, selecting most popular category from:', { categories });
            const categoryId = getMostPopularCategory(categories);
            const categoryName = categoriesById.get(categoryId)?.name ?? null;

            logger.log('selected category:', { parsedNote, categoryId, categoryName });

            return {
                ...t,
                category: categoryId,
            };
        }

        // Good enough similarity match, using Levenshtein distance
        const levenshteinSearchResults = Array.from(byNote.entries())
            .map(([note, categories]) => [new Levenshtein(parsedNote, note).distance, note, categories] as const)
            .sort(([distanceA], [distanceB]) => distanceA - distanceB)
            // Take only results with at least 90% of similarity
            .filter(([distance]) => distance <= 10);

        if (levenshteinSearchResults.length > 0) {
            const categories = levenshteinSearchResults[0]![2];
            const categoryId = getMostPopularCategory(categories);
            const categoryName = categoriesById.get(categoryId)?.name ?? null;

            logger.log('good enough note match, selecting most popular category from:', { categories });
            logger.log('selected category:', { parsedNote, categoryId, categoryName });

            return {
                ...t,
                category: categoryId,
            };
        }

        // Else, leave it on Chat GPT to figure it out
        return {
            ...t,
            category: null,
        };
    });

    // Save the updated transactions with categories to the database
    const transactionsWithCategories = transactions.filter(t => t.category !== null);
    logger.log('transactionsWithCategories:', { transactionsWithCategories });
    await updateTransactionsCategory(me, transactionsWithCategories);

    return transactions.filter(t => t.category === null);
}

export interface CompleteMissingCategoriesWithGptProps {
    categoriesById: Map<Category['path']['category'], Category>;
    transactionsWithoutCategory: Transaction[];
}

export async function completeMissingCategoriesWithGpt(
    me: Me,
    { transactionsWithoutCategory, categoriesById }: CompleteMissingCategoriesWithGptProps,
) {
    const categories = Array.from(categoriesById.entries()).map(([id, category]) => [id, category.name]);
    const categoryIdsByName = Object.fromEntries(categories.map(([id, name]) => [name, id]));
    const categoryNames = categories.map(([, name]) => name);

    const completedCategoryNames = await categorizeExpenses(
        categoryNames,
        transactionsWithoutCategory.map(t => t.note),
    );

    const completedCategoryIds = completedCategoryNames.map(categoryName =>
        categoryName === 'null' ? null : categoryIdsByName[categoryName],
    );

    const transactions = transactionsWithoutCategory.map((t, i) => ({
        ...t,
        category: completedCategoryIds[i],
    }));

    const transactionsWithCategories = transactions.filter(t => t.category !== null);

    await updateTransactionsCategory(me, transactionsWithCategories);

    return transactions.filter(t => t.category === null);
}
