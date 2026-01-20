// Testar conexão
const testConnection = async () => {
  const res = await fetch('/api/pessoas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'test' })
  })
  const data = await res.json()
  console.log(data.success ? '✓ Conectado' : '✗ Erro')
}

// Carregar pessoas
const loadPeople = async () => {
  const res = await fetch('/api/pessoas')
  const data = await res.json()
  console.log(data.people)
}
