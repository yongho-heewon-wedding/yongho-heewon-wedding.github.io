(function(){
  const headerDir = './pictures/header/';
  const galleryDir = './pictures/gallery/';

  function setHeroImage(src){
    const img = document.getElementById('heroImage');
    if (!img) return;
    img.src = src;
    img.decoding = 'async';
    img.loading = 'eager';
  }


  // Map: show location image with click to open Naver map
  function setupMap(){
    const mapContainer = document.getElementById('naverMap');
    const naverMapLink = document.getElementById('naverMapLink');
    const kakaoMapLink = document.getElementById('kakaoMapLink');
    const naverUrl = 'https://naver.me/GgW8fTWQ';
    const kakaoUrl = 'https://place.map.kakao.com/10931903';
    
    if (naverMapLink){ 
      naverMapLink.href = naverUrl; 
    }
    
    if (kakaoMapLink){ 
      kakaoMapLink.href = kakaoUrl; 
    }
    
    if (mapContainer) {
      // Create location image
      const mapImage = document.createElement('img');
      mapImage.src = './pictures/location.png';
      mapImage.alt = 'H스퀘어웨딩홀 위치';
      mapImage.style.width = '100%';
      mapImage.style.height = '100%';
      mapImage.style.objectFit = 'contain';
      mapImage.style.cursor = 'pointer';
      
      // Add click handler to open Naver map
      mapImage.addEventListener('click', () => {
        window.open(naverUrl, '_blank');
      });
      
      // Add loading placeholder
      mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: transparent; color: #666; font-size: 14px;">위치 이미지를 불러오는 중...</div>';
      
      // Load map image
      mapImage.onload = () => {
        mapContainer.innerHTML = '';
        mapContainer.appendChild(mapImage);
      };
      
      mapImage.onerror = () => {
        // Fallback: show placeholder with click to open map
        mapContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: transparent; color: #666; cursor: pointer;" onclick="window.open('${naverUrl}', '_blank')">
            <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
            <div style="font-size: 14px; text-align: center;">
              <div>H스퀘어웨딩홀</div>
              <div style="font-size: 12px; margin-top: 4px;">지도를 보려면 클릭하세요</div>
            </div>
          </div>
        `;
      };
    }
  }

  // Gallery state
  let galleryImages = [];
  let currentImageIndex = 0;
  let showAllImages = false;
  let galleryPreloaded = false; // 갤러리 미리 로딩 상태
  
  // Touch swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwipeGesture = false;

  // Preload gallery images
  async function preloadGalleryImages() {
    if (galleryPreloaded) return;
    
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) return;
    
    // Show loading placeholder
    galleryContainer.innerHTML = '<div class="gallery-loading">사진을 불러오는 중...</div>';
    
    const loadedImages = [];
    
    // Load zero-padded jpgs sequentially (01.jpg, 02.jpg, ...) until first missing file
    for (let i = 1;; i++) {
      const name = i.toString().padStart(2, '0') + '.jpg';
      const src = galleryDir + name;
      const exists = await imageExists(src);
      if (!exists) break;
      
      galleryImages.push(src);
      
      // Create image element and preload
      const img = new Image();
      img.loading = 'eager'; // 즉시 로딩
      img.decoding = 'async';
      img.src = src;
      img.alt = `갤러리 이미지 ${i}`;
      
      // Promise로 로딩 완료 대기
      const loadPromise = new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
      
      loadedImages.push(loadPromise);
    }
    
    // 모든 이미지 로딩 완료 대기
    const images = await Promise.all(loadedImages);
    
    // 갤러리 컨테이너 초기화
    galleryContainer.innerHTML = '';
    
    // 로딩된 이미지들을 DOM에 추가 (숨김 상태)
    images.forEach((img, index) => {
      if (img) {
        const item = document.createElement('div');
        item.className = 'item';
        if (index >= 9) item.classList.add('hidden');
        
        // Add click handler for lightbox
        item.addEventListener('click', () => openLightbox(index));
        
        item.appendChild(img);
        galleryContainer.appendChild(item);
      }
    });
    
    galleryPreloaded = true;
    
    // Show more button if there are more than 9 images
    const moreButton = document.getElementById('moreButton');
    if (galleryImages.length > 9 && moreButton) {
      moreButton.style.display = 'block';
      moreButton.addEventListener('click', showAllGalleryImages);
    }
  }

  // Build gallery by probing existing images in gallery directory
  async function buildGallery(){
    // 이미 미리 로딩된 경우 스킵
    if (galleryPreloaded) return;
    
    await preloadGalleryImages();
  }

  // Show all gallery images
  function showAllGalleryImages(){
    const items = document.querySelectorAll('.gallery .item');
    items.forEach(item => item.classList.remove('hidden'));
    
    const moreButton = document.getElementById('moreButton');
    if (moreButton) {
      moreButton.style.display = 'none';
    }
    
    showAllImages = true;
  }

  // Lightbox functions
  function openLightbox(index){
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    if (!lightbox || !lightboxImage) return;
    
    lightboxImage.src = galleryImages[index];
    lightboxCounter.textContent = `${index + 1} / ${galleryImages.length}`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function showNextImage(){
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    if (lightboxImage) lightboxImage.src = galleryImages[currentImageIndex];
    if (lightboxCounter) lightboxCounter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
  }

  function showPrevImage(){
    currentImageIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');
    
    if (lightboxImage) lightboxImage.src = galleryImages[currentImageIndex];
    if (lightboxCounter) lightboxCounter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
  }

  // Touch swipe functions
  function handleTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwipeGesture = false;
  }

  function handleTouchMove(e) {
    if (!e.touches || e.touches.length !== 1) return;
    
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
    
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    // 수평 스와이프가 수직 스와이프보다 클 때만 스와이프 제스처로 인식
    if (deltaX > deltaY && deltaX > 10) {
      isSwipeGesture = true;
      e.preventDefault(); // 스크롤 방지
    }
  }

  function handleTouchEnd(e) {
    if (!isSwipeGesture) return;
    
    const deltaX = touchEndX - touchStartX;
    const minSwipeDistance = 50; // 최소 스와이프 거리
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 오른쪽으로 스와이프 - 이전 이미지
        showPrevImage();
      } else {
        // 왼쪽으로 스와이프 - 다음 이미지
        showNextImage();
      }
    }
    
    isSwipeGesture = false;
  }

  // Setup lightbox event listeners
  function setupLightbox(){
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevImage);
    if (lightboxNext) lightboxNext.addEventListener('click', showNextImage);
    
    // Close on backdrop click
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
      
      // Touch swipe events for mobile
      lightbox.addEventListener('touchstart', handleTouchStart, { passive: false });
      lightbox.addEventListener('touchmove', handleTouchMove, { passive: false });
      lightbox.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      
      switch(e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          showPrevImage();
          break;
        case 'ArrowRight':
          showNextImage();
          break;
      }
    });
  }

  function imageExists(src){
    return new Promise((resolve)=>{
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      // cache-bust in case of aggressive caching during local dev
      probe.src = src + '?v=' + Date.now();
    });
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

  // Bottom actions are static at the end of the page now; no scroll logic needed

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
      { label: '', name: 'H스퀘어웨딩홀', phone: '02-000-0000' }
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
    
    // 신랑측 계좌 정보
    const groomAccounts = [
      { owner: '신랑 송용호', bank: '국민은행', number: '000000-00-000000' },
      { owner: '신랑 아버지 송재진', bank: '하나은행', number: '000-000000-00000' },
      { owner: '신랑 어머니 이특재', bank: '신한은행', number: '000-000-000000' }
    ];
    
    // 신부측 계좌 정보
    const brideAccounts = [
      { owner: '신부 배희원', bank: '우리은행', number: '0000-000-000000' },
      { owner: '신부 아버지 배우철', bank: '국민은행', number: '000000-00-000000' },
      { owner: '신부 어머니 이은영', bank: '하나은행', number: '000-000000-00000' }
    ];
    
    // 신랑측 섹션
    const groomSection = document.createElement('div');
    groomSection.className = 'account-section';
    
    const groomTitle = document.createElement('h4');
    groomTitle.textContent = '신랑측';
    groomTitle.className = 'account-section-title';
    groomSection.appendChild(groomTitle);
    
    const groomList = document.createElement('ul');
    groomList.className = 'account-sub-list';
    
    for (const a of groomAccounts){
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${a.owner} · ${a.bank} ${a.number}`;
      const actions = document.createElement('div');
      actions.className = 'account-actions';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-outline';
      copyBtn.textContent = '복사';
      copyBtn.addEventListener('click', ()=> copyToClipboard(a.number));
      actions.appendChild(copyBtn);
      li.appendChild(span); li.appendChild(actions);
      groomList.appendChild(li);
    }
    
    groomSection.appendChild(groomList);
    list.appendChild(groomSection);
    
    // 신부측 섹션
    const brideSection = document.createElement('div');
    brideSection.className = 'account-section';
    
    const brideTitle = document.createElement('h4');
    brideTitle.textContent = '신부측';
    brideTitle.className = 'account-section-title';
    brideSection.appendChild(brideTitle);
    
    const brideList = document.createElement('ul');
    brideList.className = 'account-sub-list';
    
    for (const a of brideAccounts){
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${a.owner} · ${a.bank} ${a.number}`;
      const actions = document.createElement('div');
      actions.className = 'account-actions';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-outline';
      copyBtn.textContent = '복사';
      copyBtn.addEventListener('click', ()=> copyToClipboard(a.number));
      actions.appendChild(copyBtn);
      li.appendChild(span); li.appendChild(actions);
      brideList.appendChild(li);
    }
    
    brideSection.appendChild(brideList);
    list.appendChild(brideSection);
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
      showToast('복사되었습니다.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('복사되었습니다.');
    }
  }

  function showToast(message) {
    // 기존 토스트가 있다면 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // DOM에 추가
    document.body.appendChild(toast);
    
    // 애니메이션을 위해 약간의 지연 후 표시
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 2초 후 제거
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // Scroll Animation
  function setupScrollAnimation() {
    const animatedElements = document.querySelectorAll('.scroll-animate');
    
    // 사용자가 애니메이션 감소를 선호하는지 확인
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // 애니메이션 감소를 선호하는 경우 모든 요소를 즉시 표시
      animatedElements.forEach(element => {
        element.classList.add('animate');
      });
      // 갤러리도 미리 로딩하고 즉시 표시
      preloadGalleryImages().then(() => {
        const galleryItems = document.querySelectorAll('.gallery .item');
        galleryItems.forEach(item => {
          item.classList.add('animate');
        });
      });
      return;
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          
          // 갤러리 섹션에 도달했을 때 미리 로딩된 이미지들 표시
          if (entry.target.id === 'gallery') {
            preloadGalleryImages().then(() => {
              const galleryItems = document.querySelectorAll('.gallery .item');
              galleryItems.forEach((item, index) => {
                setTimeout(() => {
                  item.classList.add('animate');
                }, index * 100); // 100ms delay between each item
              });
            });
          }
          
          // 애니메이션 완료 후 관찰 중단 (성능 최적화)
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe all animated elements
    animatedElements.forEach(element => {
      observer.observe(element);
    });
    
    // 갤러리 섹션이 뷰포트에 들어오기 전에 미리 로딩 시작
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
      const preloadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !galleryPreloaded) {
            // 갤러리 섹션이 뷰포트에 들어오기 시작하면 미리 로딩
            preloadGalleryImages();
            preloadObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0,
        rootMargin: '200px 0px 0px 0px' // 갤러리 섹션보다 200px 위에서 미리 로딩 시작
      });
      
      preloadObserver.observe(gallerySection);
    }
  }

  // bootstrap
  window.addEventListener('DOMContentLoaded', async ()=>{
    // Directly set expected hero image path per project convention
    setHeroImage(headerDir + 'main_image.png?v=' + Date.now());
    setupMap();
    // buildGallery()는 스크롤 애니메이션에서 처리하므로 여기서는 제거
    setupModals();
    setupLightbox();
    renderContacts();
    renderAccounts();
    setupShare();
    setupScrollAnimation();
    // bottom actions are static; nothing to init
  });
})();


