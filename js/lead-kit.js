/* 우동키노야 창업 리드 키트 (세느루, 2026-11-26)
 * 1) 유입 경로 기록: 첫 방문 랜딩·외부 유입처·UTM 을 이 브라우저에 30일 보관 → 상담 접수에 함께 남긴다.
 * 2) 빠른 상담 폼: [data-lead-form] 자리에 4칸짜리 폼을 그린다. 접수는 기존 상담 폼과 같은 길
 *    (tables/consultations → 관리자 '상담 신청', 알림 메일)로 보낸다.
 * 3) 창업비용 도우미: [data-cost-helper] 자리에 모델별 공개 금액을 보여 주고 상담으로 이어 준다.
 * 4) 전환 측정: 전화 클릭·상담 버튼·접수 완료를 gtag/dataLayer 이벤트로 보낸다(GA4 가 없으면 아무 일도 안 함).
 * 5) 미리보기(window.KINOYA_PREVIEW): 모든 폼 제출을 막고 안내만 띄운다 — 운영 DB·메일로 아무것도 나가지 않는다.
 * 금액·문구는 src/data.mjs 와 사이트 게시 내용 그대로다. 바뀌면 둘 다 고친다.
 */
(function () {
  'use strict';
  if (window.KinoyaLeadKit) return;
  var script = document.currentScript;
  var ROOT = script ? new URL('../', script.src) : new URL('/', location.href);
  var PREVIEW = !!window.KINOYA_PREVIEW;
  var TEL = '1551-8748';
  var NOTIFY_DEFAULT = 'delhi1984@naver.com';
  var KEY = 'kinoya_lead_src_v1';
  var TTL = 30 * 24 * 3600 * 1000;

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function path(rel) { return new URL(rel.replace(/^\//, ''), ROOT).href; }

  /* ---------- 1) 유입 경로 ---------- */
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  function captureSource() {
    var q = new URLSearchParams(location.search);
    var utm = {};
    UTM.forEach(function (k) { var v = q.get(k); if (v) utm[k] = v.slice(0, 80); });
    var ref = '';
    try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = new URL(document.referrer).host; } catch (e) {}
    var now = Date.now();
    var cur = store(KEY);
    if (cur && now - (cur.ts || 0) > TTL) cur = null;
    var touch = { landing: location.pathname, ref: ref, utm: utm, ts: now };
    if (!cur) cur = { first: touch, last: null, ts: now, pages: 0 };
    else if (Object.keys(utm).length || ref) cur.last = touch;
    cur.pages = (cur.pages || 0) + 1;
    store(KEY, cur);
    return cur;
  }
  function sourceText() {
    var s = store(KEY);
    if (!s || !s.first) return '';
    function one(t) {
      var parts = ['랜딩 ' + t.landing];
      parts.push('유입 ' + (t.ref || (t.utm && t.utm.utm_source) || '직접·북마크'));
      var u = t.utm || {};
      if (u.utm_source || u.utm_medium || u.utm_campaign) parts.push('UTM ' + [u.utm_source, u.utm_medium, u.utm_campaign, u.utm_term].filter(Boolean).join('/'));
      return parts.join(' · ');
    }
    var txt = '첫 방문: ' + one(s.first);
    if (s.last) txt += ' | 최근 유입: ' + one(s.last);
    txt += ' | 본 페이지 수 ' + (s.pages || 1) + ' | 접수 페이지 ' + location.pathname;
    return txt;
  }
  captureSource();

  /* ---------- 4) 전환 측정 ---------- */
  function track(name, params) {
    params = params || {};
    params.page_path = location.pathname;
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch (e) {}
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, params)); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a,button');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^tel:/i.test(href)) track('phone_call_click', { phone: href.slice(4), label: a.getAttribute('data-label') || '' });
    else if (/contact\/?(#|$)/.test(href)) track('consult_cta_click', { label: a.getAttribute('data-label') || (a.textContent || '').trim().slice(0, 30) });
    else if (/franchise\/cost\/?/.test(href)) track('cost_cta_click', { label: (a.textContent || '').trim().slice(0, 30) });
  }, true);

  /* ---------- 토스트 ---------- */
  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'lk-toast';
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-on'); });
    setTimeout(function () { el.classList.remove('is-on'); setTimeout(function () { el.remove(); }, 400); }, 3800);
  }

  /* ---------- 5) 미리보기: 제출 차단 ---------- */
  if (PREVIEW) {
    document.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast('미리보기 화면입니다. 상담 신청은 운영 사이트에서만 접수됩니다.');
    }, true);
    var nativeFetch = window.fetch;
    window.fetch = function (input, opts) {
      var url = String(input && input.url || input || '');
      var method = String((opts && opts.method) || 'GET').toUpperCase();
      if (/formsubmit\.co/.test(url) || (method !== 'GET' && /tables\//.test(url))) return Promise.resolve(new Response('{"preview":true}', { status: 503, headers: { 'Content-Type': 'application/json' } }));
      return nativeFetch.apply(this, arguments);
    };
  }

  /* ---------- 2) 빠른 상담 폼 ---------- */
  var TYPES = [['신규창업', '신규 창업'], ['업종전환', '업종전환(운영 중인 매장)'], ['기존점포보유', '점포 보유'], ['미정', '아직 미정']];
  var BUDGETS = ['8천만원 이하', '8천만~1억원', '1억~1억 5천만원', '1억 5천만원 이상', '미정'];
  var uid = 0;

  function formHTML(opt) {
    var id = 'lk' + (++uid);
    var type = opt.type || '신규창업';
    return '' +
      '<div class="lk-card">' +
      '<div class="lk-head"><p class="lk-eyebrow">창업 상담</p>' +
      '<p class="lk-title">' + esc(opt.title || '내 지역 출점 가능 여부부터 확인해 보세요') + '</p>' +
      '<p class="lk-sub">' + esc(opt.sub || '이름과 연락처만 남기면 본사 창업 담당자가 연락드립니다. 상담은 계약 의무가 없습니다.') + '</p></div>' +
      '<form class="lk-form" novalidate data-lk-form>' +
      '<div class="lk-row2">' +
      '<label class="lk-field"><span>성함 <em>*</em></span><input name="name" autocomplete="name" required maxlength="30" placeholder="홍길동"></label>' +
      '<label class="lk-field"><span>연락처 <em>*</em></span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" placeholder="010-0000-0000"></label>' +
      '</div><div class="lk-row2">' +
      '<label class="lk-field"><span>희망 지역</span><input name="region" maxlength="40" placeholder="예: 경기 고양시 일산"></label>' +
      '<label class="lk-field"><span>예상 예산</span><select name="budget"><option value="">선택</option>' + BUDGETS.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select></label>' +
      '</div>' +
      '<fieldset class="lk-types"><legend>상담 구분</legend>' + TYPES.map(function (t) {
        return '<label><input type="radio" name="startup_type" value="' + t[0] + '"' + (t[0] === type ? ' checked' : '') + '><span>' + t[1] + '</span></label>';
      }).join('') + '</fieldset>' +
      '<label class="lk-consent"><input type="checkbox" name="consent" required> <span>개인정보(성함·연락처·지역) 수집·이용에 동의합니다. 상담 안내에만 쓰고 처리 후 파기합니다. <a href="' + path('contact/') + '#consult-form">전문 보기</a></span></label>' +
      '<input type="hidden" name="memo" value="' + esc(opt.memo || '') + '">' +
      '<div class="lk-actions"><button type="submit" class="lk-submit">무료 창업 상담 신청</button>' +
      '<a class="lk-tel" href="tel:' + TEL + '" data-label="lead_form">전화 ' + TEL + '</a></div>' +
      (PREVIEW ? '<p class="lk-preview">미리보기 화면에서는 접수되지 않습니다.</p>' : '') +
      '</form>' +
      '<div class="lk-done" hidden><p class="lk-title">상담 신청이 접수되었습니다.</p><p class="lk-sub">담당자가 확인 후 남겨 주신 연락처로 연락드립니다. 급하시면 ' + TEL + '로 전화 주세요.</p></div>' +
      '</div>';
  }

  var notifyEmail = NOTIFY_DEFAULT;
  if (!PREVIEW) {
    try {
      fetch(path('tables/site_content?search=contact.notify.email&limit=100')).then(function (r) { return r && r.ok ? r.json() : null; }).then(function (j) {
        var row = j && Array.isArray(j.data) && j.data.find(function (x) { return x && x.key === 'contact.notify.email' && !x.deleted; });
        var v = row && typeof row.value === 'string' ? row.value.trim() : '';
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) notifyEmail = v;
      }).catch(function () {});
    } catch (e) {}
  }

  function sendMail(p) {
    return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(notifyEmail), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: '[우동키노야 빠른 창업상담] ' + p.name + '님 (' + p.startup_type + ' / ' + p.region + ')',
        _template: 'table', _captcha: 'false',
        '신청자 성함': p.name, '연락처': p.phone, '희망지역': p.region, '상담 구분': p.startup_type,
        '예상 예산': p.budget || '(미선택)', '문의 내용': p.message, '유입 경로': p.lead_source || '(기록 없음)',
        '접수 일시(KST)': new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
      })
    }).then(function (r) { return !!(r && r.ok); }).catch(function () { return false; });
  }

  function bind(host) {
    if (host.dataset.lkBound) return;
    host.dataset.lkBound = '1';
    host.classList.add('lk-host');
    host.innerHTML = formHTML({ title: host.getAttribute('data-title'), sub: host.getAttribute('data-sub'), type: host.getAttribute('data-type'), memo: host.getAttribute('data-memo') });
    var form = host.querySelector('[data-lk-form]');
    var busy = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || PREVIEW) return;
      var f = form.elements;
      var name = f.name.value.trim(), phone = f.phone.value.trim();
      if (!name || !phone) { toast('성함과 연락처를 입력해 주세요.'); (name ? f.phone : f.name).focus(); return; }
      if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) { toast('연락처를 숫자로 입력해 주세요.'); f.phone.focus(); return; }
      if (!f.consent.checked) { toast('개인정보 수집·이용에 동의해 주세요.'); return; }
      var typeEl = form.querySelector('[name="startup_type"]:checked');
      var type = typeEl ? typeEl.value : '미정';
      var region = f.region.value.trim();
      var src = sourceText();
      var msg = ['[빠른 상담 폼]', f.budget.value ? '예상 예산: ' + f.budget.value : '', f.memo.value ? '관심: ' + f.memo.value : '', src ? '유입: ' + src : ''].filter(Boolean).join('\n');
      var p = {
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        created_at: Date.now(), name: name, phone: phone, region: region || ('[' + type + ']'),
        startup_type: type, message: msg, consent: true, source_page: location.pathname, status: 'new',
        budget: f.budget.value, lead_source: src, form_name: 'quick_consult'
      };
      busy = true;
      var btn = form.querySelector('.lk-submit');
      btn.disabled = true; btn.textContent = '보내는 중…';
      fetch(path('tables/consultations'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
        .then(function (r) { if (!r.ok) throw new Error('save ' + r.status); return sendMail(p); })
        .then(function (mailed) {
          form.hidden = true;
          host.querySelector('.lk-done').hidden = false;
          track('generate_lead', { form_name: 'quick_consult', startup_type: type, budget: p.budget || '', email_dispatched: mailed });
        })
        .catch(function () {
          return sendMail(p).then(function (mailed) {
            if (mailed) { form.hidden = true; host.querySelector('.lk-done').hidden = false; track('generate_lead', { form_name: 'quick_consult', startup_type: type, fallback: 'email_only' }); }
            else toast('전송에 실패했습니다. ' + TEL + '로 전화 주시면 바로 안내해 드립니다.');
          });
        })
        .finally(function () { busy = false; btn.disabled = false; btn.textContent = '무료 창업 상담 신청'; });
    });
  }

  /* ---------- 3) 창업비용 도우미 ---------- */
  var MODELS = [
    { k: 'compact', t: '10평대 바석(닷지)형', amt: '약 8천만원 전후', inc: '가맹·교육·인테리어·설비·간판·가구 포함 (본사 FAQ 기준)', type: '신규창업', note: '13~20석 1인 바 좌석. 실제 사례: 정자역점 13평 22석.' },
    { k: 'std30', t: '30평형 표준(홀+바석)', amt: '1억 2,485만원', inc: '가맹비·교육비·인테리어·주방설비·간판 (부가세 포함, 본사 표준 견적표)', type: '신규창업', note: '가맹 100호점까지 가맹비 30%·교육비 40% 지원(계약 시점 적용 여부 확인).' },
    { k: 'renewal', t: '리뉴얼(무권리 점포)', amt: '7,200만~8,200만원 사례', inc: '기존 바닥·천장·설비를 살리고 외관·다찌석·사인물 위주 시공', type: '기존점포보유', note: '건대점 7,400만원 · 일산차병원점 7,200만원 · 중앙대점 8,200만원.' },
    { k: 'conversion', t: '업종전환(운영 중인 식당)', amt: '약 4천만원 사례', inc: '기존 주방·홀 설비 재활용, 면기·숙성고·간판 등 필수 설비 보강', type: '업종전환', note: '합정점 월 4,000→9,500만원(약 2.4배) · 금천구청역점 월 1,900→8,000만원(약 4.2배), 본사 제공 전후 매출.' }
  ];
  function bindCost(host) {
    if (host.dataset.lkBound) return;
    host.dataset.lkBound = '1';
    host.classList.add('lk-host');
    host.innerHTML = '<div class="lk-card lk-cost"><div class="lk-head"><p class="lk-eyebrow">창업비용 도우미</p>' +
      '<p class="lk-title">내 상황에 맞는 모델을 고르면 공개된 기준 금액을 바로 보여 드립니다</p>' +
      '<p class="lk-sub">점포 보증금·권리금·현장별 별도공사는 제외된 참고 금액입니다. 확정 견적은 상담으로 받으세요.</p></div>' +
      '<div class="lk-models" role="radiogroup" aria-label="창업 모델">' + MODELS.map(function (m, i) {
        return '<button type="button" role="radio" aria-checked="' + (i === 0) + '" class="lk-model' + (i === 0 ? ' is-on' : '') + '" data-k="' + m.k + '">' + m.t + '</button>';
      }).join('') + '</div><div class="lk-result" aria-live="polite"></div></div>';
    var out = host.querySelector('.lk-result');
    function show(k) {
      var m = MODELS.filter(function (x) { return x.k === k; })[0];
      out.innerHTML = '<p class="lk-amt">' + m.amt + '</p><p class="lk-inc">' + m.inc + '</p><p class="lk-note">' + m.note + '</p>' +
        '<button type="button" class="lk-submit lk-go" data-type="' + m.type + '" data-memo="' + esc(m.t) + '">이 조건으로 견적 상담받기</button>';
      track('cost_helper_select', { model: m.k });
    }
    host.querySelectorAll('.lk-model').forEach(function (b) {
      b.addEventListener('click', function () {
        host.querySelectorAll('.lk-model').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('is-on'); b.setAttribute('aria-checked', 'true'); show(b.dataset.k);
      });
    });
    out.addEventListener('click', function (e) {
      var go = e.target.closest('.lk-go');
      if (!go) return;
      var target = document.querySelector('[data-lead-form]');
      if (!target) { location.href = path('contact/'); return; }
      var form = target.querySelector('[data-lk-form]');
      if (form) {
        var r = form.querySelector('[name="startup_type"][value="' + go.dataset.type + '"]'); if (r) r.checked = true;
        form.elements.memo.value = go.dataset.memo;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { var n = target.querySelector('[name="name"]'); if (n) n.focus({ preventScroll: true }); }, 600);
      track('cost_helper_cta', { model: go.dataset.memo });
    });
    show(MODELS[0].k);
  }

  function init() {
    document.querySelectorAll('[data-lead-form]').forEach(bind);
    document.querySelectorAll('[data-cost-helper]').forEach(bindCost);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.KinoyaLeadKit = { track: track, sourceText: sourceText, toast: toast };
  window.KinoyaLeadSource = { text: sourceText };
})();
