import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Universal Carousel Loader
async function loadCarousel(docId, sectionId, containerId, leftBtnId, rightBtnId) {
    try {
        const docSnap = await getDoc(doc(db, "announcements", docId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            let embeds = data.embeds || [];
            
            // Filter out empty or invalid embeds
            embeds = embeds.filter(e => typeof e === 'string' && e.trim().length > 15);
            
            if (embeds.length > 0) {
                const section = document.getElementById(sectionId);
                const container = document.getElementById(containerId);
                // Duplicate embeds multiple times to create a large track for infinite scrolling
                const infiniteEmbeds = [...embeds, ...embeds, ...embeds, ...embeds, ...embeds];
                
                let html = '';
                infiniteEmbeds.forEach(embed => {
                    let finalEmbed = embed;
                    // Automatically convert raw Facebook URLs into properly sized iframes
                    if (!embed.includes('<iframe') && !embed.includes('<div') && embed.includes('http')) {
                        const isVideo = embed.includes('/reel/') || embed.includes('/video/');
                        const pluginUrl = isVideo ? 'https://www.facebook.com/plugins/video.php' : 'https://www.facebook.com/plugins/post.php';
                        finalEmbed = `<iframe src="${pluginUrl}?href=${encodeURIComponent(embed)}&show_text=${!isVideo}&width=500" width="500" height="${isVideo ? '600' : '300'}" style="border:none;overflow:hidden; max-width: 100%;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
                    }

                    // Raw iframes without white background wrapper
                    html += `
                    <div class="review-card">
                        ${finalEmbed}
                    </div>
                    `;
                });
                
                const track = document.getElementById('reviewsTrack');
                track.innerHTML = html;
                section.style.display = 'block'; // Unhide the section
                
                // Wait a tick for DOM to render, then jump to the middle set so left/right are both filled
                setTimeout(() => {
                    const itemWidth = 540; // 500px width + 40px (2.5rem) gap
                    const setWidth = itemWidth * embeds.length;
                    container.scrollLeft = setWidth * 2; // Jump to the 3rd set (middle of the 5)
                }, 100);
                
                // Setup scroll buttons
                const leftBtn = document.getElementById(leftBtnId);
                const rightBtn = document.getElementById(rightBtnId);
                
                if (leftBtn && rightBtn) {
                    leftBtn.addEventListener('click', () => {
                        // Scroll back one card width + gap (500px + 2.5rem/40px)
                        container.scrollBy({ left: -540, behavior: 'smooth' });
                        
                        // Silently reset if we reach the far left edge
                        setTimeout(() => {
                            if (container.scrollLeft < 540) {
                                container.style.scrollBehavior = 'auto';
                                container.scrollLeft += (540 * embeds.length * 2);
                                container.style.scrollBehavior = 'smooth';
                            }
                        }, 400);
                    });
                    
                    rightBtn.addEventListener('click', () => {
                        // Scroll forward one card width + gap
                        container.scrollBy({ left: 540, behavior: 'smooth' });
                        
                        // Silently reset if we reach the far right edge
                        setTimeout(() => {
                            if (container.scrollLeft > container.scrollWidth - container.clientWidth - 540) {
                                container.style.scrollBehavior = 'auto';
                                container.scrollLeft -= (540 * embeds.length * 2);
                                container.style.scrollBehavior = 'smooth';
                            }
                        }, 400);
                    });
                }
            }
        }
    } catch (err) {
        console.error(`Error loading carousel ${docId}:`, err);
    }
}

// Load dynamic content
window.addEventListener('DOMContentLoaded', () => {
    // Load Reviews
    loadCarousel('facebook_reviews', 'reviews', 'reviewsContainer', 'reviewsLeftBtn', 'reviewsRightBtn');
});
