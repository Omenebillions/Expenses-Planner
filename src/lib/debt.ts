export interface RecurringPaymentInstance {
  id: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid';
}

export interface PersonalDebtData {
  repaymentDate?: string;
  isRecurring?: boolean;
  frequency?: string;
  duration?: string;
  recurringAmount?: number;
  status?: 'paid' | 'unpaid';
  note?: string;
  payments?: RecurringPaymentInstance[];
}

export function generateRecurringPayments(
  startDateStr: string,
  frequency: string,
  durationText: string,
  amount: number,
  title?: string
): RecurringPaymentInstance[] {
  const instances: RecurringPaymentInstance[] = [];
  const start = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(start.getTime())) return [];

  let count = 3;
  const numMatch = durationText ? durationText.match(/\d+/) : null;
  if (numMatch) {
    count = parseInt(numMatch[0], 10);
  } else if (durationText && durationText.toLowerCase().includes('year')) {
    count = 1;
  } else if (durationText && durationText.toLowerCase().includes('week')) {
    count = 4;
  }

  count = Math.max(1, Math.min(60, count));

  for (let i = 0; i < count; i++) {
    const dueDate = new Date(start);
    if (frequency === 'weekly') {
      dueDate.setDate(start.getDate() + i * 7);
    } else if (frequency === 'yearly') {
      dueDate.setFullYear(start.getFullYear() + i);
    } else {
      dueDate.setMonth(start.getMonth() + i);
    }

    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    instances.push({
      id: `pay_${i}_${dateStr}_${Math.floor(Math.random() * 1000)}`,
      dueDate: dateStr,
      amount: amount,
      status: 'unpaid'
    });
  }

  // Native WebView registration call
  if (typeof window !== 'undefined' && (window as any).YouFI?.isNativeSupported && (window as any).YouFI?.registerPersonalDebtInstances) {
    try {
      (window as any).YouFI.registerPersonalDebtInstances(instances, title || 'Personal Debt Repayment');
      console.log('[Native Bridge]: Personal debt instances registered successfully:', title || 'Personal Debt Repayment');
    } catch (err) {
      console.error('[Native Bridge] Error in registerPersonalDebtInstances:', err);
    }
  }

  return instances;
}

export function parsePersonalDebt(tx: any): PersonalDebtData {
  if (!tx || tx.type !== 'debt') {
    return { status: 'unpaid', note: tx?.note || tx?.description || '' };
  }
  
  const rawText = tx.note || tx.description || '';
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        repaymentDate: parsed.repaymentDate || tx.date || '',
        isRecurring: parsed.isRecurring || false,
        frequency: parsed.frequency || '',
        duration: parsed.duration || '',
        recurringAmount: parsed.recurringAmount || 0,
        status: parsed.status || 'unpaid',
        note: parsed.note || '',
        payments: parsed.payments || []
      };
    } catch (e) {
      // ignore
    }
  }
  
  return {
    repaymentDate: tx.date || '',
    isRecurring: false,
    frequency: '',
    duration: '',
    recurringAmount: 0,
    status: 'unpaid',
    note: rawText,
    payments: []
  };
}

export function serializePersonalDebt(data: PersonalDebtData): string {
  return JSON.stringify({
    repaymentDate: data.repaymentDate || '',
    isRecurring: data.isRecurring || false,
    frequency: data.frequency || '',
    duration: data.duration || '',
    recurringAmount: data.recurringAmount || 0,
    status: data.status || 'unpaid',
    note: data.note || '',
    payments: data.payments || []
  });
}
