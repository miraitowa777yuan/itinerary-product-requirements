const CITY_HUBS = {
  北京: {
    airports: [
      { name: '北京首都国际机场', terminals: ['T2航站楼', 'T3航站楼'] },
      { name: '北京大兴国际机场', terminals: ['航站楼'] }
    ],
    stations: ['北京站', '北京西站', '北京南站', '北京北站', '北京朝阳站', '清河站']
  },
  上海: {
    airports: [
      { name: '上海虹桥国际机场', terminals: ['T1航站楼', 'T2航站楼'] },
      { name: '上海浦东国际机场', terminals: ['T1航站楼', 'T2航站楼', 'S1卫星厅', 'S2卫星厅'] }
    ],
    stations: ['上海站', '上海虹桥站', '上海南站', '上海西站', '上海松江站']
  },
  广州: {
    airports: [{ name: '广州白云国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['广州站', '广州南站', '广州东站', '广州北站', '新塘站']
  },
  深圳: {
    airports: [{ name: '深圳宝安国际机场', terminals: ['T3航站楼'] }],
    stations: ['深圳站', '深圳北站', '深圳东站', '福田站', '深圳坪山站', '光明城站']
  },
  成都: {
    airports: [
      { name: '成都双流国际机场', terminals: ['T1航站楼', 'T2航站楼'] },
      { name: '成都天府国际机场', terminals: ['T1航站楼', 'T2航站楼'] }
    ],
    stations: ['成都东站', '成都南站', '成都西站', '双流机场站', '天府机场站']
  },
  重庆: {
    airports: [{ name: '重庆江北国际机场', terminals: ['T2航站楼', 'T3航站楼'] }],
    stations: ['重庆北站', '重庆西站', '重庆东站', '沙坪坝站']
  },
  杭州: {
    airports: [{ name: '杭州萧山国际机场', terminals: ['T3航站楼', 'T4航站楼'] }],
    stations: ['杭州站', '杭州东站', '杭州西站', '杭州南站', '临平南站']
  },
  南京: {
    airports: [{ name: '南京禄口国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['南京站', '南京南站', '江宁站', '江宁西站', '仙林站']
  },
  武汉: {
    airports: [{ name: '武汉天河国际机场', terminals: ['T3航站楼'] }],
    stations: ['武汉站', '汉口站', '武昌站', '武汉东站']
  },
  西安: {
    airports: [{ name: '西安咸阳国际机场', terminals: ['T2航站楼', 'T3航站楼', 'T5航站楼'] }],
    stations: ['西安站', '西安北站', '西安西站', '西安南站']
  },
  天津: {
    airports: [{ name: '天津滨海国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['天津站', '天津西站', '天津南站', '天津北站', '滨海站']
  },
  郑州: {
    airports: [{ name: '郑州新郑国际机场', terminals: ['T2航站楼'] }],
    stations: ['郑州站', '郑州东站', '郑州航空港站', '郑州西站']
  },
  长沙: {
    airports: [{ name: '长沙黄花国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['长沙站', '长沙南站', '长沙西站']
  },
  青岛: {
    airports: [{ name: '青岛胶东国际机场', terminals: ['航站楼'] }],
    stations: ['青岛站', '青岛北站', '青岛西站', '红岛站']
  },
  厦门: {
    airports: [{ name: '厦门高崎国际机场', terminals: ['T3航站楼', 'T4航站楼'] }],
    stations: ['厦门站', '厦门北站', '高崎站']
  },
  福州: {
    airports: [{ name: '福州长乐国际机场', terminals: ['航站楼'] }],
    stations: ['福州站', '福州南站', '长乐东站', '福州新区站']
  },
  昆明: {
    airports: [{ name: '昆明长水国际机场', terminals: ['航站楼'] }],
    stations: ['昆明站', '昆明南站', '昆明西站']
  },
  海口: {
    airports: [{ name: '海口美兰国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['海口站', '海口东站', '美兰站']
  },
  三亚: {
    airports: [{ name: '三亚凤凰国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['三亚站', '凤凰机场站', '亚龙湾站', '崖州站']
  },
  哈尔滨: {
    airports: [{ name: '哈尔滨太平国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['哈尔滨站', '哈尔滨西站', '哈尔滨北站', '哈尔滨东站']
  },
  长春: {
    airports: [{ name: '长春龙嘉国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['长春站', '长春西站', '龙嘉站']
  },
  沈阳: {
    airports: [{ name: '沈阳桃仙国际机场', terminals: ['T3航站楼'] }],
    stations: ['沈阳站', '沈阳北站', '沈阳南站']
  },
  大连: {
    airports: [{ name: '大连周水子国际机场', terminals: ['航站楼'] }],
    stations: ['大连站', '大连北站', '金州站']
  },
  济南: {
    airports: [{ name: '济南遥墙国际机场', terminals: ['航站楼'] }],
    stations: ['济南站', '济南西站', '济南东站', '大明湖站']
  },
  合肥: {
    airports: [{ name: '合肥新桥国际机场', terminals: ['航站楼'] }],
    stations: ['合肥站', '合肥南站', '合肥西站']
  },
  南昌: {
    airports: [{ name: '南昌昌北国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['南昌站', '南昌西站', '南昌东站']
  },
  南宁: {
    airports: [{ name: '南宁吴圩国际机场', terminals: ['T2航站楼'] }],
    stations: ['南宁站', '南宁东站', '南宁北站', '吴圩机场站']
  },
  贵阳: {
    airports: [{ name: '贵阳龙洞堡国际机场', terminals: ['T2航站楼', 'T3航站楼'] }],
    stations: ['贵阳站', '贵阳北站', '贵阳东站', '龙洞堡站']
  },
  太原: {
    airports: [{ name: '太原武宿国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['太原站', '太原南站']
  },
  石家庄: {
    airports: [{ name: '石家庄正定国际机场', terminals: ['T2航站楼'] }],
    stations: ['石家庄站', '石家庄北站', '石家庄东站', '正定机场站']
  },
  乌鲁木齐: {
    airports: [{ name: '乌鲁木齐天山国际机场', terminals: ['T4航站楼'] }],
    stations: ['乌鲁木齐站', '乌鲁木齐南站']
  },
  兰州: {
    airports: [{ name: '兰州中川国际机场', terminals: ['T1航站楼', 'T2航站楼', 'T3航站楼'] }],
    stations: ['兰州站', '兰州西站', '中川机场站']
  },
  银川: {
    airports: [{ name: '银川河东国际机场', terminals: ['T2航站楼', 'T3航站楼'] }],
    stations: ['银川站', '银川东站', '河东机场站']
  },
  呼和浩特: {
    airports: [{ name: '呼和浩特白塔国际机场', terminals: ['航站楼'] }],
    stations: ['呼和浩特站', '呼和浩特东站']
  },
  宁波: {
    airports: [{ name: '宁波栎社国际机场', terminals: ['T2航站楼'] }],
    stations: ['宁波站', '庄桥站', '奉化站']
  },
  温州: {
    airports: [{ name: '温州龙湾国际机场', terminals: ['T1航站楼', 'T2航站楼'] }],
    stations: ['温州站', '温州南站', '温州北站']
  },
  珠海: {
    airports: [{ name: '珠海金湾机场', terminals: ['航站楼'] }],
    stations: ['珠海站', '珠海北站', '明珠站']
  },
  香港: {
    airports: [{ name: '香港国际机场', terminals: ['T1航站楼'] }],
    stations: ['香港西九龙站']
  },
  澳门: {
    airports: [{ name: '澳门国际机场', terminals: ['航站楼'] }],
    stations: []
  }
}

const AIRLINES = {
  CA: '中国国际航空', MU: '中国东方航空', CZ: '中国南方航空', HU: '海南航空',
  '3U': '四川航空', MF: '厦门航空', ZH: '深圳航空', SC: '山东航空',
  FM: '上海航空', KN: '中国联合航空', HO: '吉祥航空', GS: '天津航空',
  JD: '首都航空', PN: '西部航空', '9C': '春秋航空', GJ: '长龙航空',
  EU: '成都航空', TV: '西藏航空', NS: '河北航空', BK: '奥凯航空',
  KY: '昆明航空', QW: '青岛航空', GX: '北部湾航空', AQ: '九元航空',
  Y8: '金鹏航空', DR: '瑞丽航空', UQ: '乌鲁木齐航空', LT: '龙江航空',
  RY: '江西航空', DZ: '东海航空'
}

function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, '').replace(/市$/, '')
}

function getHubSuggestions(type, query) {
  const keyword = normalize(query)
  if (!keyword) return []
  const results = []
  Object.keys(CITY_HUBS).forEach(city => {
    const hubs = type === 'flight' ? CITY_HUBS[city].airports : CITY_HUBS[city].stations
    hubs.forEach(hub => {
      const item = typeof hub === 'string' ? { name: hub, terminals: [] } : hub
      if (normalize(city).includes(keyword) || normalize(item.name).includes(keyword)) {
        results.push({ city, name: item.name, terminals: item.terminals || [] })
      }
    })
  })
  return results.slice(0, 8)
}

function findKnownHubsInText(text, type) {
  const source = normalize(text)
  const matches = []
  Object.keys(CITY_HUBS).forEach(city => {
    const hubs = type === 'flight' ? CITY_HUBS[city].airports : CITY_HUBS[city].stations
    hubs.forEach(hub => {
      const item = typeof hub === 'string' ? { name: hub, terminals: [] } : hub
      const candidates = [item.name, item.name.replace(/国际机场$/, ''), item.name.replace(/机场$/, '')]
      const matched = candidates.find(name => name.length >= 3 && source.includes(normalize(name)))
      if (matched) matches.push({ city, name: item.name, terminals: item.terminals || [], position: source.indexOf(normalize(matched)) })
    })
  })
  return matches.sort((a, b) => a.position - b.position)
}

function airlineFromFlightNo(flightNo) {
  const normalized = String(flightNo || '').toUpperCase().replace(/\s+/g, '')
  return AIRLINES[normalized.slice(0, 2)] || ''
}

module.exports = {
  CITY_HUBS,
  AIRLINES,
  getHubSuggestions,
  findKnownHubsInText,
  airlineFromFlightNo
}
