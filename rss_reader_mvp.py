"""
AI RSS 阅读助手 MVP - 优化版
功能：
1. 从 100+ RSS 源抓取最新文章
2. 关键词过滤
3. AI 摘要生成（支持 OpenAI/火山引擎）
4. 去重机制
5. 代理支持
"""

import feedparser
import json
import time
import os
import re
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 加载环境变量
load_dotenv()

# ============ 配置项 ============

# RSS 源列表（可以替换为从 OPML 文件导入）
RSS_SOURCES = [
    "https://simonwillison.net/atom/everything/",
    "https://www.jeffgeerling.com/blog.xml",
    "https://www.seangoedecke.com/rss.xml",
    "https://krebsonsecurity.com/feed/",
    "https://daringfireball.net/feeds/main",
    "https://ericmigi.com/rss.xml",
    "http://antirez.com/rss",
    "https://idiallo.com/feed.rss",
    "https://maurycyz.com/index.xml",
    "https://pluralistic.net/feed/",
    "https://shkspr.mobi/blog/feed/",
    "https://lcamtuf.substack.com/feed",
    "https://mitchellh.com/feed.xml",
    "https://dynomight.net/feed.xml",
    "https://xeiaso.net/blog.rss",
    "https://devblogs.microsoft.com/oldnewthing/feed",
    "https://www.righto.com/feeds/posts/default",
    "https://lucumr.pocoo.org/feed.atom",
    "https://skyfall.dev/rss.xml",
    "https://garymarcus.substack.com/feed",
    "https://rachelbythebay.com/w/atom.xml",
    "https://overreacted.io/rss.xml",
    "https://timsh.org/rss/",
    "https://www.johndcook.com/blog/feed/",
    "https://gilesthomas.com/feed/rss.xml",
    "https://matklad.github.io/feed.xml",
    "https://www.theatlantic.com/feed/author/derek-thompson/",
    "https://evanhahn.com/feed.xml",
    "https://terriblesoftware.org/feed/",
    "https://rakhim.exotext.com/rss.xml",
    "https://joanwestenberg.com/rss",
    "https://xania.org/feed",
    "https://micahflee.com/feed/",
    "https://nesbitt.io/feed.xml",
    "https://www.construction-physics.com/feed",
    "https://feed.tedium.co/",
    "https://susam.net/feed.xml",
    "https://entropicthoughts.com/feed.xml",
    "https://buttondown.com/hillelwayne/rss",
    "https://www.dwarkeshpatel.com/feed",
    "https://borretti.me/feed.xml",
    "https://www.wheresyoured.at/rss/",
    "https://jayd.ml/feed.xml",
    "https://minimaxir.com/index.xml",
    "https://geohot.github.io/blog/feed.xml",
    "http://www.aaronsw.com/2002/feeds/pgessays.rss",
    "https://www.filfre.net/feed/",
    "https://blog.jim-nielsen.com/feed.xml",
    "https://dfarq.homeip.net/feed/",
    "https://jyn.dev/atom.xml",
    "https://www.geoffreylitt.com/feed.xml",
    "https://www.downtowndougbrown.com/feed/",
    "https://brutecat.com/rss.xml",
    "https://eli.thegreenplace.net/feeds/all.atom.xml",
    "https://www.abortretry.fail/feed",
    "https://fabiensanglard.net/rss.xml",
    "https://oldvcr.blogspot.com/feeds/posts/default",
    "https://bogdanthegeek.github.io/blog/index.xml",
    "https://hugotunius.se/feed.xml",
    "https://gwern.substack.com/feed",
    "https://berthub.eu/articles/index.xml",
    "https://chadnauseam.com/rss.xml",
    "https://simone.org/feed/",
    "https://it-notes.dragas.net/feed/",
    "https://beej.us/blog/rss.xml",
    "https://hey.paris/index.xml",
    "https://danielwirtz.com/rss.xml",
    "https://matduggan.com/rss/",
    "https://refactoringenglish.com/index.xml",
    "https://worksonmymachine.substack.com/feed",
    "https://philiplaine.com/index.xml",
    "https://steveblank.com/feed/",
    "https://bernsteinbear.com/feed.xml",
    "https://danieldelaney.net/feed",
    "https://www.troyhunt.com/rss/",
    "https://herman.bearblog.dev/feed/",
    "https://tomrenner.com/index.xml",
    "https://blog.pixelmelt.dev/rss/",
    "https://martinalderson.com/feed.xml",
    "https://danielchasehooper.com/feed.xml",
    "https://www.chiark.greenend.org.uk/~sgtatham/quasiblog/feed.xml",
    "https://grantslatton.com/rss.xml",
    "https://www.experimental-history.com/feed",
    "https://anildash.com/feed.xml",
    "https://aresluna.org/main.rss",
    "https://michael.stapelberg.ch/feed.xml",
    "https://blog.miguelgrinberg.com/feed",
    "https://keygen.sh/blog/feed.xml",
    "https://mjg59.dreamwidth.org/data/rss",
    "https://computer.rip/rss.xml",
    "https://www.tedunangst.com/flak/rss",
]

