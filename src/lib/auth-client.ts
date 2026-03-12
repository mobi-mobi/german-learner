import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
    baseURL: "http://localhost:5173", //process env not working for some reason ToDo...
    plugins: [
        inferAdditionalFields<typeof auth>(),
    ],
});
