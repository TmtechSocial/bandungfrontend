import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;
import { redirect } from "@sveltejs/kit";


export async function load({ cookies }) {
  // Retrieve session from cookies
  const token = cookies.get("token");
  console.log("Session data:", token);

  // If session exists, redirect to /home
  if (token) {
    console.log("Session found, redirecting to /home");
    throw redirect(302, "/home");
  }

  // If no session, stay on login page
  console.log("Session not found, staying on login page");
  return {};
}

export const actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const dataForm = {
        username: username,
        password: password,
      };

      const headers = {
        "Content-Type": "application/json",
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

      console.log("data saya", data)
  
      // Set cookies to match server-side implementation
      
      cookies.set("token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60, // 3 days
        sameSite: "strict",
      });

      cookies.set("cmisAuth", data["cmis-auth"], {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60, // 3 days
        sameSite: "strict",
      });

      cookies.set("user", JSON.stringify(data.user), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict",
      });
  
      cookies.set("groups", JSON.stringify(data.user.groups), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict",
      });

      cookies.set("baseDn", JSON.stringify(data.user.dn), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 3 * 24 * 60 * 60,
        sameSite: "strict",
      });
  
      console.log("Cookies saved (token, user, groups), redirecting");
      throw redirect(302, "/home");
    } catch (err) {
      console.error(err);
      return { error: "An error occurred. Please try again later." };
    }
  },
};
