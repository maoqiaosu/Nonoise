// RSS 源列表
const RSS_SOURCES = [
    { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
    { name: "Daring Fireball", url: "https://daringfireball.net/feeds/main" },
    { name: "Overreacted", url: "https://overreacted.io/rss.xml" },
    { name: "Paul Graham Essays", url: "http://www.aaronsw.com/2002/feeds/pgessays.rss" },
    { name: "Gwern", url: "https://gwern.substack.com/feed" },
    { name: "Pluralistic", url: "https://pluralistic.net/feed/" },
    { name: "Lcamtuf Substack", url: "https://lcamtuf.substack.com/feed" },
    { name: "Gary Marcus", url: "https://garymarcus.substack.com/feed" },
    { name: "Dwarkesh", url: "https://www.dwarkeshpatel.com/feed" },
    { name: "Mitchellh", url: "https://mitchellh.com/feed.xml" },
    { name: "Matklad", url: "https://matklad.github.io/feed.xml" },
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
    { name: "Troy Hunt", url: "https://www.troyhunt.com/rss/" },
    { name: "Works On My Machine", url: "https://worksonmymachine.substack.com/feed" },
    { name: "Steve Blank", url: "https://steveblank.com/feed/" },
    { name: "Miguel Grinberg", url: "https://blog.miguelgrinberg.com/feed" },
    { name: "Geohot", url: "https://geohot.github.io/blog/feed.xml" },
    { name: "Minimaxir", url: "https://minimaxir.com/index.xml" },
    { name: "Bernstein Bear", url: "https://bernsteinbear.com/feed.xml" },
    { name: "Experimental History", url: "https://www.experimental-history.com/feed" },
];

// 默认关键词
const DEFAULT_KEYWORDS = ['AI', 'agent', 'LLM', 'GPT', 'Claude'];

// API 配置
const API_CONFIGS = {
    minimax: {
        name: 'MiniMax',
        modelPlaceholder: 'MiniMax-M2.5',
        baseUrlPlaceholder: 'https://api.minimax.chat'
    },
    openai: {
        name: 'OpenAI',
        modelPlaceholder: 'gpt-4o-mini',
        baseUrlPlaceholder: 'https://api.openai.com/v1'
    },
    volcengine: {
        name: '火山引擎',
        modelPlaceholder: 'deepseek-v3-2-251201',
        baseUrlPlaceholder: 'https://ark.cn-beijing.volces.com/api/v3'
    }
};

// 当前任务信息
let currentTask = {
    total: 0,
    current: 0,
    currentTitle: ''
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupKeywordTags();
    toggleApiFields();
});

// 切换 API 提供商时更新表单
function toggleApiFields() {
    const provider = document.getElementById('apiProvider').value;
    const config = API_CONFIGS[provider];

    document.getElementById('apiModel').placeholder = config.modelPlaceholder;
    document.getElementById('apiBaseUrl').placeholder = config.baseUrlPlaceholder;
}

// 关键词标签点击事件
function setupKeywordTags() {
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });
}

// 获取选中的关键词
function getSelectedKeywords() {
    const selected = Array.from(document.querySelectorAll('.tag.selected'))
        .map(tag => tag.dataset.value);

    const custom = document.getElementById('customKeywords').value
        .split(',')
        .map(k => k.trim())
        .filter(k => k);

    return [...selected, ...custom];
}

// 获取用户配置
function getSettings() {
    const provider = document.getElementById('apiProvider').value;

    return {
        apiProvider: provider,
        apiKey: document.getElementById('apiKey').value.trim(),
        apiModel: document.getElementById('apiModel').value.trim() || API_CONFIGS[provider].modelPlaceholder,
        apiBaseUrl: document.getElementById('apiBaseUrl').value.trim() || API_CONFIGS[provider].baseUrlPlaceholder,
        keywords: getSelectedKeywords(),
        daysBack: parseInt(document.getElementById('daysBack').value) || 7,
        maxArticles: parseInt(document.getElementById('maxArticles').value) || 10
    };
}

// 保存设置到 localStorage
function saveSettings() {
    const settings = getSettings();
    localStorage.setItem('nonoiseSettings', JSON.stringify(settings));
    alert('设置已保存！');
}

