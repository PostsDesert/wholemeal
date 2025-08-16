import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
// import fs from "fs";

// // Detect if running inside Docker and set the backend accordingly
// const pocketbase_url = fs.existsSync("/.dockerenv")
// 	? "http://pb:8089" // docker-to-docker
// 	: "http://127.0.0.1:8090" // localhost-to-localhost

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$component: path.resolve('./src/components')
		}
	},
	server: {
		// proxy: {
		// 	// proxy "/api" and "/_" to pocketbase_url
		// 	"/api": pocketbase_url,
		// 	"/_": pocketbase_url,
		// }
	}
});
