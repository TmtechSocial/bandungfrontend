import { json } from '@sveltejs/kit';

export async function POST({ cookies }) {
    // Hapus cookies lainnya
    cookies.delete('groups', { path: '/' });
    cookies.delete('user', { path: '/' });
    cookies.delete('token', { path: '/' });
    cookies.delete('baseDn', { path: '/' });
    cookies.delete('cmisAuth', { path: '/' });

    return json({ success: true });
}
