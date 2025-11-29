import { redirect } from "@sveltejs/kit";

export async function load({ cookies }) {
    // Debug semua cookie untuk memastikan diterima

    // Ambil nilai cookie
    const token = cookies.get("token");
    const user = cookies.get("user");
    const groups = cookies.get("groups");
    const baseDn = cookies.get("baseDn");
    const cmisAuth = cookies.get("cmisAuth");

    // Cek jika salah satu cookie tidak ada
    if (!token || !user || !groups || !baseDn || !cmisAuth) {
        console.log("Salah satu cookie (token, user, groups, baseDn, cmisAuth) tidak ditemukan.");
        
        throw redirect(302, "/login");
    }
    
    let userData, groupData;
    try {
        console.log("users", user);
        // Parse user dan groups yang bertipe JSON string
        userData = JSON.parse(user);
        groupData = JSON.parse(groups);
    } catch (e) {
        console.error("Gagal mem-parsing cookie:", e.message);
        throw redirect(302, "/login");
    }

    // Return data ke frontend
    return {
        sessionData: {
            token,
            user: userData,
            groups: groupData,
            baseDn,
            cmisAuth,
        },
    };
}

