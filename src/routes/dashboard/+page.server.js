import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

const METABASE_SITE_URL = "https://mirorim.ddns.net/mb";
const METABASE_SECRET_KEY = "0961d716ebbab8a0d53ece34fb5c9084e3cf7ef2682bd0761d230e1ec7ee1447";

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
    const payload = {
        resource: { question: 1587 },
        params: {
        first_name: userData.firstName
        },
        exp: Math.floor(Date.now() / 1000) + 600
    };
    const metabaseToken = jwt.sign(payload, METABASE_SECRET_KEY);
  
    const iframeUrl =
      `${METABASE_SITE_URL}/embed/question/${metabaseToken}` +
      `#bordered=false&titled=false`;
    // Return data ke frontend
    return {
        sessionData: {
            token,
            user: userData,
            groups: groupData,
            baseDn,
            cmisAuth,
        },
    iframeUrl
    };
}
