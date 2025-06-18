import { NextRequest, NextResponse } from 'next/server'

// Função para calcular distância entre dois pontos (fórmula de Haversine)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function POST(request: NextRequest) {
  try {
    const { endereco } = await request.json()
    
    const baseLat = -23.561684
    const baseLng = -46.655981
    const peso = 400 // gramas

    // Geocodificar usando Nominatim (OpenStreetMap) - gratuito e sem API key
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`,
      {
        headers: {
          'User-Agent': 'kikozeit-frete-calculator/1.0'
        }
      }
    )
    
    const geoData = await geoRes.json()
    
    if (!geoData.length) {
      return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 400 })
    }

    const destinoLat = parseFloat(geoData[0].lat)
    const destinoLng = parseFloat(geoData[0].lon)

    // Calcular distância em linha reta
    const distanciaKm = calcularDistancia(baseLat, baseLng, destinoLat, destinoLng)
    
    // Aplicar fator de correção para distância real (aproximadamente 1.3x da distância em linha reta)
    const distanciaReal = distanciaKm * 1.3
    
    // Calcular custo do frete
    const custoFrete = (distanciaReal * 1.5) + (peso * 0.01)

    return NextResponse.json({
      distanciaKm: distanciaReal.toFixed(2),
      pesoGramas: peso,
      custoFrete: custoFrete.toFixed(2)
    })

  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 