import { r as redirect } from "../../../chunks/index2.js";
async function load({ cookies }) {
  const token = cookies.get("token");
  const user = cookies.get("user");
  const groups = cookies.get("groups");
  const baseDn = cookies.get("baseDn");
  const cmisAuth = cookies.get("cmisAuth");
  if (!token || !user || !groups || !baseDn || !cmisAuth) {
    console.log("Salah satu cookie (token, user, groups, baseDn, cmisAuth) tidak ditemukan.");
    throw redirect(302, "/login");
  }
  let userData, groupData;
  try {
    console.log("users", user);
    userData = JSON.parse(user);
    groupData = JSON.parse(groups);
    console.log("groupData", groupData[0].name);
  } catch (e) {
    console.error("Gagal mem-parsing cookie:", e.message);
    throw redirect(302, "/login");
  }
  return {
    sessionData: {
      token,
      user: userData,
      groups: groupData,
      baseDn,
      cmisAuth
    }
  };
}
export {
  load
};
