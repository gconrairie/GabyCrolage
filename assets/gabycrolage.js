document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-user][data-domain]').forEach(function (el) {
        el.href = 'mailto:' + el.dataset.user + '@' + el.dataset.domain;
    });

    // ── Most Viewed Reels — rendu depuis JSON ────────────────
    // const reelsGrid = document.getElementById('most-viewed-reels');

    // fetch('data/most-viewed.json')
    //     .then(function (res) { return res.json(); })
    //     .then(function (reels) {
    //         reelsGrid.innerHTML = reels.map(function (reel) {
    //             return `<a href="${reel.url}" target="_blank" rel="noopener"
    //                 class="relative aspect-[4/5] overflow-hidden group shadow-md">
    //                 <img src="${reel.image}" alt="${reel.alt}" class="w-full h-full object-cover" />
    //                 <div class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    //                     <i class="fa-brands fa-instagram text-4xl"></i>
    //                     <span class="text-xs font-semibold">Voir le Reel</span>
    //                 </div>
    //             </a>`;
    //         }).join('');
    //     })
    //     .catch(function () {
    //         reelsGrid.innerHTML = '<p class="col-span-2 text-center text-white/40 text-sm py-4">Impossible de charger les reels.</p>';
    //     });

    // ── Sticky header : scroll-driven smooth transitions ─────
    const hero = document.getElementById('hero');
    const stickyHeader = document.getElementById('sticky-header');

    function onScroll() {
        const heroHeight = hero.offsetHeight;
        const scrollY = window.scrollY;

        // Hero : fade out sur la seconde moitié du scroll
        const heroFadeStart = heroHeight * 0.4;
        const heroOpacity = Math.max(0, 1 - Math.max(0, scrollY - heroFadeStart) / (heroHeight - heroFadeStart));
        hero.style.opacity = heroOpacity;

        // Toggle is-stuck quand le hero est complètement sorti
        stickyHeader.classList.toggle('is-stuck', scrollY >= heroHeight);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // init
});

