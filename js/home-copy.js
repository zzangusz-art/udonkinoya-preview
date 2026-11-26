/* Named bindings for text created after the homepage's static CMS model. */
(function () {
  'use strict';
  const fields = [];
  function add(key, group, label, selector, initial) {
    fields.push({key:'home.copy.' + key, group, label, selector, initial, type:'text'});
  }
  ['48시간|저온숙성의 기다림','13개월|면을 위한 연구','한 그릇|타협하지 않는 원칙'].forEach((pair,i) => {
    pair.split('|').forEach((text,j) => add('fact.'+(i+1)+'.'+j,'top','메인 강조 '+(i+1)+(j?' 설명':' 제목'),'.hero-facts > div:nth-child('+(i+1)+') '+(j?'span':'strong'),text));
  });
  [['01 / OUR MENU','오늘 만날 한 그릇'],['02 / FIND KINOYA','우리 동네 키노야'],['03 / WITH KINOYA','키노야와 함께하기']].forEach((pair,i) => {
    pair.forEach((text,j) => add('discovery.'+(i+1)+'.'+j,'top','메인 바로가기 '+(i+1)+(j?' 제목':' 상단 문구'),'.discovery-link:nth-child('+(i+1)+') '+(j?'strong':'small'),text));
  });
  add('toc.open','floating','목차 열기 버튼','.atelier-index-trigger','목차 +');
  add('toc.title','floating','목차 창 제목','.atelier-index h2','섹션 바로가기');
  const sections = {top:'우동키노야',social:'소셜미디어',numbers:'숫자로 보는 우동키노야','brand-story':'브랜드스토리',noodle:'키노야의 신념과 경쟁력',people:'우동키노야 사람들',proof:'창업안내&비용',model:'창업비용 상세표',stores:'우리동네 키노야','menu-preview':'메뉴소개','faq-preview':'FAQ','news-full':'뉴스','resources-full':'자료실',final:'CONTACT'};
  Object.entries(sections).forEach(([id,text]) => add('toc.'+id,'floating','목차 항목 — '+text,'.atelier-index a[href="#'+id+'"] .atelier-link-label',text));
  ['seoul','nationwide'].forEach((code,i) => {
    const label=i?'전국 각지':'서울 지역';
    add('stores.'+code+'.jump','stores',label+' 바로가기','#stores .section-jump-links a[href="#home-page-stores-'+code+'"]',label);
    add('stores.'+code+'.heading','stores',label+' 목록 제목','#home-store-heading-'+code,label+' · '+(i?25:26)+'개 매장');
    add('stores.'+code+'.hint','stores',label+' 슬라이드 안내','#home-page-stores-'+code+' .home-store-hint',(i?'경기 · 인천 · 충청 · 대구 · 부산 · 제주 | ':'')+'좌우로 넘겨보세요. 자동으로 이동하며, 끝에서 반대 방향으로 돌아옵니다.');
  });
  add('news.more','news-full','뉴스 더보기 버튼','#news-grid .news-more-btn','더보기 →');
  add('resources.download','resources-full','자료 다운로드 버튼','#resources-list .resource-download','다운로드');
  add('resources.category','resources-full','기본 회사소개서 분류','#resources-list [data-default-resource] .resource-category','회사소개서 · 브로슈어');
  add('resources.title','resources-full','기본 회사소개서 제목','#resources-list [data-default-resource] .resource-title','우동키노야 회사소개서 (브로슈어)');
  add('resources.description','resources-full','기본 회사소개서 설명','#resources-list [data-default-resource] .resource-desc','우동키노야 브랜드 소개 및 합리적 창업 안내 브로슈어 (PDF · kinoya_company.pdf)');
  add('renewal.eyebrow','proof','리뉴얼 사례 상단 문구','.rc-renewal .fr-ba-head .eyebrow','Before & After · 리뉴얼 사례');
  add('renewal.before','proof','리뉴얼 비교 전 라벨','.rc-tag-before','BEFORE');
  add('renewal.after','proof','리뉴얼 비교 후 라벨','.rc-tag-after','AFTER · KINOYA');
  add('renewal.hint','proof','리뉴얼 비교 사용 안내','.rc-hint','좌우로 드래그해 비교해보세요');
  add('renewal.scopeLabel','proof','리뉴얼 공사 범위 라벨','.rc-info dl > div:first-child dt','공사 범위');
  add('renewal.caseLabel','proof','리뉴얼 창업 사례 라벨','.rc-info dl > div:nth-child(2) dt','창업 사례');
  add('renewal.source','proof','기존 비교 이미지 보기','.rc-source summary','기존 전후 비교 이미지 보기');
  add('renewal.note','proof','리뉴얼 비용 안내','.rc-note','※ 창업비용은 각 매장의 실제 오픈 사례이며, 점포 스펙·평수·별도공사 여부에 따라 달라질 수 있습니다. (점포비 별도)');
  ['홀 + 다찌 리뉴얼','홀 + 주방 리뉴얼','홀 + 1인 닷지 설치'].forEach((scope,i) => {
    const selector='.rc-row:nth-child('+(i+1)+')';
    add('renewal.'+i+'.number','proof','리뉴얼 사례 '+(i+1)+' 번호',selector+' .rc-number','0'+(i+1));
    add('renewal.'+i+'.case','proof','리뉴얼 사례 '+(i+1)+' 영문 제목',selector+' .rc-case','Renewal Case 0'+(i+1));
    add('renewal.'+i+'.desc','proof','리뉴얼 사례 '+(i+1)+' 설명',selector+' .rc-desc','기존 매장을 활용한 우동키노야 리뉴얼 사례입니다.');
    add('renewal.'+i+'.scope','proof','리뉴얼 사례 '+(i+1)+' 공사 범위',selector+' dl > div:first-child dd',scope);
  });
  [[4000,9500],[1900,8000]].forEach((values,i) => values.forEach((value,j) => {
    const selector='.fr-conversion-card:nth-child('+(i+1)+') .rc-bar:nth-child('+(j+1)+') .rc-bar-label';
    add('conversion.'+i+'.'+j+'.label','proof','업종전환 사례 '+(i+1)+(j?' 변경 후':' 변경 전')+' 매출 라벨',selector+' span',(j?'우동키노야':'변경 전')+' · 월매출');
    add('conversion.'+i+'.'+j+'.value','proof','업종전환 사례 '+(i+1)+(j?' 변경 후':' 변경 전')+' 매출 금액',selector+' strong',value.toLocaleString('ko-KR')+'만원');
  }));
  let currentRows = {};
  function apply(doc, rows) {
    if (doc === document) currentRows = rows || {};
    fields.forEach(field => {
      const row = rows && rows[field.key];
      if (!row || row.value == null) return;
      doc.querySelectorAll(field.selector).forEach(el => {
        const value = String(row.value);
        if (el.textContent !== value) el.textContent = value;
        if (el.matches('.hero-facts strong')) el.dataset.countTarget = value;
      });
    });
  }
  function refresh(doc = document) { apply(doc, currentRows); }
  window.HomeCopy = {fields, apply, refresh};
})();
