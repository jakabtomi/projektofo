lucide.createIcons();

const tweetInput = document.getElementById('tweet-text');
const postBtn = document.getElementById('post-btn');
const tweetList = document.getElementById('tweet-list');

async function loadTweets() {
    try {
        const response = await fetch('/api/tweets/'); 
        const tweets = await response.json();
        
        tweetList.innerHTML = '';
        tweets.forEach(tweet => {
            renderTweet(tweet.username, `@${tweet.username}`, tweet.content, tweet.created_at);
        });
    } catch (error) {
        console.error("Hiba a tweetek betöltésekor:", error);
    }
}

postBtn.addEventListener('click', async () => {
    const content = tweetInput.value;
    
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
            renderTweet(newTweet.username, `@${newTweet.username}`, newTweet.content, "most");
            tweetInput.value = "";
            postBtn.disabled = true;
        }
    } catch (error) {
        console.error("Hiba a posztoláskor:", error);
    }
});

function renderTweet(name, handle, content, time) {
    const tweetHtml = `
        <div class="tweet">
            <div class="avatar"></div>
            <div class="tweet-content">
                <div class="user-info">${name} <span>${handle} · ${time}</span></div>
                <div class="text">${content}</div>
                <div class="tweet-actions">
                    <i data-lucide="message-circle" size="18"></i>
                    <i data-lucide="repeat" size="18"></i>
                    <i data-lucide="heart" size="18"></i>
                    <i data-lucide="share" size="18"></i>
                </div>
            </div>
        </div>
    `;
    tweetList.insertAdjacentHTML('afterbegin', tweetHtml);
    lucide.createIcons();
}

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
