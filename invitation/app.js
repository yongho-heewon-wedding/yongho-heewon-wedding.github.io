(function(){
  const headerDir = './pictures/header/';
  const galleryDir = './pictures/gallery/';
  const galleryManifest = [
  '01.jpg','02.jpg','03.jpg','04.jpg','05.jpg',
  '06.jpg','07.jpg','08.jpg','09.jpg','10.jpg','11.jpg','12.jpg','13.jpg','14.jpg','15.jpg'
  ];

  // Resource loading tracker
  // 리소스가 로드된 비율을 추적하여 로딩 스크린을 숨김
  let resourceTracker = {
    resources: new Map(),
    loadedCount: 0,
    totalCount: 0,
    threshold: 0.85, // 85% 로드되면 숨김 (0.8 = 80%, 0.9 = 90%로 조정 가능)
    minDisplayTime: 1000, // 최소 1초 표시 (로딩 애니메이션을 위한 최소 시간)
    startTime: null,
    onProgress: null
  };

  function trackResource(url, name) {
    if (resourceTracker.resources.has(url)) return;
    
    resourceTracker.totalCount++;
    resourceTracker.resources.set(url, { name, loaded: false });
    
    const img = new Image();
    
    img.onload = () => {
      if (!resourceTracker.resources.get(url)?.loaded) {
        resourceTracker.resources.set(url, { name, loaded: true });
        resourceTracker.loadedCount++;
        checkLoadingProgress();
      }
    };
    img.onerror = () => {
      // 에러가 발생해도 로드된 것으로 간주 (빠른 진행을 위해)
      if (!resourceTracker.resources.get(url)?.loaded) {
        resourceTracker.resources.set(url, { name, loaded: true });
        resourceTracker.loadedCount++;
        checkLoadingProgress();
      }
    };
    
    // src 설정 후, 이미 캐시된 이미지는 즉시 onload가 호출됨
    img.src = url;
  }

  function checkLoadingProgress() {
    const progress = resourceTracker.loadedCount / resourceTracker.totalCount;
    
    if (resourceTracker.onProgress) {
      resourceTracker.onProgress(progress);
    }
    
    // 85% 이상 로드되고, 최소 표시 시간이 지났으면 숨김
    if (progress >= resourceTracker.threshold) {
      const elapsed = Date.now() - resourceTracker.startTime;
      const remainingTime = Math.max(0, resourceTracker.minDisplayTime - elapsed);
      
      setTimeout(() => {
        hideLoadingScreen();
      }, remainingTime);
    }
  }

  function setHeroImage(src){
    const img = document.getElementById('heroImage');
    if (!img) return;
    
    img.decoding = 'async';
    img.loading = 'eager';
    img.fetchPriority = 'high'; // 히어로 이미지는 최우선
    // 이미지 완전 로드 후에도 메모리 유지
    img.onload = () => {
      img.setAttribute('data-loaded', 'true');
    };
    img.src = src;
  }

  // Loading Screen Functions
  async function loadLoadingSVG() {
    const loadingContent = document.getElementById('loadingContent');
    if (!loadingContent) return;
    
    try {
      const response = await fetch('./pictures/bae_song.svg');
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // SVG 요소에 클래스 추가
      svgElement.classList.add('loading-svg');
      
      // viewBox가 없으면 기본값 설정
      if (!svgElement.getAttribute('viewBox')) {
        const width = svgElement.getAttribute('width') || '200';
        const height = svgElement.getAttribute('height') || '200';
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      // SVG를 먼저 DOM에 추가
      loadingContent.appendChild(svgElement);
      
      // DOM에 추가한 후 애니메이션 적용 (getBBox() 등이 제대로 작동하도록)
      requestAnimationFrame(() => {
        const strokeElements = svgElement.querySelectorAll('path, circle, ellipse, line, polyline, polygon, rect');
        strokeElements.forEach((el, index) => {
          if (el.getAttribute('stroke') || el.getAttribute('stroke-width')) {
            let pathLength = 1000; // 기본값
            if (el.tagName === 'path' && typeof el.getTotalLength === 'function') {
              pathLength = el.getTotalLength();
            } else {
              try {
                // 다른 요소들의 경우 대략적인 길이 계산
                const bbox = el.getBBox();
                pathLength = (bbox.width + bbox.height) * 2;
              } catch (e) {
                // getBBox() 실패 시 기본값 사용
                pathLength = 1000;
              }
            }
            el.style.strokeDasharray = pathLength;
            el.style.strokeDashoffset = pathLength;
            el.style.animation = `draw 2s ease-in-out forwards`;
            el.style.animationDelay = `${index * 0.15}s`;
          }
        });
      });

      // Create loading text SVG
      createLoadingText();
    } catch (error) {
      console.error('Failed to load loading SVG:', error);
      // SVG 로드 실패 시 기본 텍스트 표시
      loadingContent.innerHTML = '<div style="font-size: 24px; color: #666;">Loading...</div>';
    }
  }

  function createLoadingText() {
    const loadingTextWrapper = document.getElementById('loadingTextWrapper');
    if (!loadingTextWrapper) return;

    // Create SVG element for text
    const textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    textSvg.setAttribute('class', 'loading-text-svg');
    textSvg.setAttribute('viewBox', '0 0 200 60');
    textSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Create text element with stroke
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', '100');
    textElement.setAttribute('y', '35');
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('dominant-baseline', 'middle');
    textElement.textContent = 'Loading...';

    textSvg.appendChild(textElement);
    loadingTextWrapper.appendChild(textSvg);

    // Apply stroke animation after DOM insertion
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let pathLength = 500; // 기본값
        
        try {
          // 텍스트의 실제 길이를 계산하기 위해 경로 생성
          const bbox = textElement.getBBox();
          // 텍스트의 대략적인 stroke 길이 계산
          // 각 글자마다 약간의 여유를 두고 계산
          pathLength = bbox.width * 2.5 + 100;
        } catch (e) {
          pathLength = 500;
        }
        
        // stroke-dasharray와 stroke-dashoffset 설정
        textElement.style.strokeDasharray = pathLength;
        textElement.style.strokeDashoffset = pathLength;
        textElement.style.animation = 'draw 2s ease-in-out forwards';
        textElement.style.animationDelay = '1s';
      });
    });
  }
  
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.parentNode.removeChild(loadingScreen);
        }
      }, 500); // CSS transition 시간과 맞춤
    }
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
      mapImage.loading = 'lazy';
      mapImage.decoding = 'async';
      mapImage.src = './pictures/location.png';
      mapImage.alt = 'H스퀘어웨딩홀 위치';
      mapImage.style.width = '100%';
      mapImage.style.height = '100%';
      mapImage.style.objectFit = 'contain';
      mapImage.style.cursor = 'pointer';
      // 이미지 로드 완료 추적
      mapImage.onload = () => {
        mapImage.setAttribute('data-loaded', 'true');
      };
      
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
  let galleryPreloadPromise = null; // 중복 호출 방지용 단일 플라이트
  
  // Touch swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isSwipeGesture = false;

  // Preload/build gallery from static manifest (single-flight, no 중복 요청)
  async function preloadGalleryImages() {
    if (galleryPreloaded) return;
    if (galleryPreloadPromise) { await galleryPreloadPromise; return; }

    const runPreload = async () => {
      const galleryContainer = document.getElementById('galleryContainer');
      if (!galleryContainer) return;

      // Show loading placeholder
      galleryContainer.innerHTML = '<div class="gallery-loading">사진을 불러오는 중...</div>';

      // Build from manifest without any probing
      galleryImages = galleryManifest.map(name => galleryDir + name);

      // 갤러리 컨테이너 초기화
      galleryContainer.innerHTML = '';

      // 모든 이미지가 로드될 때까지 Promise 배열 생성
      const imageLoadPromises = galleryImages.map((src, index) => {
        return new Promise((resolve) => {
          const img = new Image();
          // 성능 최적화: lazy loading 사용하여 메모리 효율성 향상
          // 하지만 네트워크 캐시는 미리 준비되므로 빠르게 로드됨
          img.loading = 'lazy';
          img.decoding = 'async';
          // 이미지가 완전히 로드된 후에도 유지되도록 설정
          img.fetchPriority = index < 6 ? 'high' : 'auto'; // 처음 6개는 우선순위 높게
          
          // 이미지 완전 로드 후 메모리 유지를 위한 이벤트 리스너
          const markAsLoaded = () => {
            // 이미지가 완전히 디코딩되었음을 표시
            if (!img.complete) return;
            // 이미지 요소에 데이터 속성 추가로 추적 가능하게
            img.setAttribute('data-loaded', 'true');
            resolve();
          };
          
          img.onload = markAsLoaded;
          img.onerror = () => resolve(); // 에러가 발생해도 resolve (빠른 진행을 위해)
          
          // src 설정 (네트워크 요청 시작)
          img.src = src;
          img.alt = `갤러리 이미지 ${index + 1}`;
          
          // 이미지가 이미 캐시에 있으면 즉시 로드 완료
          if (img.complete) {
            markAsLoaded();
          }
          
          const item = document.createElement('div');
          item.className = 'item';
          item.setAttribute('data-index', index);
          item.addEventListener('click', () => openLightbox(index));
          item.appendChild(img);
          galleryContainer.appendChild(item);
          
          // 모든 이미지가 표시되도록 hidden 클래스가 없어야 함 (초기화)
          item.classList.remove('hidden');
        });
      });

      // 모든 이미지가 로드될 때까지 대기 (타임아웃 추가)
      await Promise.allSettled(imageLoadPromises);

      galleryPreloaded = true;

      // 모든 이미지가 표시되도록 확인
      showAllGalleryImages();

      // 갤러리 섹션 애니메이션은 setupScrollAnimation에서 처리하므로 여기서는 처리하지 않음
      // 더보기 버튼 사용 안 함
    };

    galleryPreloadPromise = runPreload();
    await galleryPreloadPromise;
    galleryPreloadPromise = null;
  }

  // 갤러리 이미지를 화면에 붙이지 않고 네트워크/디코딩 캐시만 미리 데우기
  function warmCacheGalleryImages(){
    // DOM 생성 프리로드가 이미 진행/완료 중이면 중복 프리로드 불필요
    if (galleryPreloadPromise || galleryPreloaded) return;
    galleryManifest.forEach((name, index) => {
      const img = new Image();
      img.decoding = 'async';
      // 처음 몇 개는 높은 우선순위로 로드
      img.fetchPriority = index < 3 ? 'high' : 'auto';
      // 이미지 로드 완료 추적
      img.onload = () => {
        img.setAttribute('data-cached', 'true');
      };
      img.src = galleryDir + name;
    });
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

  // 더 이상 별도 존재 확인이 필요 없음 (정적 매니페스트 사용)
  function imageExists(){}

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
      { label: '신랑', name: '송용호', phone: '010-7745-5399' },
      { label: '신부', name: '배희원', phone: '010-3865-5728' },
      { label: '신랑 아버지', name: '송재진', phone: '010-8346-5399' },
      { label: '신랑 어머니', name: '이특재', phone: '010-2478-5399' },
      { label: '신부 아버지', name: '배우철', phone: '010-7748-5728' },
      { label: '신부 어머니', name: '이은영', phone: '010-2417-5728' },
      { label: '', name: 'H스퀘어웨딩홀', phone: '02-2299-9999' }
    ];
    const boldNames = ['송용호', '배희원', '송재진', '이특재', '배우철', '이은영'];
    for (const c of contacts){
      const li = document.createElement('li');
      const left = document.createElement('span');
      const shouldBold = boldNames.includes(c.name);
      if (shouldBold) {
        left.innerHTML = `${c.label} <strong>${c.name}</strong>`;
      } else {
        left.textContent = `${c.label} ${c.name}`;
      }
      const right = document.createElement('a');
      right.href = `tel:${c.phone.replace(/[^0-9+]/g,'')}`;
      right.textContent = c.phone;
      li.appendChild(left); li.appendChild(right);
      list.appendChild(li);
    }
  }

  function renderAccounts(){
    const groomList = document.getElementById('groomAccountList');
    const brideList = document.getElementById('brideAccountList');
    
    // 신랑측 계좌 정보
    const groomAccounts = [
      { owner: '신랑 송용호', bank: '하나', number: '362-890-415-89807' },
      { owner: '아버지 송재진', bank: '하나', number: '117-18-22335-2' },
      { owner: '어머니 이특재', bank: '국민', number: '838-240-162265' }
    ];
    
    // 신부측 계좌 정보
    const brideAccounts = [
      { owner: '신부 배희원', bank: '신한', number: '110-216-799581' },
      { owner: '아버지 배우철', bank: '농협', number: '352-1660-1174-93' },
      { owner: '어머니 이은영', bank: '신한', number: '110-209-552110' }
    ];
    
    const boldNames = ['송용호', '배희원', '송재진', '이특재', '배우철', '이은영'];
    
    // 신랑측 계좌 목록 렌더링
    if (groomList) {
      for (const a of groomAccounts){
        const li = document.createElement('li');
        const span = document.createElement('span');
        // owner에서 이름 추출 및 bold 처리
        let ownerText = a.owner;
        for (const name of boldNames) {
          if (ownerText.includes(name)) {
            ownerText = ownerText.replace(name, `<strong>${name}</strong>`);
            break;
          }
        }
        span.innerHTML = `${ownerText} · ${a.bank} ${a.number}`;
        const actions = document.createElement('div');
        actions.className = 'account-actions';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-outline';
        copyBtn.textContent = '복사';
        copyBtn.addEventListener('click', ()=> copyToClipboard(a.number));
        actions.appendChild(copyBtn);
        li.appendChild(span);
        li.appendChild(actions);
        groomList.appendChild(li);
      }
    }
    
    // 신부측 계좌 목록 렌더링
    if (brideList) {
      for (const a of brideAccounts){
        const li = document.createElement('li');
        const span = document.createElement('span');
        // owner에서 이름 추출 및 bold 처리
        let ownerText = a.owner;
        for (const name of boldNames) {
          if (ownerText.includes(name)) {
            ownerText = ownerText.replace(name, `<strong>${name}</strong>`);
            break;
          }
        }
        span.innerHTML = `${ownerText} · ${a.bank} ${a.number}`;
        const actions = document.createElement('div');
        actions.className = 'account-actions';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-outline';
        copyBtn.textContent = '복사';
        copyBtn.addEventListener('click', ()=> copyToClipboard(a.number));
        actions.appendChild(copyBtn);
        li.appendChild(span);
        li.appendChild(actions);
        brideList.appendChild(li);
      }
    }
  }

  function setupAccountSlides(){
    const groomBtn = document.getElementById('groomAccountBtn');
    const brideBtn = document.getElementById('brideAccountBtn');
    const groomContent = document.getElementById('groomAccountContent');
    const brideContent = document.getElementById('brideAccountContent');
    
    if (!groomBtn || !brideBtn || !groomContent || !brideContent) return;
    
    function setContentHeight(content, isExpanding){
      // transition 일시 중지하고 높이 계산
      content.style.transition = 'none';
      
      if (isExpanding) {
        // 확장: 먼저 auto로 설정하여 실제 높이 계산
        content.style.height = 'auto';
        const height = content.scrollHeight;
        content.style.height = '0';
        
        // 다음 프레임에서 애니메이션 시작
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.transition = '';
            content.style.height = height + 'px';
          });
        });
      } else {
        // 축소: 현재 높이에서 0으로
        const height = content.scrollHeight;
        content.style.height = height + 'px';
        
        requestAnimationFrame(() => {
          content.style.transition = '';
          content.style.height = '0';
        });
      }
    }
    
    function toggleAccountSlide(targetBtn, targetContent, otherBtn, otherContent){
      const isExpanded = targetContent.classList.contains('expanded');
      
      // 다른 슬라이드 닫기
      if (otherContent.classList.contains('expanded')) {
        // active 클래스를 먼저 제거하여 스타일이 즉시 적용되도록
        otherBtn.classList.remove('active');
        otherBtn.setAttribute('aria-expanded', 'false');
        setContentHeight(otherContent, false);
        otherContent.classList.remove('expanded');
        
        // 애니메이션 완료 후 높이 초기화
        setTimeout(() => {
          if (!otherContent.classList.contains('expanded')) {
            otherContent.style.height = '';
          }
        }, 350);
      }
      
      // 현재 슬라이드 토글
      if (isExpanded) {
        // active 클래스를 먼저 제거하여 스타일이 즉시 적용되도록
        targetBtn.classList.remove('active');
        targetBtn.setAttribute('aria-expanded', 'false');
        setContentHeight(targetContent, false);
        targetContent.classList.remove('expanded');
        
        setTimeout(() => {
          if (!targetContent.classList.contains('expanded')) {
            targetContent.style.height = '';
          }
        }, 350);
      } else {
        targetContent.classList.add('expanded');
        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-expanded', 'true');
        setContentHeight(targetContent, true);
        
        // 애니메이션 완료 후 auto로 설정
        setTimeout(() => {
          if (targetContent.classList.contains('expanded')) {
            targetContent.style.height = 'auto';
          }
        }, 350);
      }
    }
    
    groomBtn.addEventListener('click', () => {
      toggleAccountSlide(groomBtn, groomContent, brideBtn, brideContent);
    });
    
    brideBtn.addEventListener('click', () => {
      toggleAccountSlide(brideBtn, brideContent, groomBtn, groomContent);
    });
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
      // 갤러리도 미리 로딩하고 동시에 표시
      preloadGalleryImages().then(() => {
        // 모든 이미지가 로드된 후, 모든 갤러리 이미지를 동시에 나타나도록 함
        requestAnimationFrame(() => {
          const galleryItems = document.querySelectorAll('.gallery .item');
          galleryItems.forEach(item => {
            item.classList.add('animate');
          });
        });
      });
      return;
    }
    
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    // 애니메이션이 적용된 요소 추적 (중복 애니메이션 방지)
    const animatedSet = new Set();
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 이미 애니메이션이 적용된 요소는 스킵
          if (!animatedSet.has(entry.target)) {
            entry.target.classList.add('animate');
            animatedSet.add(entry.target);
          }
          
          // 갤러리 섹션에 도달했을 때 미리 로딩된 이미지들 표시
          if (entry.target.id === 'gallery') {
            preloadGalleryImages().then(() => {
              // 모든 이미지가 로드된 후, 모든 갤러리 이미지를 동시에 나타나도록 함
              // requestAnimationFrame을 사용하여 한 프레임에 모두 적용
              requestAnimationFrame(() => {
                const galleryItems = document.querySelectorAll('.gallery .item');
                galleryItems.forEach((item) => {
                  if (!item.classList.contains('animate')) {
                    item.classList.add('animate');
                  }
                });
              });
            });
          }
        } else {
          // 뷰포트를 벗어났을 때: 이미지가 메모리에 유지되도록 하고
          // 애니메이션은 제거하지 않음 (이미 보여진 상태 유지)
          // 단, 클래스는 유지하여 재진입 시 부드럽게 처리
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
    
    // 갤러리 이미지 개별 관찰 - 이미 로드된 이미지가 다시 보일 때 즉시 표시
    const galleryImageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img');
          if (img && img.getAttribute('data-loaded') === 'true') {
            // 이미 로드된 이미지는 즉시 표시
            entry.target.classList.add('animate');
          } else if (img && !img.complete) {
            // 아직 로드 중인 이미지는 완료 후 표시
            const loadHandler = () => {
              entry.target.classList.add('animate');
              img.removeEventListener('load', loadHandler);
            };
            img.addEventListener('load', loadHandler);
            // 이미 로드 중이면 즉시 확인
            if (img.complete) {
              loadHandler();
            }
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px 0px 50px 0px'
    });
    
    // 갤러리 이미지 관찰은 이미지가 생성된 후에 시작
    const observeGalleryImages = () => {
      const galleryItems = document.querySelectorAll('.gallery .item');
      galleryItems.forEach(item => {
        galleryImageObserver.observe(item);
      });
    };
    
    // 갤러리 로드 완료 후 관찰 시작
    if (galleryPreloaded) {
      observeGalleryImages();
    } else {
      // 갤러리 로드 대기 후 관찰 시작
      const checkInterval = setInterval(() => {
        const galleryItems = document.querySelectorAll('.gallery .item');
        if (galleryItems.length > 0) {
          observeGalleryImages();
          clearInterval(checkInterval);
        }
      }, 100);
      
      // 5초 후 타임아웃
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }

  // Start tracking all resources
  function startResourceTracking() {
    resourceTracker.startTime = Date.now();
    
    // Hero 이미지
    const heroImageSrc = headerDir + 'main_image.png';
    trackResource(heroImageSrc, 'Hero Image');
    
    // 갤러리 이미지들 (15개)
    galleryManifest.forEach(name => {
      trackResource(galleryDir + name, `Gallery ${name}`);
    });
    
    // 페이지 내 이미지들
    trackResource('./pictures/calendar.png', 'Calendar Image');
    trackResource('./pictures/location.png', 'Location Image');
    trackResource('./pictures/qna.png', 'Q&A Image');
    trackResource('./pictures/thanks.png', 'Thanks Image');
    trackResource('./pictures/bottom/bae_song.jpeg', 'Bottom Emblem');
    trackResource('./pictures/maplogo/naver_map.png', 'Naver Map Logo');
    trackResource('./pictures/maplogo/kakao_map.png', 'Kakao Map Logo');
    trackResource('./pictures/maplogo/t_map.png', 'T Map Logo');
    
    // CSS 파일 로딩 체크 (1개 리소스로 카운트)
    let cssTracked = false;
    resourceTracker.totalCount++;
    
    const checkCSSLoaded = () => {
      if (cssTracked) return;
      
      const stylesheets = Array.from(document.styleSheets);
      const loaded = stylesheets.some(sheet => {
        try {
          return sheet.cssRules || sheet.rules;
        } catch (e) {
          return false;
        }
      });
      
      if (loaded) {
        cssTracked = true;
        resourceTracker.loadedCount++;
        checkLoadingProgress();
        return true;
      }
      return false;
    };
    
    // 즉시 확인
    if (!checkCSSLoaded()) {
      // CSS 로드 대기
      const cssInterval = setInterval(() => {
        if (checkCSSLoaded()) {
          clearInterval(cssInterval);
        }
      }, 100);
      
      // 2초 후 타임아웃
      setTimeout(() => {
        clearInterval(cssInterval);
        if (!cssTracked) {
          cssTracked = true;
          resourceTracker.loadedCount++;
          checkLoadingProgress();
        }
      }, 2000);
    }
    
    // 폰트 파일 로딩 체크 (1개 리소스로 카운트)
    let fontTracked = false;
    resourceTracker.totalCount++;
    
    const markFontLoaded = () => {
      if (!fontTracked) {
        fontTracked = true;
        resourceTracker.loadedCount++;
        checkLoadingProgress();
      }
    };
    
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        markFontLoaded();
      }).catch(() => {
        markFontLoaded(); // 실패해도 완료로 간주
      });
      
      // 폰트 로드 타임아웃 (3초)
      setTimeout(() => {
        markFontLoaded();
      }, 3000);
    } else {
      // 폰트 API를 지원하지 않으면 즉시 완료
      markFontLoaded();
    }
    
    // Fallback: 최대 5초 후에도 85% 미만이면 강제로 숨김
    setTimeout(() => {
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        hideLoadingScreen();
      }
    }, 5000);
  }

  // bootstrap
  window.addEventListener('DOMContentLoaded', async ()=>{
    // Load loading SVG first
    await loadLoadingSVG();
    
    // 리소스 추적 시작
    startResourceTracking();
    
    // Directly set expected hero image path per project convention
    setHeroImage(headerDir + 'main_image.png?v=' + Date.now());
    setupMap();
    // buildGallery()는 스크롤 애니메이션에서 처리하므로 여기서는 제거
    setupModals();
    setupLightbox();
    renderContacts();
    renderAccounts();
    setupAccountSlides();
    setupShare();
    setupScrollAnimation();
    // 갤러리 이미지를 미리 내려받아 캐시만 데워두기 (표시는 스크롤 시점에 수행)
    warmCacheGalleryImages();
    // bottom actions are static; nothing to init
  });
})();


