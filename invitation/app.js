(function(){
  const headerDir = './pictures/header/';
  const galleryDir = './pictures/gallery/';

  // Load header main image: pick the single file in header directory
  async function findSingleHeaderImage() {
    // GitHub Pages cannot list directory contents at runtime; assume file named main_image.* or fallback to first known extension
    const candidates = ['main_image.jpg','main_image.jpeg','main_image.png','main_image.webp'];
    for (const name of candidates) {
      const url = headerDir + name;
      const exists = await urlExists(url);
      if (exists) return url;
    }
    // Fallback: try to use exact path without extension as user noted
    const noExt = headerDir + 'main_image';
    const fallbackExts = ['.jpg','.jpeg','.png','.webp'];
    for (const ext of fallbackExts) {
      const url = noExt + ext;
      if (await urlExists(url)) return url;
    }
    // As last resort, use the first image shipped in repo previewed by build
    return headerDir + 'AU1_0651-2.jpg';
  }

  async function urlExists(url){
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch { return false; }
  }

  function setHeroImage(src){
    const img = document.getElementById('heroImage');
    if (!img) return;
    img.src = src;
    img.decoding = 'async';
    img.loading = 'eager';
  }

  // Render mini calendar for Jan 2026 with circle on 31st
  function renderCalendar(){
    const root = document.getElementById('calendar');
    if (!root) return;
    const year = 2026, monthIndex = 0; // January
    const selectedDay = 31;
    const dow = ['일','월','화','수','목','금','토'];

    const head = document.createElement('div');
    head.className = 'cal-head';
    head.innerHTML = '<strong>2026년 1월</strong>';
    root.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'grid';
    root.appendChild(grid);

    // DOW header
    for (let i=0;i<7;i++){
      const c = document.createElement('div');
      c.className = 'cell dow';
      c.textContent = dow[i];
      grid.appendChild(c);
    }

    const first = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex+1, 0).getDate();
    const totalCells = Math.ceil((first + daysInMonth) / 7) * 7;

    for (let i=0;i<totalCells;i++){
      const dayNum = i - first + 1;
      const cell = document.createElement('div');
      cell.className = 'cell day';
      if (dayNum > 0 && dayNum <= daysInMonth) {
        cell.textContent = String(dayNum);
        if (dayNum === selectedDay) cell.classList.add('selected');
      } else {
        cell.textContent = '';
      }
      grid.appendChild(cell);
    }
  }

  // Map: open Naver map via deep link; placeholder box in page
  function setupMap(){
    const mapLink = document.getElementById('naverMapLink');
    const placeName = 'H스퀘어 웨딩홀 (한양대학교 동문회관 6층)';
    const lat = 37.5575; // approximate for Hanyang Univ Alumni Hall
    const lng = 127.045; 
    const webUrl = `https://map.naver.com/v5/search/${encodeURIComponent(placeName)}`;
    // App deep link (may vary by device); web fallback
    const appUrl = `nmap://search?query=${encodeURIComponent(placeName)}&appname=${encodeURIComponent(location.host)}`;
    if (mapLink){
      mapLink.href = webUrl;
      mapLink.addEventListener('click', function(e){
        // try app link first
        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isAndroid = /Android/.test(ua);
        if (isIOS || isAndroid) {
          e.preventDefault();
          const timeout = setTimeout(()=>{ location.href = webUrl; }, 800);
          location.href = appUrl;
          // If app opens, the page will background and timeout irrelevant
        }
      });
    }
    // Optional: static image via Naver Static Map API would require key; skip
  }

  // Build gallery by probing existing images in gallery directory
  async function buildGallery(){
    const wrap = document.getElementById('carousel');
    if (!wrap) return;
    // Static list: since runtime directory listing isn't possible, try common names 1..30
    const exts = ['.jpg','.jpeg','.png','.webp'];
    const items = [];
    for (let i=1;i<=50;i++){
      for (const ext of exts){
        const name = i.toString().padStart(2,'0') + ext;
        const url = galleryDir + name;
        if (await urlExists(url)) { items.push(url); break; }
      }
    }
    // Fallback: include any known repo samples
    if (items.length === 0){
      const candidates = ['AU1_0237-2.jpg','AU1_0305-2.jpg'];
      for (const c of candidates){
        const url = galleryDir + c;
        if (await urlExists(url)) items.push(url);
      }
    }
    for (const src of items){
      const a = document.createElement('div');
      a.className = 'item';
      const img = new Image();
      img.src = src;
      img.loading = 'lazy';
      img.decoding = 'async';
      a.appendChild(img);
      wrap.appendChild(a);
    }
  }

  // Footer modals
  function setupModals(){
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m=>{
      m.addEventListener('click', (e)=>{
        if (e.target.hasAttribute('data-close')) closeModal(m);
      });
      const closeBtn = m.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', ()=> closeModal(m));
    });
    document.getElementById('callBtn')?.addEventListener('click', ()=> openModal('callModal'));
    document.getElementById('shareBtn')?.addEventListener('click', ()=> openModal('shareModal'));
    document.getElementById('giftBtn')?.addEventListener('click', ()=> openModal('giftModal'));
  }

  function openModal(id){
    const m = document.getElementById(id);
    if (!m) return;
    m.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeModal(m){
    m.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  // Contacts and accounts: placeholder; user can edit
  function renderContacts(){
    const list = document.getElementById('contactList');
    if (!list) return;
    const contacts = [
      { label: '신랑', name: '송용호', phone: '010-0000-0000' },
      { label: '신부', name: '배희원', phone: '010-0000-0000' },
      { label: '신랑 아버지', name: '송재진', phone: '010-0000-0000' },
      { label: '신랑 어머니', name: '이특재', phone: '010-0000-0000' },
      { label: '신부 아버지', name: '배우철', phone: '010-0000-0000' },
      { label: '신부 어머니', name: '이은영', phone: '010-0000-0000' },
      { label: '웨딩홀', name: 'H스퀘어 웨딩홀', phone: '02-000-0000' }
    ];
    for (const c of contacts){
      const li = document.createElement('li');
      const left = document.createElement('span');
      left.textContent = `${c.label} ${c.name}`;
      const right = document.createElement('a');
      right.href = `tel:${c.phone.replace(/[^0-9+]/g,'')}`;
      right.textContent = c.phone;
      li.appendChild(left); li.appendChild(right);
      list.appendChild(li);
    }
  }

  function renderAccounts(){
    const list = document.getElementById('accountList');
    if (!list) return;
    const accounts = [
      { owner: '신랑 송용호', bank: '국민은행', number: '000000-00-000000' },
      { owner: '신부 배희원', bank: '신한은행', number: '000-000-000000' },
      { owner: '신랑 부모님', bank: '하나은행', number: '000-000000-00000' },
      { owner: '신부 부모님', bank: '우리은행', number: '0000-000-000000' }
    ];
    for (const a of accounts){
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${a.owner} · ${a.bank} ${a.number}`;
      const actions = document.createElement('div');
      actions.className = 'account-actions';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-outline';
      copyBtn.textContent = '복사';
      copyBtn.addEventListener('click', ()=> copyToClipboard(`${a.bank} ${a.number}`));
      actions.appendChild(copyBtn);
      li.appendChild(span); li.appendChild(actions);
      list.appendChild(li);
    }
  }

  function setupShare(){
    const copyBtn = document.getElementById('copyLinkBtn');
    copyBtn?.addEventListener('click', ()=> copyToClipboard(location.href));
    const kakaoBtn = document.getElementById('kakaoShareBtn');
    kakaoBtn?.addEventListener('click', ()=>{
      alert('카카오 공유는 SDK 키 연동 후 가능합니다.');
    });
  }

  async function copyToClipboard(text){
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      alert('복사되었습니다.');
    }
  }

  // bootstrap
  window.addEventListener('DOMContentLoaded', async ()=>{
    setHeroImage(await findSingleHeaderImage());
    renderCalendar();
    setupMap();
    buildGallery();
    setupModals();
    renderContacts();
    renderAccounts();
    setupShare();
  });
})();