# 关键词配置
KEYWORDS = [
    "AI", "agent", "LLM", "GPT", "Claude", "machine learning",
    "startup", "entrepreneur", "business", "SaaS", "product",
    "programming", "software", "developer", "code", "engineering"
]

DAYS_BACK = 7
MAX_ARTICLES = 20  # 最终输出最多多少篇

# ============ 工具函数 ============

def get_proxies():
    """获取代理配置"""
    proxies = {}

    # 优先读取环境变量
    proxy_http = os.getenv("PROXY_HTTP") or os.getenv("HTTP_PROXY")
    proxy_https = os.getenv("PROXY_HTTPS") or os.getenv("HTTPS_PROXY") or os.getenv("ALL_PROXY")

    if proxy_http:
        proxies['http'] = proxy_http
    if proxy_https:
        proxies['https'] = proxy_https

    return proxies if proxies else None

PROXIES = get_proxies()

def parse_date(date_str):
    """解析多种日期格式"""
    if not date_str:
        return None

    date_str = date_str.strip()

    # 尝试解析 ISO 格式日期（2026-03-14T18:41:25+00:00）
    match = re.match(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}:\d{2})?', date_str)
    if match:
        dt_str = match.group(1)
        tz_str = match.group(2)
        try:
            dt = datetime.strptime(dt_str, '%Y-%m-%dT%H:%M:%S')
            # 处理时区，转为本地时间
            if tz_str:
                hours = int(tz_str[1:3])
                minutes = int(tz_str[4:6])
                offset = timedelta(hours=hours, minutes=minutes)
                dt = dt - offset
            return dt
        except:
            pass

    # 尝试解析 RFC 822 格式（Wed, 02 Oct 2002 13:00:00 GMT）
    try:
        import email.utils
        parsed = email.utils.parsedate_tz(date_str)
        if parsed:
            timestamp = email.utils.mktime_tz(parsed)
            dt = datetime.fromtimestamp(timestamp)
            return dt
    except:
        pass

    # 尝试其他常见格式
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=None)
            return dt
        except:
            continue

    return None

def is_recent(dt, days=7):
    """判断是否在指定天数内"""
    if dt is None:
        return False
    now = datetime.now()
    if dt.tzinfo is not None:
        dt_local = dt.replace(tzinfo=None)
    else:
        dt_local = dt
    return (now - dt_local) <= timedelta(days=days)

def keyword_match(title, summary, keywords):
    """关键词匹配"""
    text = (title + " " + summary).lower()
    return any(kw.lower() in text for kw in keywords)

def normalize_url(url):
    """标准化 URL，去除跟踪参数"""
    if not url:
        return ""
    # 去除常见的跟踪参数
    url = re.sub(r'\?utm_.*$', '', url)
    url = re.sub(r'\?fbclid=.*$', '', url)
    url = re.sub(r'\?ref=.*$', '', url)
    return url.strip()

def get_article_hash(title, url):
    """生成文章唯一标识"""
    normalized_url = normalize_url(url)
    # 标题转小写，去除空格后取 hash
    title_normalized = re.sub(r'\s+', '', title.lower())
    return hashlib.md5(f"{title_normalized}:{normalized_url}".encode()).hexdigest()

def fetch_single_feed(args):
    """抓取单个 RSS 源（用于并发）"""
    url, timeout = args
    try:
        # feedparser 不支持 timeout，需要用 requests 先下载
        import requests
        response = requests.get(url, timeout=timeout, verify=False)
        response.encoding = 'utf-8'
        feed = feedparser.parse(response.text)

        if feed is None or not feed.entries:
            return []

        feed_title = feed.feed.get('title', url)
        articles = []

        for entry in feed.entries[:20]:
            published = entry.get('published') or entry.get('updated', '')
            dt = parse_date(published)

            if not is_recent(dt, DAYS_BACK):
                continue

            title = entry.get('title', '')
            summary = entry.get('summary') or entry.get('description', '')

            if keyword_match(title, summary, KEYWORDS):
                articles.append({
                    'title': title,
                    'summary': summary[:800],  # 增加摘要长度
                    'url': entry.get('link', ''),
                    'published': published,
                    'source': feed_title,
                    'source_url': url
                })

        return articles
    except Exception as e:
        return []

