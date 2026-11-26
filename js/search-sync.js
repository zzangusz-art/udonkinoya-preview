/* Structured data describes the current visible content; no visual changes. */
(function () {
  'use strict';
  const model = window.KinoyaSearchModel;
  if (!model || /\/admin(?:\/|$)/.test(location.pathname)) return;
  function text(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return copy.textContent.trim();
  }
  let channelRows = {};
  function sync() {
    const catalog = document.querySelector('main .menu-catalog');
    const sections = catalog ? [...catalog.querySelectorAll('.menu-category')].filter(section => getComputedStyle(section).display !== 'none').map(section => ({
      name: text(section.querySelector('h3')),
      items: [...section.querySelectorAll('.menu-catalog-card')].map(card => ({
        id: (card.querySelector('h4')?.dataset.cms || '').replace(/^menu\.catalog\./, '').replace(/\.name$/, ''),
        name: text(card.querySelector('h4')),
        description: text(card.querySelector('.menu-catalog-description')),
        price: text(card.querySelector('.menu-catalog-price'))
      }))
    })) : null;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      let data; try { data = JSON.parse(script.textContent); } catch { return; }
      const graph = data['@graph'] || [data];
      graph.forEach((item, index) => {
        if (item['@type'] === 'Menu' && sections) graph[index] = model.menu(sections);
        if (item['@type'] === 'FAQPage') {
          const entries = [...document.querySelectorAll('main .faq-item')];
          if (entries.length) item.mainEntity = entries.flatMap(entry => {
            const q = text(entry.querySelector('.faq-q')).replace(/\s+/g, ' ').trim();
            const answer = entry.querySelector('.faq-a-inner')?.cloneNode(true);
            answer?.querySelectorAll('.faq-meta').forEach(node => node.remove());
            const a = text(answer).replace(/\s+/g, ' ').trim();
            return q && a ? [{'@type':'Question', name:q, acceptedAnswer:{'@type':'Answer', text:a}}] : [];
          });
        }
        if (item['@type'] === 'Organization' && item['@id'] === model.origin + '/#organization') {
          item.sameAs = Object.entries(model.channels).flatMap(([name, fallback]) => {
            const raw = channelRows['social.sns.' + name];
            const value = raw ? raw.value : fallback;
            try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? [u.href] : []; } catch { return []; }
          });
        }
        if (item['@type'] === 'Restaurant') {
          const card = document.querySelector('main .store-card');
          if (!card) return;
          item.name = text(card.querySelector('h3')) || item.name;
          const phone = card.querySelector('a[href^="tel:"]');
          if (phone) item.telephone = phone.getAttribute('href').slice(4);
          const address = text(card.querySelector('address'));
          if (address) item.address = {'@type':'PostalAddress', streetAddress: address, addressCountry: 'KR'};
          item.menu = model.origin + '/menu/';
          item.parentOrganization = {'@id': model.origin + '/#organization'};
          const hours = text(card.querySelector('[data-search-hours]'));
          if (hours) {
            const schedule = model.hours(hours);
            if (schedule.length) item.openingHoursSpecification = schedule;
            else delete item.openingHoursSpecification;
          }
        }
      });
      const next = JSON.stringify(data).replace(/</g, '\\u003c');
      if (script.textContent !== next) script.textContent = next;
    });
  }
  let scheduled;
  const schedule = () => { clearTimeout(scheduled); scheduled = setTimeout(sync, 0); };
  ['kinoya:cms-ready', 'home-cms-loaded'].forEach(name => document.addEventListener(name, event => {
    channelRows = event.detail?.rows || channelRows;
    schedule();
  }));
  document.addEventListener('home-menu-mounted', schedule);
  // CMS may apply updates after either event. Observe body content, never our head scripts.
  const observer = new MutationObserver(schedule);
  const start = () => { sync(); observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['href']}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
  window.KinoyaSearchSync = {sync};
})();
