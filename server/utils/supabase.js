require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const localPgAdapter = require('./localPgAdapter');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let useLocalPg = process.env.USE_LOCAL_DB === 'true';
let realSupabase = null;

if (!useLocalPg && supabaseUrl && supabaseServiceRoleKey) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    useLocalPg = true;
  }
} else {
  useLocalPg = true;
}

function createFallbackProxyWithQuery(realQuery, localQuery, table) {
  return new Proxy(realQuery, {
    get(target, prop) {
      if (prop === 'then') {
        return function (resolve, reject) {
          target
            .then(async (result) => {
              if (
                result &&
                result.error &&
                (result.error.message?.includes('fetch failed') ||
                  result.error.details?.includes('ENOTFOUND') ||
                  result.error.message?.includes('ENOTFOUND'))
              ) {
                console.log(`[Supabase Fallback] Connection error on '${table}'. Executing query on local PostgreSQL...`);
                const localResult = await localQuery.execute();
                return localResult;
              }
              return result;
            })
            .catch(async (err) => {
              console.log(`[Supabase Fallback] Error on '${table}': ${err.message}. Executing query on local PostgreSQL...`);
              const localResult = await localQuery.execute();
              return localResult;
            })
            .then(resolve, reject);
        };
      }

      if (typeof target[prop] === 'function') {
        return function (...args) {
          if (typeof localQuery[prop] === 'function') {
            localQuery[prop](...args);
          }
          const res = target[prop].apply(target, args);
          if (res && typeof res === 'object') {
            return createFallbackProxyWithQuery(res, localQuery, table);
          }
          return res;
        };
      }
      return target[prop];
    }
  });
}

function createFallbackProxy(table) {
  const localQuery = localPgAdapter.from(table);

  if (useLocalPg) {
    return localQuery;
  }

  const realQuery = realSupabase.from(table);
  return createFallbackProxyWithQuery(realQuery, localQuery, table);
}

const supabaseWrapper = {
  from(table) {
    return createFallbackProxy(table);
  },
  storage: realSupabase ? realSupabase.storage : null
};

module.exports = supabaseWrapper;