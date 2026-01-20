import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const supabaseUrl = 'https://fgolrboqzvqqhyklsxsm.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Testa conexão
    if (req.method === 'POST' && req.body?.action === 'test') {
      const { count, error } = await supabase
        .from('pessoas')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
      return res.status(200).json({ 
        success: true, 
        message: 'Conexão bem-sucedida',
        count: count
      })
    }
    
    // Carrega todas as pessoas
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
      
      if (error) throw error
      
      return res.status(200).json({ 
        success: true, 
        people: data || []
      })
    }
    
    // Insere nova pessoa
    if (req.method === 'POST' && req.body?.action === 'insert') {
      const { data, error } = await supabase
        .from('pessoas')
        .insert([req.body.data])
        .select()
      
      if (error) throw error
      
      return res.status(200).json({ 
        success: true, 
        data: data[0]
      })
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' })

  } catch (error) {
    console.error('Erro:', error.message)
    return res.status(500).json({ 
      success: false, 
      message: error.message
    })
  }
}
