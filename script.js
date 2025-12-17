document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    const hasGSAP = typeof gsap !== 'undefined';
    if (hasGSAP) {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    const navClose = document.querySelector('.nav-close');
    const navOverlay = document.querySelector('.nav-overlay');

    const closeDropdowns = (exception) => {
        dropdowns.forEach(dropdown => {
            if (dropdown === exception) return;
            dropdown.classList.remove('open');
            dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
    };

    const setMenuState = (shouldOpen) => {
        if (!navLinks) return;
        navLinks.classList.toggle('active', shouldOpen);
        navOverlay?.classList.toggle('active', shouldOpen);
        navClose?.classList.toggle('active', shouldOpen);
        document.body.classList.toggle('nav-open', shouldOpen);
        const icon = hamburger?.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !shouldOpen);
            icon.classList.toggle('fa-times', shouldOpen);
        }
        if (shouldOpen) {
            if (hasGSAP) {
                gsap.fromTo('.nav-links li',
                    { opacity: 0, x: 20 },
                    { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }
                );
            }
        } else {
            closeDropdowns();
        }
    };

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const shouldOpen = !navLinks.classList.contains('active');
            setMenuState(shouldOpen);
        });
    }

    navClose?.addEventListener('click', () => setMenuState(false));
    navOverlay?.addEventListener('click', () => setMenuState(false));

    navLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                if (link.classList.contains('dropdown-toggle')) {
                    return;
                }
                setMenuState(false);
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks?.classList.contains('active')) {
            setMenuState(false);
        }
    });

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (!toggle) return;

        const toggleDropdown = () => {
            const willOpen = !dropdown.classList.contains('open');
            closeDropdowns(dropdown);
            dropdown.classList.toggle('open', willOpen);
            toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        };

        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            toggleDropdown();
        });

        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDropdown();
            } else if (event.key === 'Escape') {
                closeDropdowns();
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-dropdown')) {
            closeDropdowns();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDropdowns();
        }
    });

    const revealFrom = (target, options) => {
        if (!hasGSAP) return;
        gsap.from(target, {
            immediateRender: false,
            ...options
        });
    };

    // Hero Animations
    if (hasGSAP) {
        const tl = gsap.timeline();

        tl.from('.hero-overlay', {
            duration: 1.5,
            opacity: 0,
            ease: 'power2.out'
        })
            .from('.hero-title', {
                y: 30,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)'
            }, '-=0.6')
            .from('.hero-btns a', {
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2
            }, '-=0.6');

        if (document.querySelector('.hero')) {
            gsap.to('.hero-content', {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                y: 80,
                opacity: 0.6
            });

            gsap.to('.hero-overlay', {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                opacity: 0.85
            });
        }
    }

    // Hero Slider
    const hero = document.querySelector('.hero');
    const sliderElement = document.querySelector('.hero-slider');
    const slides = Array.from(document.querySelectorAll('.hero-slide'));
    const prevControl = document.querySelector('.hero-prev');
    const nextControl = document.querySelector('.hero-next');
    const dotsContainer = document.querySelector('.hero-dots');
    let heroDots = [];
    let activeSlide = 0;
    let slideInterval;
    const autoplayEnabled = sliderElement?.dataset.autoplay !== 'false';
    const autoplayInterval = Number(sliderElement?.dataset.interval) || 6000;
    const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const canAutoplay = () => autoplayEnabled && !(prefersReducedMotion && prefersReducedMotion.matches);
    const swipeState = {
        activePointer: null,
        startX: 0,
        deltaX: 0,
        isDragging: false
    };
    const SWIPE_THRESHOLD = 50;

    const renderDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        heroDots = slides.map((_, idx) => {
            const dot = document.createElement('button');
            dot.className = 'hero-dot';
            dot.type = 'button';
            dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
            dot.addEventListener('click', () => {
                goToSlide(idx);
                restartAutoplay();
            });
            dotsContainer.appendChild(dot);
            return dot;
        });
    };

    const updateDots = () => {
        if (!heroDots.length) return;
        heroDots.forEach((dot, idx) => {
            const isActive = idx === activeSlide;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    };

    const goToSlide = (index) => {
        if (!slides.length) return;
        slides[activeSlide]?.classList.remove('active');
        activeSlide = (index + slides.length) % slides.length;
        slides[activeSlide]?.classList.add('active');
        updateDots();
    };

    const nextSlide = () => goToSlide(activeSlide + 1);
    const prevSlide = () => goToSlide(activeSlide - 1);

    const startAutoplay = () => {
        if (!canAutoplay() || slideInterval || slides.length <= 1) return;
        slideInterval = setInterval(nextSlide, autoplayInterval);
    };

    const stopAutoplay = () => {
        if (!slideInterval) return;
        clearInterval(slideInterval);
        slideInterval = null;
    };

    const restartAutoplay = () => {
        if (!canAutoplay()) return;
        stopAutoplay();
        startAutoplay();
    };

    if (slides.length) {
        renderDots();
        goToSlide(0);
        startAutoplay();

        prevControl?.addEventListener('click', () => {
            prevSlide();
            restartAutoplay();
        });

        nextControl?.addEventListener('click', () => {
            nextSlide();
            restartAutoplay();
        });

        hero?.addEventListener('mouseenter', () => canAutoplay() && stopAutoplay());
        hero?.addEventListener('mouseleave', () => canAutoplay() && startAutoplay());
        hero?.addEventListener('focusin', () => canAutoplay() && stopAutoplay());
        hero?.addEventListener('focusout', () => canAutoplay() && startAutoplay());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoplay();
            } else if (canAutoplay()) {
                startAutoplay();
            }
        });

        prefersReducedMotion?.addEventListener('change', () => {
            if (prefersReducedMotion.matches) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        const pointerDownHandler = (event) => {
            const isInteractiveTarget = event.target.closest('.hero-controls, .hero-dots, .hero-btns a');
            if (isInteractiveTarget) return;
            if (!slides.length || swipeState.isDragging || (event.pointerType === 'mouse' && event.button !== 0)) return;
            swipeState.isDragging = true;
            swipeState.activePointer = event.pointerId;
            swipeState.startX = event.clientX;
            swipeState.deltaX = 0;
            stopAutoplay();
            sliderElement?.classList.add('is-swiping');
            hero?.setPointerCapture?.(event.pointerId);
        };

        const pointerMoveHandler = (event) => {
            if (!swipeState.isDragging || event.pointerId !== swipeState.activePointer) return;
            swipeState.deltaX = event.clientX - swipeState.startX;
        };

        const pointerUpHandler = (event) => {
            if (!swipeState.isDragging || event.pointerId !== swipeState.activePointer) return;
            sliderElement?.classList.remove('is-swiping');
            hero?.releasePointerCapture?.(event.pointerId);
            swipeState.isDragging = false;
            swipeState.activePointer = null;
            const deltaX = event.clientX - swipeState.startX;
            if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
                if (deltaX < 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            restartAutoplay();
        };

        hero?.addEventListener('pointerdown', pointerDownHandler);
        hero?.addEventListener('pointermove', pointerMoveHandler);
        hero?.addEventListener('pointerup', pointerUpHandler);
        hero?.addEventListener('pointercancel', pointerUpHandler);
    }

    // Scroll Animations for Sections

    // Section Containers
    document.querySelectorAll('.section').forEach(section => {
        const target = section.querySelector('.container') || section;
        revealFrom(target, {
            scrollTrigger: {
                trigger: section,
                start: 'top 85%',
                once: true
            },
            y: 60,
            opacity: 0,
            duration: 1
        });
    });

    // About Section
    revealFrom('.about-image', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 85%',
            once: true
        },
        x: -50,
        opacity: 0,
        duration: 1
    });

    revealFrom('.about-text', {
        scrollTrigger: {
            trigger: '.about',
            start: 'top 85%',
            once: true
        },
        x: 50,
        opacity: 0,
        duration: 1,
        delay: 0.2
    });

    // Stats Counter Animation
    if (hasGSAP) {
        const stats = document.querySelectorAll('.counter');
        stats.forEach(stat => {
            const target = +stat.getAttribute('data-target');

            ScrollTrigger.create({
                trigger: stat,
                start: 'top 90%',
                onEnter: () => {
                    gsap.to(stat, {
                        innerHTML: target,
                        duration: 2,
                        snap: { innerHTML: 1 },
                        ease: 'power1.out'
                    });
                }
            });
        });
    }

    // Academics Cards
    revealFrom('.card', {
        scrollTrigger: {
            trigger: '.academics',
            start: 'top 85%',
            once: true
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });

    // Events Animation
    revealFrom('.event-card', {
        scrollTrigger: {
            trigger: '.events',
            start: 'top 85%',
            once: true
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });

    // Blog Animation
    revealFrom('.blog-card', {
        scrollTrigger: {
            trigger: '.blog',
            start: 'top 85%',
            once: true
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });

    // Gallery
    revealFrom('.gallery-item', {
        scrollTrigger: {
            trigger: '.gallery',
            start: 'top 85%',
            once: true
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1
    });

    // Section Headers
    const headers = document.querySelectorAll('.section-header');
    headers.forEach(header => {
        revealFrom(header.children, {
            scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                once: true
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2
        });
    });

    // Gallery Lightbox
    const lightbox = document.querySelector('.lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    let currentIndex = -1;

    if (lightbox && lightboxImage && lightboxCaption && galleryItems.length) {
        const showImage = (index) => {
            const item = galleryItems[index];
            if (!item) {
                return;
            }
            currentIndex = index;
            const img = item.querySelector('img');
            const full = item.dataset.full || img.src;
            const caption = item.dataset.caption || img.alt || 'Gallery photo';
            lightboxImage.src = full;
            lightboxImage.alt = caption;
            lightboxCaption.textContent = caption;
        };

        const openLightbox = (index) => {
            showImage(index);
            lightbox.classList.add('active');
            document.body.classList.add('modal-open');
            lightbox.setAttribute('aria-hidden', 'false');
        };

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.classList.remove('modal-open');
            lightbox.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                lightboxImage.src = '';
                lightboxImage.alt = '';
                currentIndex = -1;
            }, 300);
        };

        const navigate = (direction) => {
            if (currentIndex === -1) return;
            const total = galleryItems.length;
            const nextIndex = (currentIndex + direction + total) % total;
            showImage(nextIndex);
        };

        galleryItems.forEach((item, index) => {
            const triggerOpen = () => openLightbox(index);
            item.addEventListener('click', triggerOpen);
            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    triggerOpen();
                }
            });
        });

        lightboxClose?.addEventListener('click', closeLightbox);
        prevBtn?.addEventListener('click', () => navigate(-1));
        nextBtn?.addEventListener('click', () => navigate(1));

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!lightbox.classList.contains('active')) return;
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowRight') {
                navigate(1);
            } else if (event.key === 'ArrowLeft') {
                navigate(-1);
            }
        });
    }

    // Video Modal
    const videoModal = document.querySelector('.video-modal');
    const videoModalClose = document.querySelector('.video-modal-close');
    const videoIframe = document.querySelector('.video-iframe');
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');

    if (videoModal && videoIframe && videoThumbnails.length) {
        const openVideoModal = (videoId) => {
            if (!videoId) return;
            // YouTube embed URL
            videoIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            videoModal.classList.add('active');
            document.body.classList.add('modal-open');
            videoModal.setAttribute('aria-hidden', 'false');
        };

        const closeVideoModal = () => {
            videoModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            videoModal.setAttribute('aria-hidden', 'true');
            // Stop video playback by clearing src
            setTimeout(() => {
                videoIframe.src = '';
            }, 300);
        };

        videoThumbnails.forEach(thumbnail => {
            const videoId = thumbnail.dataset.videoId;
            if (!videoId) return;

            const triggerOpen = () => openVideoModal(videoId);
            
            thumbnail.addEventListener('click', triggerOpen);
            thumbnail.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    triggerOpen();
                }
            });
        });

        videoModalClose?.addEventListener('click', closeVideoModal);

        videoModal.addEventListener('click', (event) => {
            if (event.target === videoModal) {
                closeVideoModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!videoModal.classList.contains('active')) return;
            if (event.key === 'Escape') {
                closeVideoModal();
            }
        });
    }

    // Video Section Animation
    revealFrom('.video-card', {
        scrollTrigger: {
            trigger: '.videos',
            start: 'top 85%',
            once: true
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15
    });

    // Refresh ScrollTrigger on window load to ensure correct positions
    if (hasGSAP) {
        window.addEventListener('load', () => {
            ScrollTrigger.refresh();
        });
    }
});
