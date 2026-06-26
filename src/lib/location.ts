export interface ExtractedLocation {
  countryCode: string;
  countryName: string;
  city?: string;
  currency: string;
}

export async function detectLocationAndCurrency(): Promise<ExtractedLocation> {
  // Try IP API with a fast 2.5s timeout so it never blocks the app
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.currency) {
        return {
          countryCode: data.country_code || 'US',
          countryName: data.country_name || 'United States',
          city: data.city || '',
          currency: data.currency || 'USD'
        };
      }
    }
  } catch (error) {
    console.warn('Geo IP API fetch failed, falling back to browser locale:', error);
  }

  // Backup fallback using browser language and timezone
  const locale = navigator.language || 'en-US';
  let timeZone = '';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    console.warn('Browser environment does not support detailed timezone resolution, falling back gracefully:', e);
  }
  
  let currency = 'USD';
  let countryCode = 'US';
  let countryName = 'United States';

  // Map common prefixes of timezone
  if (timeZone.includes('London') || timeZone.includes('Europe/London')) {
    currency = 'GBP';
    countryCode = 'GB';
    countryName = 'United Kingdom';
  } else if (timeZone.startsWith('Europe/')) {
    currency = 'EUR';
    countryCode = 'EU';
    countryName = 'Europe';
  } else if (timeZone.startsWith('Asia/Tokyo')) {
    currency = 'JPY';
    countryCode = 'JP';
    countryName = 'Japan';
  } else if (timeZone.startsWith('Australia/')) {
    currency = 'AUD';
    countryCode = 'AU';
    countryName = 'Australia';
  } else if (timeZone.startsWith('America/Toronto') || timeZone.startsWith('America/Vancouver') || timeZone.startsWith('Canada/')) {
    currency = 'CAD';
    countryCode = 'CA';
    countryName = 'Canada';
  } else if (timeZone.startsWith('Africa/Lagos') || timeZone.startsWith('Africa/Abidjan') || timeZone.includes('Lagos')) {
    currency = 'NGN';
    countryCode = 'NG';
    countryName = 'Nigeria';
  } else if (timeZone.startsWith('Asia/Calcutta') || timeZone.startsWith('Asia/Kolkata') || timeZone.includes('Kolkata') || timeZone.includes('Calcutta')) {
    currency = 'INR';
    countryCode = 'IN';
    countryName = 'India';
  } else {
    // Map with navigation locale
    const lowerLocale = locale.toLowerCase();
    if (lowerLocale.endsWith('gb') || lowerLocale.startsWith('en-gb')) {
      currency = 'GBP'; countryCode = 'GB'; countryName = 'United Kingdom';
    } else if (lowerLocale.includes('de') || lowerLocale.includes('fr') || lowerLocale.includes('it') || lowerLocale.includes('es')) {
      currency = 'EUR'; countryCode = 'EU'; countryName = 'Europe';
    } else if (lowerLocale.endsWith('ng') || lowerLocale.startsWith('en-ng')) {
      currency = 'NGN'; countryCode = 'NG'; countryName = 'Nigeria';
    } else if (lowerLocale.endsWith('in') || lowerLocale.startsWith('en-in')) {
      currency = 'INR'; countryCode = 'IN'; countryName = 'India';
    } else if (lowerLocale.endsWith('ca') || lowerLocale.startsWith('en-ca')) {
      currency = 'CAD'; countryCode = 'CA'; countryName = 'Canada';
    } else if (lowerLocale.endsWith('au') || lowerLocale.startsWith('en-au')) {
      currency = 'AUD'; countryCode = 'AU'; countryName = 'Australia';
    }
  }

  return { countryCode, countryName, currency };
}
