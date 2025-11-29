import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        https: {
            key: fs.readFileSync('../../../backend/express_camunda/apache-certs/mirorim.ddns.net/privkey1.pem'),
            cert: fs.readFileSync('../../../backend/express_camunda/apache-certs/mirorim.ddns.net/cert1.pem'),
        },
        port: 5010,  // Sesuaikan port jika diperlukan
    },
});
