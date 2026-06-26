import Dexie, { Table } from 'dexie';
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_OFFLINE_DB_SECRET || 'youfi-secret-key-default-39281';

export const encrypt = (text: string) => {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (cipher: string) => {
  if (!cipher) return cipher;
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data', error);
    return cipher;
  }
};

export interface LocalTransaction {
  id?: number;
  sync_id?: string;
  user_id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  description?: string;
  note?: string;
  synced: 0 | 1;
}

export interface LocalBudget {
  id?: number;
  sync_id?: string;
  user_id: string;
  category: string;
  budget_limit: number;
  month: string;
  synced: 0 | 1;
}

export class YouFiDB extends Dexie {
  transactions!: Table<LocalTransaction, number>;
  budgets!: Table<LocalBudget, number>;

  constructor() {
    super('YouFiDB');
    this.version(1).stores({
      transactions: '++id, sync_id, user_id, type, category, date, synced',
      budgets: '++id, sync_id, user_id, category, month, synced',
    });
  }
}

export const localDb = new YouFiDB();

/**
 * Encrypt a transaction before storing offline to protect sensitive info
 */
export const storeOfflineTransaction = async (tx: any) => {
  const encTx: LocalTransaction = {
    ...tx,
    sync_id: tx.id,
    amount: tx.amount, // Maybe encrypt amount as string if strongly required, but number is best for queries
    note: encrypt(tx.note || ''),
    description: encrypt(tx.description || ''),
    synced: 0
  };
  delete encTx.id;
  await localDb.transactions.add(encTx);
};

export const getOfflineTransactions = async () => {
  const encTxs = await localDb.transactions.toArray();
  return encTxs.map(tx => ({
    ...tx,
    id: tx.sync_id || `local-${tx.id}`,
    note: decrypt(tx.note || ''),
    description: decrypt(tx.description || '')
  }));
};
