// Pagefind 中文搜索优化 - 使用回车键触发搜索
// 避免中文输入法输入时的卡顿问题

let resList;
let sInput;
let first, last, current_elem = null;
let resultsAvailable = false;

function activeToggle(ae) {
    document.querySelectorAll('.focus').forEach(function (element) {
        element.classList.remove("focus");
    });
    if (ae) {
        ae.focus();
        document.activeElement = current_elem = ae;
        ae.parentElement.classList.add("focus");
    } else {
        document.activeElement.parentElement.classList.add("focus");
    }
}

function reset() {
    resultsAvailable = false;
    if (resList && sInput) {
        resList.innerHTML = sInput.value = '';
        sInput.focus();
    }
}

// Execute search ONLY when Enter key is pressed
async function executeSearch() {
    const query = sInput.value.trim();

    if (!query) {
        resList.innerHTML = '';
        resultsAvailable = false;
        return;
    }

    if (!window.pagefind) {
        resList.innerHTML = '<li class="post-entry"><header class="entry-header">搜索索引未加载，请刷新页面重试</header></li>';
        return;
    }

    try {
        const search = await window.pagefind.search(query);

        if (search.results.length !== 0) {
            let resultSet = '';
            const results = search.results.slice(0, 20);

            for (const result of results) {
                const data = await result.data();
                let titleHtml = data.meta.title || data.url;
                let excerpt = '';

                if (data.excerpt) {
                    excerpt = `<p>${data.excerpt}</p>`;
                } else if (data.meta.description) {
                    excerpt = `<p>${data.meta.description}</p>`;
                } else if (data.content) {
                    const preview = data.content.substring(0, 150).replace(/\s+/g, ' ');
                    excerpt = `<p>${preview}...</p>`;
                }

                resultSet += `<li class="post-entry">` +
                    `<header class="entry-header">${titleHtml}&nbsp;»</header>` +
                    (excerpt ? `<div class="entry-content">${excerpt}</div>` : '') +
                    `<a href="${data.url}" aria-label="${data.meta.title || data.url}"></a></li>`;
            }

            resList.innerHTML = resultSet;
            resultsAvailable = true;
            first = resList.firstChild;
            last = resList.lastChild;
        } else {
            resultsAvailable = false;
            resList.innerHTML = '<li class="post-entry"><header class="entry-header">未找到相关结果</header></li>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resList.innerHTML = '<li class="post-entry"><header class="entry-header">搜索出错：' + error.message + '</header></li>';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    resList = document.getElementById('searchResults');
    sInput = document.getElementById('searchInput');

    if (!resList || !sInput) {
        console.error('Search elements not found!');
        return;
    }

    // Check if Pagefind is loaded
    if (window.pagefind) {
        console.log('Pagefind loaded successfully');
    } else {
        console.log('Waiting for Pagefind to load...');
        resList.innerHTML = '<li class="post-entry"><header class="entry-header">搜索索引加载中，请稍候...</header></li>';

        // Poll for Pagefind
        let attempts = 0;
        const checkPagefind = setInterval(function() {
            attempts++;
            if (window.pagefind) {
                clearInterval(checkPagefind);
                resList.innerHTML = '';
                console.log('Pagefind loaded after', attempts, 'attempts');
            } else if (attempts > 50) {
                clearInterval(checkPagefind);
                resList.innerHTML = '<li class="post-entry"><header class="entry-header">搜索索引加载超时，请刷新页面</header></li>';
            }
        }, 100);
    }

    // Listen for keydown - only trigger search on Enter
    sInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeSearch();
        }
    });

    // Listen for search event (click on x button)
    sInput.addEventListener('search', function(e) {
        if (!this.value) reset();
    });

    // kb bindings
    document.addEventListener('keydown', function(e) {
        let key = e.key;
        let ae = document.activeElement;
        const searchbox = document.getElementById("searchbox");
        let inbox = searchbox ? searchbox.contains(ae) : false;

        if (ae === sInput) {
            let elements = document.getElementsByClassName('focus');
            while (elements.length > 0) {
                elements[0].classList.remove('focus');
            }
        } else if (current_elem) ae = current_elem;

        if (key === "Escape") {
            reset();
        } else if (!resultsAvailable || !inbox) {
            return;
        } else if (key === "ArrowDown") {
            e.preventDefault();
            if (ae == sInput) {
                if (resList.firstChild) {
                    activeToggle(resList.firstChild.lastChild);
                }
            } else if (ae.parentElement != last) {
                activeToggle(ae.parentElement.nextSibling.lastChild);
            }
        } else if (key === "ArrowUp") {
            e.preventDefault();
            if (ae.parentElement == first) {
                activeToggle(sInput);
            } else if (ae != sInput) {
                activeToggle(ae.parentElement.previousSibling.lastChild);
            }
        } else if (key === "ArrowRight") {
            ae.click();
        }
    });
});
