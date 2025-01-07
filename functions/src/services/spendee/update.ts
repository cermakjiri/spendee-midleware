import { logger } from 'firebase-functions';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { config } from '../../config';
import { UserWithWallet } from '../../types';
import { db } from './config/firebase';
import { CollectionId, Transaction } from './types';

export async function updateTransactionsCategory({ uid, walletId }: UserWithWallet, transactions: Transaction[]) {
    const batchSize = 50;
    let batchCount = 1;
    const totalBatchCount = Math.ceil(transactions.length / batchSize);

    logger.log(
        `Updating transactions: UP to ${batchSize} items at once in ${totalBatchCount} batch/es. TOTAL items to update:`,
        transactions.length,
    );

    logger.log('Updating transactions:', transactions);

    while (transactions.length > 0) {
        const batch = writeBatch(db);

        const batchPayload = transactions.splice(0, batchSize);

        batchPayload.forEach(transaction => {
            const transactionRef = doc(
                db,
                CollectionId.Users,
                uid,
                CollectionId.Wallets,
                walletId,
                CollectionId.Transactions,
                transaction.path.transaction,
            );

            const { category, modelVersion, note, path, type } = transaction;

            batch.update(transactionRef, {
                category,
                modelVersion,
                note,
                path,
                type,
                updatedAt: serverTimestamp(),
            });
        });

        logger.log(`(${batchCount / totalBatchCount}): Updating ${batchPayload.length} items...`, batchPayload);

        if (!config.dryRun) {
            await batch.commit();
        }

        logger.log(`(${batchCount / totalBatchCount}): ${batchPayload.length} items updated.`);

        batchCount++;
    }

    logger.log('All items updated.');
}
