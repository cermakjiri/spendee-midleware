import { logger } from 'firebase-functions';

import {
    completeMissingCategoriesBasedOnSimilarTransactions,
    completeMissingCategoriesWithGpt,
    fetchCategories,
    fetchTransactions,
    fetchTransactionsWithoutCategory,
    signInUser,
} from './services/spendee';

export async function completeMissingCategories() {
    const me = await signInUser();

    let transactionsWithoutCategory = await fetchTransactionsWithoutCategory(me.uid);

    if (transactionsWithoutCategory.length === 0) {
        logger.log('All transactions have set category.');
        return;
    }

    logger.log('transactionsWithoutCategory:', transactionsWithoutCategory);

    const [allTransactions, categoriesById] = await Promise.all([fetchTransactions(me.uid), fetchCategories(me.uid)]);

    logger.log('allTransactions and categoriesById:', { allTransactions, categoriesById });

    // try to fill-in missing categories based on transaction note from other transactions with the same note
    transactionsWithoutCategory = await completeMissingCategoriesBasedOnSimilarTransactions(me, {
        transactionsWithCategory: allTransactions.filter(t => t.category !== null),
        transactionsWithoutCategory,
        categoriesById,
    });

    if (transactionsWithoutCategory.length === 0) {
        logger.log('[transactions similarity]: All transactions without category have been completed.');
        return;
    }

    logger.log('Useing GPT API to detect correct category:', {
        count: transactionsWithoutCategory.length,
        transactions: transactionsWithoutCategory,
    });

    // else we need to categorize the remaining transactions with GPT API
    transactionsWithoutCategory = await completeMissingCategoriesWithGpt(me, {
        transactionsWithoutCategory,
        categoriesById,
    });

    if (transactionsWithoutCategory.length === 0) {
        logger.log('[GPT]: All transactions without category have been completed with the help of GPT.');
        return;
    }

    logger.log(
        `Some transactions couldn't been categorized:`,
        transactionsWithoutCategory.map(t => ({
            path: t.path,
            usdValue: t.usdValue,
            note: t.note,
            amount: t.amount,
        })),
    );
}
