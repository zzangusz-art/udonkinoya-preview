/* Shared by the static publisher and visible-page structured data sync. */
(function (root) {
  'use strict';
  const origin = 'https://www.udonkinoya.com';
  const channels = {
    youtube: 'https://youtube.com/channel/UCIldF3OZD_arDOhqB1OgpHg',
    instagram: 'https://www.instagram.com/udonkinoya_success/',
    tiktok: 'https://www.tiktok.com/@udonkinoya',
    blog: 'https://blog.naver.com/udonkinoya'
  };
  function offers(raw) {
    return String(raw || '').split(/\n|<br\s*\/?\s*>/i).flatMap(line => {
      const match = line.trim().match(/^(.*?)(\d[\d,]*)\s*원\s*$/);
      if (!match) return [];
      const price = Number(match[2].replace(/,/g, ''));
      if (!Number.isSafeInteger(price) || price <= 0) return [];
      return [{ '@type': 'Offer', ...(match[1].trim() ? {name: match[1].trim()} : {}), price: String(price), priceCurrency: 'KRW' }];
    });
  }
  function menu(sections, url = origin + '/menu/') {
    return {'@type': 'Menu', '@id': url + '#menu', name: '우동키노야 대표 메뉴 및 가격', inLanguage: 'ko-KR',
      hasMenuSection: sections.map(section => ({'@type': 'MenuSection', name: section.name,
        hasMenuItem: section.items.map(item => ({'@type': 'MenuItem', '@id': url + '#menu-' + item.id,
          name: item.name, ...(item.description ? {description: item.description} : {}),
          ...(offers(item.price).length ? {offers: offers(item.price)} : {})}))}))};
  }
  function hours(text) {
    const time = String(text || '').match(/(\d{1,2}):(\d{2})\s*[~～–-]\s*(\d{1,2}):(\d{2})/);
    if (!time) return [];
    const clock = (h, m) => Number(h) < 24 && Number(m) < 60 ? h.padStart(2, '0') + ':' + m : '';
    const opens = clock(time[1], time[2]), closes = clock(time[3], time[4]);
    if (!opens || !closes || opens >= closes) return [];
    const names = ['월', '화', '수', '목', '금', '토', '일'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const off = String(text).match(/매주\s*([월화수목금토일](?:\s*[,·ㆍ/]\s*[월화수목금토일])*)요일\s*(?:정기)?휴무/);
    // Variable department-store holidays and differing weekday hours need explicit confirmation.
    if (/휴무일 준수|금\/토\/일|공휴일|변동|평일|주말/.test(text)) return [];
    const dayOfWeek = days.filter((day, i) => !off || !off[1].includes(names[i])).map(day => 'https://schema.org/' + day);
    const pause = String(text).match(/BT\s*(\d{1,2}:\d{2})\s*[~～–-]\s*(\d{1,2}:\d{2})/i);
    const periods = pause && opens < pause[1] && pause[1] < pause[2] && pause[2] < closes
      ? [[opens, pause[1]], [pause[2], closes]] : [[opens, closes]];
    return periods.map(([from, to]) => ({'@type': 'OpeningHoursSpecification', dayOfWeek, opens: from, closes: to}));
  }
  root.KinoyaSearchModel = {origin, channels, offers, menu, hours};
})(globalThis);