// 从 localStorage 加载设置
function loadSettings() {
    const saved = localStorage.getItem('nonoiseSettings');
    if (!saved) return;

    try {
        const settings = JSON.parse(saved);

        document.getElementById('apiProvider').value = settings.apiProvider || 'minimax';
        document.getElementById('apiKey').value = settings.apiKey || '';
        document.getElementById('apiModel').value = settings.apiModel || '';
        document.getElementById('apiBaseUrl').value = settings.apiBaseUrl || '';
        document.getElementById('customKeywords').value = settings.customKeywords || '';
        document.getElementById('daysBack').value = settings.daysBack || 7;
        document.getElementById('maxArticles').value = settings.maxArticles || 10;

        // 恢复关键词选中状态
        if (settings.keywords) {
            settings.keywords.forEach(kw => {
                const tag = document.querySelector(`.tag[data-value="${kw}"]`);
                if (tag) tag.classList.add('selected');
            });
        }
    } catch (e) {
        console.error('加载设置失败:', e);
    }
}

// 更新进度条
function updateProgress(percent, current, total, currentTitle) {
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressText').textContent = `${current} / ${total}`;

    if (currentTitle) {
        document.getElementById('currentItem').textContent = currentTitle;
    }
}

// 更新加载状态
function setLoadingState(title, desc, current, total, currentTitle) {
    document.getElementById('loadingTitle').textContent = title;
    document.getElementById('loadingText').textContent = desc;

    if (total > 0) {
        const percent = Math.round((current / total) * 100);
        updateProgress(percent, current, total, currentTitle);
    }
}

// 生成阅读简报
async function generateReport() {
    const settings = getSettings();

    if (!settings.apiKey) {
        alert('请输入 API Key！');
        return;
    }

    if (settings.keywords.length === 0) {
        alert('请至少选择一个关键词！');
        return;
    }

    // 保存设置
    saveSettings();

    // 显示加载状态
    document.getElementById('settingsPanel').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('loading').style.display = 'block';

    // 初始化进度
    currentTask = { total: 0, current: 0, currentTitle: '' };
    setLoadingState('🚀 正在启动...', '准备连接服务器', 0, 0, '');

    try {
        // 第一阶段：获取文章
        setLoadingState('📥 正在抓取资讯', '正在从 RSS 源获取文章...', 0, 0, '连接服务器...');

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: settings.keywords,
                daysBack: settings.daysBack,
                maxArticles: settings.maxArticles,
                apiProvider: settings.apiProvider,
                apiKey: settings.apiKey,
                apiModel: settings.apiModel,
                apiBaseUrl: settings.apiBaseUrl
            })
        });

        if (!response.ok) {
            throw new Error('请求失败');
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // 第二阶段：AI 处理
        const articles = result.articles || [];
        setLoadingState('🤖 AI 正在生成摘要', `共 ${articles.length} 篇文章需要处理...`, 0, articles.length, '');

        // 显示结果
        displayResults(articles);

    } catch (error) {
        alert('生成失败: ' + error.message);
        goHome();
    }
}

// 渲染 Markdown
function renderMarkdown(text) {
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    // 如果没有 marked 库，简单转换
    return text
        .replace(/## (.*)/g, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// 显示结果
function displayResults(articles) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    document.getElementById('resultCount').textContent = articles.length;
    document.getElementById('resultDate').textContent = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const container = document.getElementById('articles');
    container.innerHTML = '';

    articles.forEach((article, index) => {
        const div = document.createElement('div');
        div.className = 'article';
        div.innerHTML = `
            <h3>${index + 1}. ${escapeHtml(article.title)}</h3>
            <div class="article-meta">
                <span class="source">${escapeHtml(article.source)}</span>
                <a href="${escapeHtml(article.url)}" target="_blank">查看原文 →</a>
            </div>
            <div class="article-summary markdown-body">
                ${renderMarkdown(article.summary)}
            </div>
        `;
        container.appendChild(div);
    });
}

// 转义 HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 返回首页
function goHome() {
    document.getElementById('settingsPanel').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('loading').style.display = 'none';

    // 重置进度条
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0 / 0';
    document.getElementById('currentItem').textContent = '';
}

// 复制到剪贴板
function copyToClipboard() {
    const articles = document.querySelectorAll('.article');
    let text = '# 今日阅读简报\n\n';
    text += `日期: ${new Date().toLocaleDateString('zh-CN')}\n\n`;
    text += '---\n\n';

    articles.forEach((article, index) => {
        const title = article.querySelector('h3').textContent;
        const summary = article.querySelector('.article-summary').innerText;
        const source = article.querySelector('.source').textContent;
        const url = article.querySelector('a').href;

        text += `## ${title}\n\n`;
        text += `来源: ${source}\n`;
        text += `链接: ${url}\n\n`;
        text += `${summary}\n\n`;
        text += '---\n\n';
    });

    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板！');
    });
}
