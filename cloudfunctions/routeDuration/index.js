const https = require('https')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = ''
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (error) { reject(error) }
      })
    }).on('error', reject)
  })
}

function queryUrl(path, params) {
  const query = Object.keys(params).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
  return `https://apis.map.qq.com${path}?${query}`
}

async function geocode(address, key) {
  const result = await getJson(queryUrl('/ws/geocoder/v1/', { address, key }))
  if (result.status !== 0 || !result.result) throw new Error(`无法定位：${address}`)
  return result.result.location
}

async function driving(origin, destination, key) {
  const from = await geocode(origin, key)
  const to = await geocode(destination, key)
  const result = await getJson(queryUrl('/ws/direction/v1/driving/', {
    from: `${from.lat},${from.lng}`,
    to: `${to.lat},${to.lng}`,
    policy: 'LEAST_TIME',
    key
  }))
  if (result.status !== 0 || !result.result || !result.result.routes || !result.result.routes[0]) {
    throw new Error(`无法计算路线：${origin} → ${destination}`)
  }
  return result.result.routes[0]
}

exports.main = async (event) => {
  const key = process.env.TENCENT_MAP_KEY
  if (!key) throw new Error('路线云函数尚未配置 TENCENT_MAP_KEY')
  const pairs = Array.isArray(event.pairs) ? event.pairs.slice(0, 8) : []
  const routes = []
  for (const pair of pairs) {
    if (!pair.origin || !pair.destination || String(pair.origin).length > 100 || String(pair.destination).length > 100) continue
    try {
      const route = await driving(pair.origin, pair.destination, key)
      routes.push(Object.assign({}, pair, {
        durationMinutes: Math.max(1, Math.round(route.duration)),
        distanceKm: (route.distance / 1000).toFixed(1),
        calculatedAt: new Date().toISOString()
      }))
    } catch (error) {
      routes.push(Object.assign({}, pair, { error: error.message }))
    }
  }
  return { routes }
}
