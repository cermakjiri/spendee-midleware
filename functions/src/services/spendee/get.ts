import {
    collection,
    collectionGroup,
    getDocs,
    limit,
    orderBy,
    query,
    QueryConstraint,
    where,
} from 'firebase/firestore';

import { db } from './config/firebase';
import { Category, CollectionId, Transaction } from './types';

export async function fetchCategories(meUid: string) {
    const categories = (await getDocs(collection(db, CollectionId.Users, meUid, CollectionId.Categories))).docs.map(
        doc => doc.data(),
    ) as Category[];

    const byId = categories.reduce((acc, category) => {
        acc.set(category.path.category, category);

        return acc;
    }, new Map<Category['path']['category'], Category>());

    return byId;
}

const isReqularTransaction = (t: Transaction) => t.type === 'regular';

export async function fetchTransactions(meUid: string, count?: number) {
    const constraints: QueryConstraint[] = [where('path.user', '==', meUid), orderBy('__name__', 'asc')];

    if (Number.isInteger(count)) {
        constraints.push(limit(count!));
    }

    const transactionsQuery = query(collectionGroup(db, CollectionId.Transactions), ...constraints);

    const transactions = (await getDocs(transactionsQuery)).docs.map(doc => doc.data()) as Transaction[];

    return transactions.filter(isReqularTransaction);
}

export async function fetchTransactionsWithoutCategory(meUid: string): Promise<Transaction[]> {
    const transactionsQuery = query(
        collectionGroup(db, CollectionId.Transactions),
        where('path.user', '==', meUid),
        where('category', '==', null),
        orderBy('__name__', 'asc'),
    );

    const transactions = (await getDocs(transactionsQuery)).docs.map(doc => doc.data()) as Transaction[];

    return transactions;
}
