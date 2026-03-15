// RSS 源列表
const RSS_SOURCES = [
    { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
    { name: "Jeff Geerling", url: "https://www.jeffgeerling.com/blog.xml" },
    { name: "Sean Goedecke", url: "https://www.seangoedecke.com/rss.xml" },
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
    { name: "Daring Fireball", url: "https://daringfireball.net/feeds/main" },
    { name: "Eric Migicovsky", url: "https://ericmigi.com/rss.xml" },
    { name: "Antirez", url: "http://antirez.com/rss" },
    { name: "Idiallo", url: "https://idiallo.com/feed.rss" },
    { name: "Maurycy", url: "https://maurycyz.com/index.xml" },
    { name: "Pluralistic", url: "https://pluralistic.net/feed/" },
    { name: "Shkspr.mobi", url: "https://shkspr.mobi/blog/feed/" },
    { name: "Lcamtuf Substack", url: "https://lcamtuf.substack.com/feed" },
    { name: "Mitchellh", url: "https://mitchellh.com/feed.xml" },
    { name: "Dynomight", url: "https://dynomight.net/feed.xml" },
    { name: "Xeiaso", url: "https://xeiaso.net/blog.rss" },
    { name: "Microsoft OldNewThing", url: "https://devblogs.microsoft.com/oldnewthing/feed" },
    { name: "Righto", url: "https://www.righto.com/feeds/posts/default" },
    { name: "Lucumr", url: "https://lucumr.pocoo.org/feed.atom" },
    { name: "Skyfall", url: "https://skyfall.dev/rss.xml" },
    { name: "Gary Marcus", url: "https://garymarcus.substack.com/feed" },
    { name: "Rachel By The Bay", url: "https://rachelbythebay.com/w/atom.xml" },
    { name: "Overreacted", url: "https://overreacted.io/rss.xml" },
    { name: "Timsh", url: "https://timsh.org/rss/" },
    { name: "John D Cook", url: "https://www.johndcook.com/blog/feed/" },
    { name: "Giles Thomas", url: "https://gilesthomas.com/feed/rss.xml" },
    { name: "Matklad", url: "https://matklad.github.io/feed.xml" },
    { name: "Evan Hahn", url: "https://evanhahn.com/feed.xml" },
    { name: "Terrible Software", url: "https://terriblesoftware.org/feed/" },
    { name: "Rakhim", url: "https://rakhim.exotext.com/rss.xml" },
    { name: "Joana Westenberg", url: "https://joanwestenberg.com/rss" },
    { name: "Xania", url: "https://xania.org/feed" },
    { name: "Micah Lee", url: "https://micahflee.com/feed/" },
    { name: "Nesbitt", url: "https://nesbitt.io/feed.xml" },
    { name: "Construction Physics", url: "https://www.construction-physics.com/feed" },
    { name: "Tedium", url: "https://feed.tedium.co/" },
    { name: "Susam", url: "https://susam.net/feed.xml" },
    { name: "Entropic Thoughts", url: "https://entropicthoughts.com/feed.xml" },
    { name: "Buttondown/Hillel", url: "https://buttondown.com/hillelwayne/rss" },
    { name: "Dwarkesh", url: "https://www.dwarkeshpatel.com/feed" },
    { name: "Borretti", url: "https://borretti.me/feed.xml" },
    { name: "Minimaxir", url: "https://minimaxir.com/index.xml" },
    { name: "Geohot", url: "https://geohot.github.io/blog/feed.xml" },
    { name: "Paul Graham Essays", url: "http://www.aaronsw.com/2002/feeds/pgessays.rss" },
    { name: "Filfre", url: "https://www.filfre.net/feed/" },
    { name: "Jim Nielsen", url: "https://blog.jim-nielsen.com/feed.xml" },
    { name: "Geoffrey Litt", url: "https://www.geoffreylitt.com/feed.xml" },
    { name: "Brutecat", url: "https://brutecat.com/rss.xml" },
    { name: "Eli Thegreenplace", url: "https://eli.thegreenplace.net/feeds/all.atom.xml" },
    { name: "Fabien Sanglard", url: "https://fabiensanglard.net/rss.xml" },
    { name: "Gwern", url: "https://gwern.substack.com/feed" },
    { name: "Berthub", url: "https://berthub.eu/articles/index.xml" },
    { name: "Chad Nauseam", url: "https://chadnauseam.com/rss.xml" },
    { name: "Simon(e)", url: "https://simone.org/feed/" },
    { name: "Beej.us", url: "https://beej.us/blog/rss.xml" },
    { name: "Hey.Paris", url: "https://hey.paris/index.xml" },
    { name: "Refactoring English", url: "https://refactoringenglish.com/index.xml" },
    { name: "Works On My Machine", url: "https://worksonmymachine.substack.com/feed" },
    { name: "Steve Blank", url: "https://steveblank.com/feed/" },
    { name: "Bernstein Bear", url: "https://bernsteinbear.com/feed.xml" },
    { name: "Troy Hunt", url: "https://www.troyhunt.com/rss/" },
    { name: "Herman Bearblog", url: "https://herman.bearblog.dev/feed/" },
    { name: "Grants Latton", url: "https://grantslatton.com/rss.xml" },
    { name: "Experimental History", url: "https://www.experimental-history.com/feed" },
    { name: "Anil Dash", url: "https://anildash.com/feed.xml" },
    { name: "Miguel Grinberg", url: "https://blog.miguelgrinberg.com/feed" },
    { name: "Computer Rip", url: "https://computer.rip/rss.xml" },
    { name: "Ted Unangst", url: "https://www.tedunangst.com/flak/rss" },
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
    localStorage.setItem('aiNewsSettings', JSON.stringify(settings));
    alert('设置已保存！');
}

// 从 localStorage 加载设置
function loadSettings() {
    const saved = localStorage.getItem('aiNewsSettings');
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
function updateProgress(percent, text) {
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('loadingText').textContent = text;
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

    try {
        updateProgress(10, '正在获取 RSS 资讯...');

        // 调用 Serverless Function 获取文章
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

        updateProgress(90, '正在渲染页面...');
        displayResults(result.articles);

    } catch (error) {
        alert('生成失败: ' + error.message);
        document.getElementById('settingsPanel').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }
}

// 显示结果
function displayResults(articles) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    document.getElementById('resultCount').textContent = articles.length;
    document.getElementById('resultDate').textContent = new Date().toLocaleDateString('zh-CN');

    const container = document.getElementById('articles');
    container.innerHTML = '';

    articles.forEach((article, index) => {
        const div = document.createElement('div');
        div.className = 'article';
        div.innerHTML = `
            <h3>${index + 1}. ${article.title}</h3>
            <div class="article-meta">
                来源: ${article.source} ·
                <a href="${article.url}" target="_blank">查看原文</a>
            </div>
            <div class="article-summary">
                ${article.summary}
            </div>
        `;
        container.appendChild(div);
    });
}

// 复制到剪贴板
function copyToClipboard() {
    const articles = document.querySelectorAll('.article');
    let text = '# 今日 AI 阅读简报\n\n';

    articles.forEach((article, index) => {
        const title = article.querySelector('h3').textContent;
        const summary = article.querySelector('.article-summary').textContent;
        text += `## ${title}\n\n${summary}\n\n---\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板！');
    });
}
