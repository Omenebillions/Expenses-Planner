import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholders or missing
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project-url');
const isValidKey = supabaseAnonKey && supabaseAnonKey !== 'your-anon-key' && supabaseAnonKey.length > 50;

export const isSupabaseConfigured = !!(isValidUrl && isValidKey);

class MockChannel {
  on(event: string, filter: any, callback: any) {
    return this;
  }
  subscribe() {
    return this;
  }
}

class MockSupabaseClient {
  auth = {
    getSession: async () => {
      const mockUser = {
        id: 'local-mock-user-id',
        email: 'localuser@example.com',
        user_metadata: { full_name: 'Local User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: { session: { user: mockUser, access_token: 'mock-token' } }, error: null };
    },
    getUser: async () => {
      const mockUser = {
        id: 'local-mock-user-id',
        email: 'localuser@example.com',
        user_metadata: { full_name: 'Local User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: { user: mockUser }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const mockUser = {
        id: 'local-mock-user-id',
        email: 'localuser@example.com',
        user_metadata: { full_name: 'Local User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // Trigger callback with session after light timeout to mimic real life
      const timer = setTimeout(() => {
        try {
          callback('INITIAL_SESSION', { user: mockUser, access_token: 'mock-token' });
        } catch (e) {}
      }, 50);
      return { data: { subscription: { unsubscribe: () => clearTimeout(timer) } } };
    },
    signInWithOAuth: async () => {
      console.warn("OAuth simulated in offline mode");
      return { data: {}, error: null };
    },
    signUp: async (options: any) => {
      const mockUser = {
        id: 'local-mock-user-id',
        email: options.email,
        user_metadata: { full_name: options.options?.data?.full_name || 'Local User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: { user: mockUser, session: { user: mockUser, access_token: 'mock-token' } }, error: null };
    },
    signInWithPassword: async (options: any) => {
      const mockUser = {
        id: 'local-mock-user-id',
        email: options.email,
        user_metadata: { full_name: 'Local User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: { user: mockUser, session: { user: mockUser, access_token: 'mock-token' } }, error: null };
    },
    signOut: async () => {
      return { error: null };
    },
    resetPasswordForEmail: async () => {
      return { error: null };
    }
  };

  from(table: string) {
    let isSingle = false;
    let isAITokens = false;
    const builder: any = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      eq: (col: string, val: any) => {
        if (col === 'category' && val === '__AI_TOKENS__') {
          isAITokens = true;
        }
        return builder;
      },
      neq: () => builder,
      gt: () => builder,
      lt: () => builder,
      gte: () => builder,
      lte: () => builder,
      like: () => builder,
      ilike: () => builder,
      is: () => builder,
      in: () => builder,
      contains: () => builder,
      containedBy: () => builder,
      range: () => builder,
      textSearch: () => builder,
      match: () => builder,
      not: () => builder,
      or: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => { isSingle = true; return builder; },
      maybeSingle: () => { isSingle = true; return builder; },
      upsert: () => builder,
      csv: () => builder,
      returns: () => builder,
    };
    
    // Support Thenable promise interface
    builder.then = (onfulfilled?: any) => {
      let resultData: any = null;
      if (isSingle) {
        if (isAITokens) {
          resultData = { id: 'mock-ai-tokens-id', category: '__AI_TOKENS__', amount: 5, period: 'all-time', user_id: 'local-mock-user-id' };
        } else {
          resultData = null;
        }
      } else {
        resultData = [];
      }
      return Promise.resolve({ data: resultData, error: null }).then(onfulfilled);
    };

    builder.catch = (onrejected?: any) => {
      let resultData: any = null;
      if (isSingle) {
        if (isAITokens) {
          resultData = { id: 'mock-ai-tokens-id', category: '__AI_TOKENS__', amount: 5, period: 'all-time', user_id: 'local-mock-user-id' };
        } else {
          resultData = null;
        }
      } else {
        resultData = [];
      }
      return Promise.resolve({ data: resultData, error: null }).catch(onrejected);
    };
    
    return builder;
  }

  channel(name: string) {
    return new MockChannel();
  }

  removeChannel(channel: any) {}
}

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Running in offline/fallback mock mode safely.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (new MockSupabaseClient() as any);
