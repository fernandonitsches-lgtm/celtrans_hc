module.exports = async function handler(req, res) {
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
    const supabaseKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseKey) {
      throw new Error('SUPABASE_SECRET_KEY não configurada')
    }

    // Testa conexão
    if (req.method === 'POST' && req.body?.action === 'test') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/pessoas?select=count(*)`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao conectar: ${response.statusText}`)
      }

      const data = await response.json()
      
      return res.status(200).json({ 
        success: true, 
        message: 'Conexão bem-sucedida',
        count: data.length
      })
    }
    
    // Carrega todas as pessoas
    if (req.method === 'GET') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/pessoas`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao carregar: ${response.statusText}`)
      }

      const data = await response.json()
      
      return res.status(200).json({ 
        success: true, 
        people: data || []
      })
    }
    
    // Insere nova pessoa
    if (req.method === 'POST' && req.body?.action === 'insert') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/pessoas`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(req.body.data)
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao inserir: ${response.statusText}`)
      }

      const data = await response.json()
      
      return res.status(200).json({ 
        success: true, 
        data: data[0]
      })
    }

    // Atualiza pessoa
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body
      const response = await fetch(
        `${supabaseUrl}/rest/v1/pessoas?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao atualizar: ${response.statusText}`)
      }

      const data = await response.json()
      
      return res.status(200).json({ 
        success: true, 
        data: data[0]
      })
    }

    // Deleta pessoa
    if (req.method === 'DELETE') {
      const { id } = req.body
      const response = await fetch(
        `${supabaseUrl}/rest/v1/pessoas?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao deletar: ${response.statusText}`)
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Pessoa deletada'
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
