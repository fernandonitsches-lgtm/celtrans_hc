module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co';
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    
    if (!supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'SUPABASE_SECRET_KEY não configurada'
      });
    }
    
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };
    
    // Test connection
    if (req.method === 'POST' && req.body?.action === 'test') {
      const response = await fetch(`${supabaseUrl}/rest/v1/pessoas?select=id`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      const data = await response.json();
      return res.status(200).json({ 
        success: true, 
        message: 'Conexão bem-sucedida',
        count: data.length
      });
    }
    
    // Get all people
    if (req.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/pessoas`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      const data = await response.json();
      return res.status(200).json({ 
        success: true, 
        people: data || []
      });
    }
    
    // Insert new person
    if (req.method === 'POST' && req.body?.action === 'insert') {
      const response = await fetch(`${supabaseUrl}/rest/v1/pessoas`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(req.body.data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      const data = await response.json();
      return res.status(200).json({ 
        success: true, 
        data: data[0]
      });
    }
    
    return res.status(405).json({ success: false, message: 'Method not allowed' });
    
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: error.message
    });
  }
};
