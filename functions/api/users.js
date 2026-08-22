// functions/api/users.js
export async function onRequest(context) {
    const { request, env } = context;

    // 只允许 GET 请求
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 从环境变量读取 Supabase 配置（需要在 Cloudflare Pages 中设置）
    const SUPABASE_URL = env.PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 1. 使用 service_role key 获取所有用户列表
        const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        if (!usersRes.ok) {
            throw new Error(`Supabase admin API error: ${usersRes.status}`);
        }
        const usersData = await usersRes.json();

        // 2. 获取所有用户的额外信息（从 profiles 表）
        const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        let profiles = [];
        if (profilesRes.ok) {
            profiles = await profilesRes.json();
        }

        // 3. 合并数据
        const userList = usersData.users.map(user => {
            const profile = profiles.find(p => p.id === user.id) || {};
            return {
                id: user.id,
                email: user.email,
                username: profile.username || user.user_metadata?.username || '未命名',
                login_count: profile.login_count || 0,
                last_seen: profile.last_seen || null,
                created_at: user.created_at,
            };
        });

        // 4. 获取在线用户 ID 列表（这里需要和 index1 的 Presence 频道保持一致）
        // 由于无法直接从 Supabase API 获取 Presence 状态，我们通过另一个渠道获取
        // 这里我们返回一个空数组，前端会通过 Presence 自己更新在线状态
        // 但更好的做法是前端将在线状态通过 Presence 同步，然后这里可以查询
        // 为了简化，我们返回一个空数组，前端会在 loadUserData 后通过 Presence 更新在线状态
        // 但实际上我们可以在前端拿到 Presence 状态后，再刷新表格
        // 所以我们这里只返回用户数据，在线状态由前端控制

        return new Response(JSON.stringify({
            users: userList,
            // onlineIds 由前端通过 Presence 自行维护
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}