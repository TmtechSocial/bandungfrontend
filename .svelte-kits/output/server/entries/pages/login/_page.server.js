import axios from "axios";
import { r as redirect } from "../../../chunks/index2.js";
const apiUrl = "https://mirorim.ddns.net:6789/backendBandung/";
async function load({ cookies }) {
  const token = cookies.get("token");
  console.log("Session data:", token);
  if (token) {
    console.log("Session found, redirecting to /home");
    throw redirect(302, "/home");
  }
  console.log("Session not found, staying on login page");
  return {};
}
const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");
    try {
      const dataForm = {
        username,
        password
      };
      const headers = {
        "Content-Type": "application/json"
      };
      const response = await axios.post(
        `${apiUrl}login`,
        dataForm,
        { headers }
      );
      if (response.status !== 200) {
        return { error: "Login failed. Please check your credentials." };
      }
      const data = response.data;
      console.log("data saya", data);
      cookies.set("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        // 3 days
        sameSite: "strict"
      });
      cookies.set("cmisAuth", data["cmis-auth"], {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        // 3 days
        sameSite: "strict"
      });
      cookies.set("user", JSON.stringify(data.user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict"
      });
      cookies.set("groups", JSON.stringify(data.user.groups), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict"
      });
      cookies.set("baseDn", JSON.stringify(data.user.dn), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict"
      });
      console.log("Cookies saved (token, user, groups), redirecting");
      throw redirect(302, "/home");
    } catch (err) {
      console.error(err);
      return { error: "An error occurred. Please try again later." };
    }
  }
};
export {
  actions,
  load
};
