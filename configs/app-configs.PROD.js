export default {
    hostingPort: 8001,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://10.99.99.51:8300",
        authUrl: "http://10.99.99.51:8303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4500,
        requestTimeout: 10000, // 10s
        enabledApiLogs: true,
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
    },
    enabledLogs: true,
    database: {
        url:
            "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.3.189.54:27101,10.3.189.53:27102,10.3.189.53:27103/?replicaSet=SabaMain",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://26db550e29da4d038d1bb78ce1b79330@10.99.99.187:803/108",
        logIdentifier: "sedie",
        env: "PROD",
    },
    authenticateSettings: {
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    enableCorsWs: true,
    corsUrls: [
        "http://sabagame.com",
        "http://www.sabagame.com",
        "https://sabagame.com",
        "https://www.sabagame.com",
        "https://www.gamesaba.com",
        "https://gamesaba.com",
        "http://www.gamesaba.com",
        "http://gamesaba.com",
        "http://admg.sabagame.com",
        "https://admg.sabagame.com",
        "http://adm.sabagame.com",
        "https://adm.sabagame.com",
    ],
};
