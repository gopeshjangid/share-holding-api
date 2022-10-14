module.exports = {
	apps: [
		{
			instances: 1,
			name: "my-app",
			exec_mode: "cluster",
			script: "./index.js",
			env_production: {
				NODE_ENV: "production",
			},
			env_development: {
				NODE_ENV: "development",
			},
			max_restarts: 10,
		},
	],
};
