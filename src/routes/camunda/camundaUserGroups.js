import axios from "axios";

// Use VITE_CAMUNDA_API for browser + SSR
const camundaUrl =
  import.meta.env.VITE_CAMUNDA_API || "https://mirorim.ddns.net:6789/api/";
const ldapUrl = 
    import.meta.env.VITE_LDAP_API || "https://mirorim.ddns.net:6789/ldapapi/";
/**
 * Fetch user groups from Camunda REST API
 * @param {string} userId - The user ID to fetch groups for
 * @returns {Promise<Array>} Array of group objects with id, name, and type
 */
export async function fetchUserGroups(userId) {
  try {
    const url = `${camundaUrl}engine-rest/group?member=${userId}`;
    const resp = await axios.get(url, { timeout: 10000 });

    const groups = Array.isArray(resp.data)
      ? resp.data.map((g) => ({
          id: g.id,
          name: g.name || g.id,
          type: g.type || "",
        }))
      : [];

    return groups;
  } catch (err) {
    console.error(
      "? Error fetching user groups from Camunda REST API:",
      err.message || err
    );

    return [];
  }
}
export async function fetchUser(userId) {
  try {
    const url = `${ldapUrl}users/${encodeURIComponent(userId)}`;
    const resp = await axios.get(url, { timeout: 10000 });
    return resp.data;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
    return [];
  }
}
// optional
export async function closePool() {
  return;
}