def get_articles_parallel(max_workers=10):
    """并发抓取所有 RSS 源"""
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    all_articles = []

    print(f"正在并发抓取 {len(RSS_SOURCES)} 个 RSS 源...")

    # 创建 session，支持重试
    session = requests.Session()
    if PROXIES:
        print(f"使用代理: {PROXIES}")

    # 准备任务参数
    tasks = [(url, 15) for url in RSS_SOURCES]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_single_feed, task): task[0] for task in tasks}

        completed = 0
        for future in as_completed(futures):
            completed += 1
            if completed % 20 == 0:
                print(f"已处理 {completed}/{len(RSS_SOURCES)} 个源...")

            try:
                articles = future.result()
                all_articles.extend(articles)
            except Exception as e:
                pass

    print(f"\n共找到 {len(all_articles)} 篇命中关键词的文章")
    return all_articles

def deduplicate(articles):
    """去重：基于 URL 和标题相似度"""
    seen_hashes = set()
    unique_articles = []

    for article in articles:
        article_hash = get_article_hash(article['title'], article['url'])

        if article_hash not in seen_hashes:
            seen_hashes.add(article_hash)
            unique_articles.append(article)

    removed = len(articles) - len(unique_articles)
    if removed > 0:
        print(f"去重: 移除 {removed} 篇重复文章")

    return unique_articles

def load_history():
    """加载历史记录"""
    history_file = Path(__file__).parent / "rss_history.json"
    if history_file.exists():
        with open(history_file, 'r', encoding='utf-8') as f:
            return set(json.load(f))
    return set()

def save_history(articles):
    """保存历史记录"""
    history_file = Path(__file__).parent / "rss_history.json"
    history = load_history()

    for article in articles:
        article_hash = get_article_hash(article['title'], article['url'])
        history.add(article_hash)

    with open(history_file, 'w', encoding='utf-8') as f:
        json.dump(list(history), f, ensure_ascii=False)

def filter_new_articles(articles, history):
    """过滤掉已处理过的文章"""
    new_articles = []
    for article in articles:
        article_hash = get_article_hash(article['title'], article['url'])
        if article_hash not in history:
            new_articles.append(article)
    return new_articles

# ============ AI 摘要 ============

def get_api_config():
    """获取 API 配置"""
    # Minimax
    api_key = os.getenv("MINIMAX_API_KEY")
    if api_key:
        return {
            "provider": "minimax",
            "api_key": api_key,
            "model": os.getenv("MINIMAX_MODEL", "MiniMax-Text-01"),
            "base_url": os.getenv("MINIMAX_BASE_URL", "https://api.minimax.chat")
        }

    # 火山引擎
    api_key = os.getenv("VOLC_API_KEY")
    base_url = os.getenv("VOLC_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
    model_id = os.getenv("VOLC_MODEL_ID", "deepseek-v3-2-251201")

    if api_key:
        return {
            "provider": "volcengine",
            "api_key": api_key,
            "base_url": base_url,
            "model_id": model_id
        }

    # OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return {
            "provider": "openai",
            "api_key": api_key,
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        }

    return None

def generate_summary(article, api_config):
    """调用 AI 生成摘要"""
    if not api_config:
        return "（未配置 API Key）"

    provider = api_config.get("provider")

    try:
        if provider == "volcengine":
            return generate_summary_volc(article, api_config)
        elif provider == "openai":
            return generate_summary_openai(article, api_config)
        elif provider == "minimax":
            return generate_summary_minimax(article, api_config)
        else:
            return "（未知 API 提供商）"
    except Exception as e:
        return f"摘要生成失败: {str(e)[:50]}"

def generate_summary_openai(article, config):
    """调用 OpenAI API"""
    from openai import OpenAI

    client = OpenAI(api_key=config["api_key"])

    prompt = f"""请阅读以下文章信息，然后生成一个中文摘要：

标题：{article['title']}
来源：{article['source']}
发布时间：{article['published'][:10] if article['published'] else '未知'}
内容摘要：{article['summary']}

请生成：
1. 一句话概括文章核心内容（不超过50字）
2. 这篇文章适合谁阅读
3. 文章的三个核心观点（每个不超过20字）

请用中文回复，格式清晰。"""

    response = client.chat.completions.create(
        model=config.get("model", "gpt-4o-mini"),
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600
    )

    return response.choices[0].message.content

