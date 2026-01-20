const SUPABASE_URL = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
};

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
});

const handleError = (res, statusCode, message) => {
  console.error('API Error:', message);
  return res.status(statusCode).json({ success: false, message });
};

const fetchSupabase = async (endpoint, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    headers: getHeaders(),
    ...options
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }
  
  return response.json();
};

const handleTest = async (res) => {
  try {
    const data = await fetchSupabase('/pessoas?select=id');
    return res.status(200).json({ 
      success: true, 
      message: 'Conexão bem-sucedida',
      count: data.length
    });
  } catch (error) {
    throw error;
  }
};

const handleGet = async (res) => {
  try {
    const data = await fetchSupabase('/pessoas');
    return res.status(200).json({ 
      success: true, 
      people: data || []
    });
  } catch (error) {
    throw error;
  }
};

const handleInsert = async (res, body) => {
  try {
    const data = await fetchSupabase('/pessoas', {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body.data)
    });
    
    return res.status(200).json({ 
      success: true, 
      data: data[0]
    });
  } catch (error) {
    throw error;
  }
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!SUPABASE_KEY) {
    return handleError(res, 500, 'SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  
  try {
    switch (true) {
      case req.method === 'POST' && req.body?.action === 'test':
        return await handleTest(res);
      
      case req.method === 'GET':
        return await handleGet(res);
      
      case req.method === 'POST' && req.body?.action === 'insert':
        return await handleInsert(res, req.body);
      
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    return handleError(res, 500, error.message);
  }
};
