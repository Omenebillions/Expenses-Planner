import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string; // 'YYYY-MM'
}

export interface IncomeAllocation {
  category: string;
  name?: string;
  amount: number;
}

export interface Income {
  id: string;
  user_id: string;
  category: 'Salary' | 'Side Business' | 'Gift' | 'Other';
  sourceName: string;
  amount: number; // Expected/Planned Amount
  actualAmount: number; // Actual Received Amount
  period: string; // 'YYYY-MM'
  isFollowed: boolean;
  allocationPlan: IncomeAllocation[];
  notes?: string;
  createdAt?: string;
}

// Memory fallback to ensure smooth user experience if there are Firebase configuration delays
const getLocalStorageFallback = <T>(key: string): T[] => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch (e) {
    return [];
  }
};

const setLocalStorageFallback = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

// Timeout wrapper for Firestore operations to prevent endless loading screen hangs
const WITH_TIMEOUT_MS = 2500;

async function withTimeout<T>(promise: Promise<T>, timeoutValue: T): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Firestore operation timed out after ${WITH_TIMEOUT_MS}ms. Falling back immediately.`);
      resolve(timeoutValue);
    }, WITH_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const firestoreService = {
  // --- BUDGETS ---
  async getBudgets(userId: string, period: string): Promise<Budget[]> {
    try {
      const q = query(
        collection(db, 'budgets'),
        where('user_id', '==', userId),
        where('period', '==', period)
      );
      const querySnapshot = await withTimeout(getDocs(q), null);
      const results: Budget[] = [];
      if (querySnapshot) {
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as Budget);
        });
      }
      
      // Merge with localStorage so user data is never lost and always preserved
      const local = getLocalStorageFallback<Budget>('fallback_budgets').filter(
        b => b.user_id === userId && b.period === period
      );
      const merged = [...results];
      local.forEach(lb => {
        if (!merged.find(m => m.id === lb.id)) {
          merged.push(lb);
        }
      });
      return merged;
    } catch (e) {
      console.warn('Firestore getBudgets error, using localStorage fallback:', e);
      return getLocalStorageFallback<Budget>('fallback_budgets').filter(
        b => b.user_id === userId && b.period === period
      );
    }
  },

  async saveBudget(budget: Omit<Budget, 'id'> & { id?: string }): Promise<Budget> {
    const id = budget.id || 'b_' + Math.random().toString(36).substr(2, 9);
    const finalBudget = { ...budget, id };
    
    // Save to localStorage as a robust safety fallback
    const local = getLocalStorageFallback<Budget>('fallback_budgets');
    const existingIndex = local.findIndex(b => b.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = finalBudget;
    } else {
      local.push(finalBudget);
    }
    setLocalStorageFallback('fallback_budgets', local);

    try {
      await withTimeout(setDoc(doc(db, 'budgets', id), finalBudget, { merge: true }), null);
    } catch (e) {
      console.warn('Firestore saveBudget error, saved locally:', e);
    }
    return finalBudget;
  },

  async deleteBudget(id: string): Promise<void> {
    // Local
    const local = getLocalStorageFallback<Budget>('fallback_budgets');
    setLocalStorageFallback('fallback_budgets', local.filter(b => b.id !== id));

    try {
      await withTimeout(deleteDoc(doc(db, 'budgets', id)), null);
    } catch (e) {
      console.warn('Firestore deleteBudget error:', e);
    }
  },

  // --- INCOMES ---
  async getIncomes(userId: string, period: string): Promise<Income[]> {
    try {
      const q = query(
        collection(db, 'incomes'),
        where('user_id', '==', userId),
        where('period', '==', period)
      );
      const querySnapshot = await withTimeout(getDocs(q), null);
      const results: Income[] = [];
      if (querySnapshot) {
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as Income);
        });
      }

      // Local fallback sync
      const local = getLocalStorageFallback<Income>('fallback_incomes').filter(
        i => i.user_id === userId && i.period === period
      );
      const merged = [...results];
      local.forEach(li => {
        if (!merged.find(m => m.id === li.id)) {
          merged.push(li);
        }
      });
      return merged;
    } catch (e) {
      console.warn('Firestore getIncomes error, using localStorage fallback:', e);
      return getLocalStorageFallback<Income>('fallback_incomes').filter(
        i => i.user_id === userId && i.period === period
      );
    }
  },

  async saveIncome(income: Omit<Income, 'id'> & { id?: string }): Promise<Income> {
    const id = income.id || 'i_' + Math.random().toString(36).substr(2, 9);
    const finalIncome = { ...income, id };

    // Safety fallback
    const local = getLocalStorageFallback<Income>('fallback_incomes');
    const existingIndex = local.findIndex(i => i.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = finalIncome;
    } else {
      local.push(finalIncome);
    }
    setLocalStorageFallback('fallback_incomes', local);

    try {
      await withTimeout(setDoc(doc(db, 'incomes', id), finalIncome, { merge: true }), null);
    } catch (e) {
      console.warn('Firestore saveIncome error, saved locally:', e);
    }
    return finalIncome;
  },

  async deleteIncome(id: string): Promise<void> {
    const local = getLocalStorageFallback<Income>('fallback_incomes');
    setLocalStorageFallback('fallback_incomes', local.filter(i => i.id !== id));

    try {
      await withTimeout(deleteDoc(doc(db, 'incomes', id)), null);
    } catch (e) {
      console.warn('Firestore deleteIncome error:', e);
    }
  },

  async updateIncomeFollowed(id: string, isFollowed: boolean): Promise<void> {
    const local = getLocalStorageFallback<Income>('fallback_incomes');
    const item = local.find(i => i.id === id);
    if (item) {
      item.isFollowed = isFollowed;
      setLocalStorageFallback('fallback_incomes', local);
    }

    try {
      await withTimeout(updateDoc(doc(db, 'incomes', id), { isFollowed }), null);
    } catch (e) {
      console.warn('Firestore updateIncomeFollowed error:', e);
    }
  }
};
