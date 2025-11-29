import { j as json } from "../../../../chunks/index2.js";
async function POST({ cookies }) {
  cookies.delete("groups", { path: "/" });
  cookies.delete("user", { path: "/" });
  cookies.delete("token", { path: "/" });
  cookies.delete("baseDn", { path: "/" });
  cookies.delete("cmisAuth", { path: "/" });
  return json({ success: true });
}
export {
  POST
};
