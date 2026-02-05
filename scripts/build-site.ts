import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Manual .env loading
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        if (line.trim().startsWith('#')) return;
        const [key, ...values] = line.split('=');
        const val = values.join('=');
        if (key && val && !process.env[key.trim()]) {
            process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
        }
    });
}

import type { MoltbookClient, Comment } from '../src/moltbook.js';

// --- Interfaces ---
interface ActivityEntry {
    action: string;
    params?: Record<string, string>;
    result: string;
    details?: {
        postId?: string;
        postTitle?: string;
        postContent?: string;
        [key: string]: string | undefined;
    };
    timestamp: string;
}

interface RunLog {
    runId: string;
    startTime: string;
    activities: ActivityEntry[];
}

interface ActivityLogData {
    runs: RunLog[];
}

interface InteractionState {
    repliedCommentIds: string[];
    postSnapshots: any[];
    spamUsernames: string[];
}

interface ArchivedPost {
    id: string;
    title: string;
    content: string;
    url: string | null;
    tags: string[];
    readTime: number;
    date: string;       
    timestamp: string;  
    comments: Comment[];
    lastUpdated: number;
}

type PostArchive = Record<string, ArchivedPost>;

// --- Constants ---
const DATA_FILE = path.join(ROOT_DIR, 'data', 'activity-log.json');
const INTERACTION_STATE_FILE = path.join(ROOT_DIR, 'data', 'interaction-state.json');
const ARCHIVE_FILE = path.join(ROOT_DIR, 'data', 'posts-archive.json');
const TEMPLATE_FILE = path.join(ROOT_DIR, 'src', 'web', 'template.html');
const STYLE_FILE = path.join(ROOT_DIR, 'src', 'web', 'style.css');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// --- Icons (Lucide SVGs) ---
const ICONS = {
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    tag: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    message: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
};

// --- Helper Functions ---
function formatDateTime(isoString: string): { date: string, time: string, fullDate: string } {
    const date = new Date(isoString);
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const y = beijingTime.getUTCFullYear();
    const m = (beijingTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const d = beijingTime.getUTCDate().toString().padStart(2, '0');
    return {
        date: `${y}-${m}-${d}`,
        time: beijingTime.toISOString().substring(11, 16),
        fullDate: `${y}年${m}月${d}日`
    };
}

function generateTags(content: string, title: string): string[] {
    const tags = new Set<string>(['Life']);
    const text = (content + title).toLowerCase();
    const keywords: Record<string, string[]> = {
        'Gaming': ['game', 'steam', 'play', '游戏', '老头环', '原神', 'epic'],
        'Study': ['study', 'learn', 'book', '学', '复习', '考试', 'ddl', '作业'],
        'Tech': ['code', 'ai', 'gpt', 'bug', '代码', '程序', 'web3'],
        'Food': ['eat', 'food', 'drink', '吃', '喝', '食堂', '外卖', '饭'],
        'Social': ['friend', 'chat', '室友', '聊天', '社交', '社死', '群']
    };
    for (const [tag, words] of Object.entries(keywords)) {
        if (words.some(w => text.includes(w))) tags.add(tag);
    }
    return Array.from(tags).slice(0, 3);
}

function estimateReadTime(content: string): number {
    return Math.max(1, Math.ceil(content.length / 300));
}

function getSpamUsers(): Set<string> {
    try {
        if (fs.existsSync(INTERACTION_STATE_FILE)) {
            const data: InteractionState = JSON.parse(fs.readFileSync(INTERACTION_STATE_FILE, 'utf-8'));
            return new Set(data.spamUsernames || []);
        }
    } catch (e) {
        console.warn('⚠️ Failed to read interaction state for spam users:', e);
    }
    return new Set();
}

function loadArchive(): PostArchive {
    if (fs.existsSync(ARCHIVE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf-8'));
        } catch (e) {
            console.error('⚠️ Failed to load archive:', e);
        }
    }
    return {};
}

function saveArchive(archive: PostArchive) {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
    console.log('💾 Archive saved.');
}

async function fetchPostIdMap(apiKey: string): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!apiKey) return map;
    try {
        console.log('🔍 Fetching recent posts to recover IDs...');
        const { MoltbookClient } = await import('../src/moltbook.js');
        const client = new MoltbookClient(apiKey);
        const { posts } = await (client as any).getMyPosts();
        if (posts && Array.isArray(posts)) {
            for (const post of posts) map.set(post.title, post.id);
        }
        console.log(`✅ Recovered ${map.size} post IDs.`);
    } catch (e) {
        console.warn('⚠️ Failed to recover post IDs:', e);
    }
    return map;
}

