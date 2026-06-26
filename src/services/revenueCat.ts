const API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

export interface Offering {
  identifier: string;
  description: string;
  packages: Array<{
    identifier: string;
    product: {
      identifier: string;
      price: number;
      priceString: string;
      title: string;
    };
  }>;
}

export interface CustomerInfo {
  entitlements: {
    active: Record<string, { identifier: string; expiresDate: string | null }>;
  };
  latestPurchaseDate: string | null;
}

class RevenueCatService {
  private apiKey: string;
  private appUserId: string | null = null;

  constructor() {
    this.apiKey = API_KEY;
  }

  setAppUserId(uid: string) {
    this.appUserId = uid;
  }

  async getOfferings(): Promise<Offering[]> {
    if (!this.apiKey) {
      console.warn("[RevenueCat] API Key missing. Falling back to Mock Offerings.");
      return [
        {
          identifier: "premium_plans",
          description: "Premium plans for advanced tracking & insights",
          packages: [
            {
              identifier: "monthly",
              product: {
                identifier: "premium_monthly",
                price: 4.99,
                priceString: "$4.99",
                title: "Monthly Pass"
              }
            },
            {
              identifier: "yearly",
              product: {
                identifier: "premium_yearly",
                price: 39.99,
                priceString: "$39.99",
                title: "Yearly Pass"
              }
            },
            {
              identifier: "business",
              product: {
                identifier: "premium_business",
                price: 99.99,
                priceString: "$99.99",
                title: "Business Pass"
              }
            }
          ]
        }
      ];
    }

    try {
      const url = `https://api.revenuecat.com/v1/subscribers/${this.appUserId || 'anonymous'}/offerings`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'web',
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("HTTP error " + response.status);
      const data = await response.json();
      return data.offerings || [];
    } catch (err) {
      console.error("[RevenueCat] failed to fetch offerings:", err);
      return [
        {
          identifier: "premium_plans",
          description: "Premium plans for advanced tracking & insights",
          packages: [
            {
              identifier: "monthly",
              product: {
                identifier: "premium_monthly",
                price: 4.99,
                priceString: "$4.99",
                title: "Monthly Pass"
              }
            },
            {
              identifier: "yearly",
              product: {
                identifier: "premium_yearly",
                price: 39.99,
                priceString: "$39.99",
                title: "Yearly Pass"
              }
            },
            {
              identifier: "business",
              product: {
                identifier: "premium_business",
                price: 99.99,
                priceString: "$99.99",
                title: "Business Pass"
              }
            }
          ]
        }
      ];
    }
  }

  async purchaseProduct(productIdentifier: string): Promise<boolean> {
    console.log(`[RevenueCat] Initiating purchase for: ${productIdentifier}...`);
    
    if (!this.apiKey) {
      console.log("[RevenueCat] Mocking purchase on Web Fallback...");
      localStorage.setItem('youfi_premium', 'true');
      return true;
    }

    try {
      const response = await fetch(`https://api.revenuecat.com/v1/receipts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'web',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_user_id: this.appUserId || 'anonymous',
          fetch_token: `mock_token_${Date.now()}`
        })
      });
      
      if (response.ok) {
        localStorage.setItem('youfi_premium', 'true');
        return true;
      }
      return false;
    } catch (err) {
      console.error("[RevenueCat] Purchase failed:", err);
      return false;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.apiKey) {
      const isSubscribed = localStorage.getItem('youfi_premium') === 'true';
      return {
        entitlements: {
          active: isSubscribed ? { pro: { identifier: 'pro', expiresDate: null } } : {}
        },
        latestPurchaseDate: isSubscribed ? new Date().toISOString() : null
      };
    }

    try {
      const url = `https://api.revenuecat.com/v1/subscribers/${this.appUserId || 'anonymous'}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Platform': 'web'
        }
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      return data.subscriber || null;
    } catch (err) {
      console.error("[RevenueCat] Error getting customer info:", err);
      const isSubscribed = localStorage.getItem('youfi_premium') === 'true';
      return {
        entitlements: {
          active: isSubscribed ? { pro: { identifier: 'pro', expiresDate: null } } : {}
        },
        latestPurchaseDate: isSubscribed ? new Date().toISOString() : null
      };
    }
  }

  async checkProEntitlement(): Promise<boolean> {
    const info = await this.getCustomerInfo();
    if (!info) return false;
    return !!(info.entitlements?.active && (info.entitlements.active.pro || info.entitlements.active.premium));
  }
}

export const revenueCat = new RevenueCatService();
