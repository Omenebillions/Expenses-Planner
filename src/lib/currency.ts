export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
  { code: 'CHF', symbol: 'Fr', label: 'Swiss Franc (CHF)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (CNY)' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona (SEK)' },
  { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar (NZD)' },
  { code: 'MXN', symbol: '$', label: 'Mexican Peso (MXN)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar (HKD)' },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone (NOK)' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won (KRW)' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira (TRY)' },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble (RUB)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real (BRL)' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand (ZAR)' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (NGN)' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (AED)' },
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal (SAR)' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KES)' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GHS)' },
  { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound (EGP)' },
  { code: 'THB', symbol: '฿', label: 'Thai Baht (THB)' },
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah (IDR)' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (MYR)' },
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (PHP)' },
  { code: 'VND', symbol: '₫', label: 'Vietnamese Dong (VND)' },
  { code: 'ARS', symbol: '$', label: 'Argentine Peso (ARS)' },
  { code: 'COP', symbol: '$', label: 'Colombian Peso (COP)' },
  { code: 'CLP', symbol: '$', label: 'Chilean Peso (CLP)' },
  { code: 'PEN', symbol: 'S/', label: 'Peruvian Sol (PEN)' }
];

export const formatCurrency = (amount: number, currencyCode: string = 'USD', isPrivacyMode: boolean = false) => {
  if (isPrivacyMode) {
    return '••••';
  }
  return new Intl.NumberFormat(undefined, { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  }).format(amount);
};
