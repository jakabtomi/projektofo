const tweetInput = document.getElementById('tweet-text');
const postBtn = document.getElementById('post-btn');
const tweetList = document.getElementById('tweet-list');

function formatTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString();
}

async function loadTweets() {
    try {
        const response = await fetch('/api/tweets/'); 
        const tweets = await response.json();
        
        tweetList.innerHTML = '';
        tweets.forEach(tweet => {
            renderTweet(tweet);
        });
    } catch (error) {
        console.error("Hiba a tweetek betöltésekor:", error);
    }
}

postBtn.addEventListener('click', async () => {
    const content = tweetInput.value.trim();
    if (!content) return;
    
    try {
        const response = await fetch('/api/tweets/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') 
            },
            body: JSON.stringify({ content: content })
        });

        if (response.ok) {
            const newTweet = await response.json();
            renderTweet(newTweet, true);
            tweetInput.value = "";
            postBtn.disabled = true;
        }
    } catch (error) {
        console.error("Hiba a posztoláskor:", error);
    }
});

function renderTweet(tweet, isNew = false) {
    const name = tweet.username || "Vendég";
    const handle = `@${name}`;
    const time = isNew ? "most" : formatTime(tweet.created_at);
    const shareCount = tweet.share_count ?? 0;
    const commentCount = tweet.comment_count ?? 0;

    const tweetHtml = `
        <div class="tweet" data-tweet-id="${tweet.id}">
            <div class="avatar"></div>
            <div class="tweet-content">
                <div class="user-info">${name} <span>${handle} · ${time}</span></div>
                <div class="text"></div>
                <div class="tweet-actions">
                    <button class="icon-btn js-toggle-comments" type="button" title="Kommentek">
                        <i data-lucide="message-circle" size="18"></i>
                        <span class="count js-comment-count">${commentCount}</span>
                    </button>
                    <button class="icon-btn js-share" type="button" title="Megosztás">
                        <i data-lucide="repeat" size="18"></i>
                        <span class="count js-share-count">${shareCount}</span>
                    </button>
                    <i data-lucide="heart" size="18"></i>
                </div>
                <div class="comments js-comments" hidden>
                    <div class="comment-list js-comment-list"></div>
                    <div class="comment-form">
                        <input class="comment-input js-comment-input" type="text" maxlength="280" placeholder="Írj egy kommentet…" />
                        <button class="comment-submit js-comment-submit" type="button">Küldés</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (isNew) {
        tweetList.insertAdjacentHTML('afterbegin', tweetHtml);
    } else {
        tweetList.insertAdjacentHTML('beforeend', tweetHtml);
    }

    const el = tweetList.querySelector(`[data-tweet-id="${tweet.id}"]`);
    const textEl = el.querySelector('.text');
    textEl.textContent = tweet.content || "";
    lucide.createIcons();
}

tweetList.addEventListener('click', async (e) => {
    const target = e.target;
    const tweetEl = target.closest?.('.tweet');
    if (!tweetEl) return;
    const tweetId = tweetEl.getAttribute('data-tweet-id');
    if (!tweetId) return;

    const shareBtn = target.closest?.('.js-share');
    if (shareBtn) {
        try {
            const response = await fetch(`/api/tweets/${tweetId}/share/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            if (!response.ok) return;
            const data = await response.json();
            tweetEl.querySelector('.js-share-count').textContent = data.share_count ?? 0;
        } catch (err) {
            console.error("Hiba a megosztáskor:", err);
        }
        return;
    }

    const toggleBtn = target.closest?.('.js-toggle-comments');
    if (toggleBtn) {
        const panel = tweetEl.querySelector('.js-comments');
        const list = tweetEl.querySelector('.js-comment-list');
        const isHidden = panel.hasAttribute('hidden');
        if (isHidden) {
            panel.removeAttribute('hidden');
            if (!panel.dataset.loaded) {
                try {
                    const response = await fetch(`/api/tweets/${tweetId}/comments/`);
                    if (response.ok) {
                        const comments = await response.json();
                        list.innerHTML = '';
                        comments.forEach(c => {
                            const row = document.createElement('div');
                            row.className = 'comment';
                            const author = c.username || "Ismeretlen";
                            row.innerHTML = `<div class="comment-meta">@${author}</div><div class="comment-text"></div>`;
                            row.querySelector('.comment-text').textContent = c.content || "";
                            list.appendChild(row);
                        });
                        panel.dataset.loaded = '1';
                    }
                } catch (err) {
                    console.error("Hiba a kommentek betöltésekor:", err);
                }
            }
        } else {
            panel.setAttribute('hidden', '');
        }
        return;
    }

    const submitBtn = target.closest?.('.js-comment-submit');
    if (submitBtn) {
        const input = tweetEl.querySelector('.js-comment-input');
        const content = (input.value || "").trim();
        if (!content) return;
        try {
            const response = await fetch(`/api/tweets/${tweetId}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ content })
            });
            if (!response.ok) return;
            const c = await response.json();
            const list = tweetEl.querySelector('.js-comment-list');
            const row = document.createElement('div');
            row.className = 'comment';
            const author = c.username || "Ismeretlen";
            row.innerHTML = `<div class="comment-meta">@${author}</div><div class="comment-text"></div>`;
            row.querySelector('.comment-text').textContent = c.content || "";
            list.appendChild(row);
            input.value = '';
            const countEl = tweetEl.querySelector('.js-comment-count');
            countEl.textContent = (Number(countEl.textContent || "0") + 1).toString();
        } catch (err) {
            console.error("Hiba a komment küldésekor:", err);
        }
        return;
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

tweetInput.addEventListener('input', () => postBtn.disabled = !tweetInput.value.trim());
loadTweets();
if (window.lucide) {
    lucide.createIcons();
}
