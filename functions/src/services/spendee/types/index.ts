interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

export interface Category {
    name: string;
    color: string;
    updatedAt: Timestamp;
    state: 'active'; // Assuming state is always "active" as per given data
    image: string;
    modelVersion: number;
    type: 'income' | 'expense';
    path: {
        user: string;
        category: string;
    };
}

export enum CollectionId {
    Users = 'users',
    Categories = 'categories',
    Labels = 'labels',
    Budgets = 'budgets',
    Transactions = 'transactions',
    TransactionTemplates = 'transactionTemplates',
    Wallets = 'wallets',
}

export interface UsdValue {
    amount: string;
    exchangeRate: string;
}

export interface Transaction {
    madeAtTimezoneOffset: number;
    author: string;
    modelVersion: number;
    isPending: boolean;
    madeAt: Timestamp;
    madeAtTimezone: string;
    amount: string;
    usdValue: UsdValue;
    updatedAt: Timestamp;
    note: string;
    category: string | null; // Since one of the transactions has category as null
    type: 'regular' | 'transfer';
    path: {
        transaction: string;
        user: string;
        wallet: string;
    };
}

interface Subscription {
    renewalPeriod: 'year';
    productId: string;
    type: 'premium';
    pastType: 'plus';
    introOfferUsedOn: any[];
    platform: 'ios';
    expirationDate: null;
    isNftOwner: null;
    renewalDate: Timestamp;
}

interface Referral {
    referredUsersCount: number;
    code: string;
    isRegisteredViaReferral: boolean;
}

interface HomeFeed {
    lastDisplayedCard: string;
}

interface Profile {
    gender: 'male';
    firstname: string;
    email: string;
    lastname: string;
    birthDate: string;
    photo: string;
}

interface Device {
    languageCode: string;
    countryCode: string;
}

export interface User {
    updatedAt: Timestamp;
    subscription: Subscription;
    legacyId: number;
    referral: Referral;
    path: {
        user: string;
    };
    homeFeed: HomeFeed;
    profile: Profile;
    registeredAt: Timestamp;
    modelVersion: number;
    device: Device;
    visibleWallets: string[];
    globalCurrency: string;
    timezone: string;
    firestoreDataExportDone: boolean;
}