// --- Main Build Logic ---
async function build() {
    console.log('🏗️ Starting Pro Max build with Persistence...');

    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    if (fs.existsSync(STYLE_FILE)) {
         fs.copyFileSync(STYLE_FILE, path.join(DIST_DIR, 'style.css'));
    }

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found');
        process.exit(1);
    }

    const logData: ActivityLogData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const archive = loadArchive();
    const apiKey = process.env.MOLTBOOK_API_KEY;
    const spamUsers = getSpamUsers();

    let client: any = null;
    let postIdMap = new Map<string, string>();

    if (apiKey) {
        const { MoltbookClient } = await import('../src/moltbook.js');
        client = new MoltbookClient(apiKey);
        postIdMap = await fetchPostIdMap(apiKey);
    }

    console.log('🔄 Merging activity logs into archive...');
    const runs = logData.runs;
    
    for (const run of runs) {
        if (!run.activities) continue;
        for (const activity of run.activities) {
            if (activity.action === 'CREATE_POST') {
                const details = activity.details || {};
                const title = details.postTitle || '无标题碎片';
                const content = details.postContent || title;
                
                if (title === '无标题碎片' && content === '无标题碎片') continue;

                let id = details.postId || postIdMap.get(title);
                if (!id) {
                    const hash = crypto.createHash('md5').update(title + (activity.timestamp || '')).digest('hex').substring(0, 8);
                    id = `local-${hash}`;
                }
                
                if (!id) continue;

                if (!archive[id]) {
                    const timestamp = activity.timestamp || run.startTime;
                    const { fullDate } = formatDateTime(timestamp);
                    
                    archive[id] = {
                        id,
                        title,
                        content,
                        url: id.startsWith('local-') ? null : `https://www.moltbook.com/post/${id}`,
                        tags: generateTags(content, title),
                        readTime: estimateReadTime(content),
                        date: fullDate,
                        timestamp: timestamp,
                        comments: [],
                        lastUpdated: 0
                    };
                }
            }
        }
    }

    if (client) {
        console.log('🌐 Syncing comments from API...');
        const postsToUpdate = Object.values(archive)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50);

        for (const post of postsToUpdate) {
            try {
                const { comments } = await client.getPostComments(post.id);
                post.comments = comments;
                post.lastUpdated = Date.now();
                await new Promise(r => setTimeout(r, 50)); 
            } catch (e) {
                 // ignore
            }
        }
    }

    saveArchive(archive);

    console.log('🎨 Generating Liquid Feed HTML...');
    
    const sortedPosts = Object.values(archive).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let htmlContent = '';
    const authorName = "DominoJr";
    const authorAvatar = "http://q1.qlogo.cn/g?b=qq&nk=2033886359&s=100";

    for (const post of sortedPosts) {
        const tagsHtml = post.tags.map(t => `<span class="tag">${ICONS.tag} ${t}</span>`).join('');
        const commentsHtml = buildCommentsHtml(post.comments, spamUsers, post.id);
        const commentCount = post.comments ? post.comments.length : 0;
        const realCommentCount = post.comments ? post.comments.filter(c => !c.author?.name || !spamUsers.has(c.author.name)).length : 0;

        htmlContent += `
        <article class="feed-item" data-id="${post.id}">
            <div class="feed-header">
                <img src="${authorAvatar}" class="feed-avatar" alt="${authorName}">
                <div class="feed-meta">
                    <span class="feed-author">${authorName}</span>
                    <span class="feed-time">
                        ${ICONS.clock} ${post.date} · ${post.readTime} min read
                    </span>
                </div>
            </div>

            <div class="feed-body">
                <h3 class="feed-title">${post.url ? `<a href="${post.url}" target="_blank">${post.title}</a>` : post.title}</h3>
                
                <div class="feed-content-wrapper collapsed" id="post-${post.id}">
                    <div class="feed-content">
                        ${post.content.replace(/\n/g, '<br>')}
                    </div>
                    <div class="expand-overlay"></div>
                </div>
                
                <button class="expand-btn" onclick="togglePost('${post.id}')">
                    <span class="btn-text">展开全文</span>
                    <span class="btn-icon">${ICONS.chevronDown}</span>
                </button>
            </div>

            <div class="feed-footer">
                <div class="feed-tags">${tagsHtml}</div>
                <div class="feed-actions">
                     <span class="action-item" onclick="toggleComments('${post.id}')">
                        ${ICONS.message} ${realCommentCount} 评论
                     </span>
                </div>
            </div>

            ${commentsHtml}
        </article>`;
    }

    if (sortedPosts.length === 0) {
        htmlContent = `<div class="empty-state">
            <div class="empty-icon">${ICONS.sparkles}</div>
            <h3>信号静默中</h3>
            <p>Waiting for incoming transmission...</p>
        </div>`;
    }

    let profile = { avatar: authorAvatar, bio: 'MoltBook 驻场观察员', karma: 0, followers: 0, following: 0 };
    
    if (client) {
         try {
            const { agent } = await client.getAgentProfile();
            profile.karma = agent.karma || 0;
            profile.followers = agent.follower_count || 0;
             profile.following = agent.following_count || 0;
        } catch (error) {}
    }

    let template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
    template = template.replaceAll('<!-- AVATAR_URL -->', profile.avatar);
    template = template.replaceAll('<!-- BIO_TEXT -->', profile.bio);
    template = template.replaceAll('<!-- KARMA -->', profile.karma.toString());
    template = template.replaceAll('<!-- FOLLOWERS -->', profile.followers.toString());
    template = template.replaceAll('<!-- FOLLOWING -->', profile.following.toString());
    
    template = template.replace('href="style.css"', `href="style.css?v=${Date.now()}"`);
    template = template.replace('<!-- CONTENT_PLACEHOLDER -->', htmlContent);
    template = template.replace('<!-- TIME_PLACEHOLDER -->', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), template);
    fs.writeFileSync(path.join(DIST_DIR, 'CNAME'), 'jr.dominoh.com');
    
    console.log(`✅ Liquid Feed Build complete! Generated ${sortedPosts.length} posts.`);
}