def generate_summary_volc(article, config):
    """调用火山引擎 API"""
    import requests

    url = f"{config['base_url']}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }

    prompt = f"""请阅读以下文章信息，然后生成一个中文摘要：

标题：{article['title']}
来源：{article['source']}
发布时间：{article['published'][:10] if article['published'] else '未知'}
内容摘要：{article['summary']}

请生成：
1. 一句话概括文章核心内容（不超过50字）
2. 这篇文章适合谁阅读
3. 文章的三个核心观点（每个不超过20字）

请用中文回复，格式清晰。"""

    data = {
        "model": config["model_id"],
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600
    }

    response = requests.post(url, headers=headers, json=data, timeout=30)
    result = response.json()

    if "choices" in result and len(result["choices"]) > 0:
        return result["choices"][0]["message"]["content"]
    else:
        return f"API 返回异常: {str(result)[:100]}"

def generate_summary_minimax(article, config):
    """调用 Minimax API"""
    import requests

    url = f"{config['base_url']}/v1/text/chatcompletion_v2"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }

    prompt = f"""请阅读以下文章信息，然后生成一个中文摘要：

标题：{article['title']}
来源：{article['source']}
发布时间：{article['published'][:10] if article['published'] else '未知'}
内容摘要：{article['summary']}

请生成：
1. 一句话概括文章核心内容（不超过50字）
2. 这篇文章适合谁阅读
3. 文章的三个核心观点（每个不超过20字）

请用中文回复，格式清晰。"""

    data = {
        "model": config["model"],
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600
    }

    response = requests.post(url, headers=headers, json=data, timeout=30)
    result = response.json()

    if "choices" in result and len(result["choices"]) > 0:
        return result["choices"][0]["message"]["content"]
    else:
        return f"API 返回异常: {str(result)[:100]}"

# ============ 主流程 ============

def generate_markdown(results):
    """生成 Markdown 文件"""
    output_file = Path(__file__).parent / f"daily_digest_{datetime.now().strftime('%Y%m%d')}.md"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# 每日 AI 阅读简报\n\n")
        f.write(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**关键词**: {', '.join(KEYWORDS)}\n\n")
        f.write(f"**文章数量**: {len(results)} 篇\n\n")
        f.write("---\n\n")

        for i, article in enumerate(results, 1):
            f.write(f"## {i}. {article['title']}\n\n")
            f.write(f"- **来源**: [{article['source']}]({article['source_url']})\n")
            f.write(f"- **发布时间**: {article['published'][:10] if article['published'] else '未知'}\n")
            f.write(f"- **原文链接**: [查看原文]({article['url']})\n\n")
            f.write(f"### AI 摘要\n{article['ai_summary']}\n\n")
            f.write("---\n\n")

    return output_file

def main():
    print("=" * 60)
    print("AI RSS 阅读助手 MVP - 优化版")
    print("=" * 60)

    # 检查 API 配置
    api_config = get_api_config()
    if api_config:
        print(f"✓ 已配置 API: {api_config['provider']} - {api_config.get('model_id') or api_config.get('model')}")
    else:
        print("⚠ 未配置 API Key，将只输出原始匹配结果")
        print("  请在 .env 文件中配置 OPENAI_API_KEY 或 VOLC_API_KEY")

    print(f"\n📰 关键词: {', '.join(KEYWORDS)}")
    print(f"📅 时间范围: 最近 {DAYS_BACK} 天")
    print(f"📂 RSS 源: {len(RSS_SOURCES)} 个")
    print()

    # 1. 并发抓取
    articles = get_articles_parallel(max_workers=15)

    if not articles:
        print("\n没有找到符合条件的文章")
        return

    # 2. 去重
    articles = deduplicate(articles)

    # 3. 过滤已读
    history = load_history()
    new_articles = filter_new_articles(articles, history)

    print(f"新文章: {len(new_articles)} 篇（已去重后）")

    if not new_articles:
        print("\n没有新文章需要处理")
        return

    # 4. 限制数量
    if len(new_articles) > MAX_ARTICLES:
        print(f"限制输出为 {MAX_ARTICLES} 篇")
        new_articles = new_articles[:MAX_ARTICLES]

    # 5. 生成 AI 摘要
    if api_config:
        print("\n" + "=" * 60)
        print("AI 摘要生成中...")
        print("=" * 60 + "\n")

        results = []
        for i, article in enumerate(new_articles):
            print(f"[{i+1}/{len(new_articles)}] {article['title'][:40]}...")

            summary = generate_summary(article, api_config)
            article['ai_summary'] = summary
            results.append(article)

            time.sleep(0.3)  # 避免 API 限流
    else:
        results = new_articles
        for article in results:
            article['ai_summary'] = "（未生成 AI 摘要）"

    # 6. 保存结果
    output_file = generate_markdown(results)

    # 7. 更新历史记录
    save_history(results)

    print(f"\n✅ 完成！")
    print(f"📄 已保存到: {output_file}")
    print(f"📊 共处理: {len(results)} 篇文章")

if __name__ == "__main__":
    main()
