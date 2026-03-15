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

// 解析日期
function parseDate(dateStr) {
    if (!dateStr) return null;
    dateStr = dateStr.trim();

    // 尝试 ISO 格式
    const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
    if (isoMatch) {
        return new Date(isoMatch[1] + 'T' + isoMatch[2]);
    }

    // 尝试 RFC 822 格式
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

// 检查是否在范围内
function isRecent(dt, days) {
    if (!dt) return true;
    const now = new Date();
    const diff = (now - dt) / (1000 * 60 * 60 * 24);
    return diff <= days;
}

// 关键词匹配
function keywordMatch(title, summary, keywords) {
    const text = (title + ' ' + summary).toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// 提取文本内容（处理 CDATA）
function extractContent(html, tag) {
    const cdataMatch = html.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
    if (cdataMatch) return cdataMatch[1].trim();

    const normalMatch = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (normalMatch) return normalMatch[1].trim();

    return '';
}

// 获取 RSS 文章
async function fetchRSS(source, keywords, daysBack, signal) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(source.url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal
        });
        clearTimeout(timeout);

        const text = await response.text();

        // 检查是否是 Atom 或 RSS
        const isAtom = text.includes('<atom:') || text.includes('<feed ');
        const isRss = text.includes('<rss') || text.includes('<item>');

        const entries = [];

        if (isAtom) {
            // Atom 格式解析
            const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
            let match;
            while ((match = entryRegex.exec(text)) !== null) {
                const entry = match[1];

                const title = extractContent(entry, 'title');
                const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
                const link = linkMatch ? linkMatch[1] : '';
                const summary = extractContent(entry, 'summary') || extractContent(entry, 'content');
                const published = extractContent(entry, 'published') || extractContent(entry, 'updated');

                if (!title || !link) continue;

                const dt = parseDate(published);
                if (!isRecent(dt, daysBack)) continue;

                if (keywordMatch(title, summary, keywords)) {
                    entries.push({
                        title,
                        url: link,
                        summary: summary.substring(0, 500),
                        published,
                        source: source.name
                    });
                }
            }
        } else if (isRss) {
            // RSS 格式解析
            const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
            let match;
            while ((match = itemRegex.exec(text)) !== null) {
                const item = match[1];

                const title = extractContent(item, 'title');
                const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
                const link = linkMatch ? linkMatch[1].trim() : '';
                const description = extractContent(item, 'description');
                const pubDate = extractContent(item, 'pubDate');

                if (!title) continue;

                const dt = parseDate(pubDate);
                if (!isRecent(dt, daysBack)) continue;

                if (keywordMatch(title, description, keywords)) {
                    entries.push({
                        title,
                        url: link,
                        summary: description.substring(0, 500),
                        published: pubDate,
                        source: source.name
                    });
                }
            }
        }

        return entries;
    } catch (error) {
        // 静默处理错误
        return [];
    }
}

// 调用 AI 生成摘要
async function generateSummary(article, config) {
    const prompt = `请阅读以下文章信息，然后生成一个中文摘要：

标题：${article.title}
来源：${article.source}
内容摘要：${article.summary}

请生成：
1. 一句话概括文章核心内容（不超过50字）
2. 这篇文章适合谁阅读
3. 文章的三个核心观点（每个不超过20字）

请用中文回复，格式清晰。`;

    let url, headers, data;

    const baseUrl = config.apiBaseUrl.replace(/\/$/, '');

    if (config.apiProvider === 'minimax') {
        url = `${baseUrl}/v1/text/chatcompletion_v2`;
        headers = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        };
        data = {
            model: config.apiModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600
        };
    } else if (config.apiProvider === 'openai') {
        url = `${baseUrl}/chat/completions`;
        headers = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        };
        data = {
            model: config.apiModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600
        };
    } else if (config.apiProvider === 'volcengine') {
        url = `${baseUrl}/chat/completions`;
        headers = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        };
        data = {
            model: config.apiModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600
        };
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            signal: controller.signal
        });
        clearTimeout(timeout);

        const result = await response.json();

        if (result.choices && result.choices[0]) {
            return result.choices[0].message.content;
        } else if (result.base_resp) {
            return `API 错误: ${result.base_resp.status_msg}`;
        } else if (result.error) {
            return `API 错误: ${result.error.message || JSON.stringify(result)}`;
        } else {
            return `API 返回异常: ${JSON.stringify(result).substring(0, 100)}`;
        }
    } catch (error) {
        return `调用失败: ${error.message}`;
    }
}

// 去重
function deduplicate(articles) {
    const seen = new Set();
    return articles.filter(a => {
        const key = a.title.toLowerCase().replace(/\s/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export default async function handler(req, res) {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            keywords,
            daysBack = 7,
            maxArticles = 10,
            apiProvider,
            apiKey,
            apiModel,
            apiBaseUrl
        } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: '请提供 API Key' });
        }

        if (!keywords || keywords.length === 0) {
            return res.status(400).json({ error: '请至少选择一个关键词' });
        }

        // 配置
        const config = { apiProvider, apiKey, apiModel, apiBaseUrl };

        // 获取所有文章（限制数量以避免超时）
        let allArticles = [];
        const sourcesToFetch = RSS_SOURCES.slice(0, 20); // 限制来源数量

        // 并发抓取，但限制并发数
        const batchSize = 5;
        for (let i = 0; i < sourcesToFetch.length; i += batchSize) {
            const batch = sourcesToFetch.slice(i, i + batchSize);
            const promises = batch.map(source => fetchRSS(source, keywords, daysBack, null));
            const results = await Promise.all(promises);
            results.forEach(articles => allArticles.push(...articles));
        }

        // 去重
        allArticles = deduplicate(allArticles);

        // 如果没有足够的文章，减少请求
        const needMore = maxArticles - allArticles.length;
        if (needMore > 0 && allArticles.length > 0) {
            // 再抓取更多来源
            const moreSources = RSS_SOURCES.slice(20, 40);
            const promises = moreSources.map(source => fetchRSS(source, keywords, daysBack, null));
            const results = await Promise.all(promises);
            results.forEach(articles => allArticles.push(...articles));
            allArticles = deduplicate(allArticles);
        }

        // 限制数量
        const selectedArticles = allArticles.slice(0, maxArticles);

        // 生成摘要（串行以避免 API 限流）
        const finalArticles = [];
        for (const article of selectedArticles) {
            const summary = await generateSummary(article, config);
            finalArticles.push({
                title: article.title,
                url: article.url,
                source: article.source,
                summary
            });
        }

        res.status(200).json({ articles: finalArticles });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