function buildCommentsHtml(comments: Comment[], spamUsers: Set<string>, postId: string): string {
    // Recursively flatten comments to valid array
    const allComments: Comment[] = [];
    function flatten(items: Comment[]) {
        for (const item of items) {
            allComments.push(item);
            const nested = (item as any).replies;
            if (nested && nested.length > 0) {
                flatten(nested);
            }
        }
    }
    flatten(comments);

    // Filter spam, but perform a whitelist check for the Author "DominoJunior" just in case.
    const validComments = allComments.filter(c => {
        const name = c.author?.name;
        if (!name) return true; // Keep anonymous? Or filter? Let's keep for now.
        if (name === 'DominoJunior' || name === 'MoltBook Agent') return true; // Whitelist
        return !spamUsers.has(name);
    });

    if (validComments.length === 0) return '';

    type CommentNode = Comment & { children: CommentNode[] };
    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    validComments.forEach(c => commentMap.set(c.id, { ...c, children: [] } as CommentNode));
    validComments.forEach(c => {
        const node = commentMap.get(c.id)!;
        if (c.parent_id && commentMap.has(c.parent_id)) {
            commentMap.get(c.parent_id)!.children.push(node);
        } else {
            rootComments.push(node);
        }
    });

    function renderNode(node: CommentNode, level: number = 0): string {
        const author = node.author?.name || '匿名用户';
        const dateObj = node.created_at ? new Date(node.created_at) : new Date();
        const date = `${dateObj.getMonth()+1}/${dateObj.getDate()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        const isMe = author === 'DominoJr' || author === 'MoltBook Agent';
        const contentsafe = (node.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let html = `
        <div class="comment-item ${level > 0 ? 'is-reply' : ''} ${isMe ? 'is-me' : ''}">
            <div class="comment-avatar-placeholder">${ICONS.user}</div>
            <div class="comment-main">
                <div class="comment-meta">
                    <span class="comment-author">${author}</span>
                    <span class="comment-list-time">${date}</span>
                </div>
                <div class="comment-text">${contentsafe}</div>
                ${node.children.length > 0 ? 
                    `<div class="comment-replies">
                        ${node.children.map(child => renderNode(child, level + 1)).join('')}
                    </div>` 
                : ''}
            </div>
        </div>`;
        return html;
    }

    let html = `<div class="feed-comments hidden" id="comments-${postId}">`; 
    rootComments.forEach(root => html += renderNode(root));
    html += '</div>';

    return html;
}

build().catch(console.error);
