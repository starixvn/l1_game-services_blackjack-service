export default {
    hostingPort: 8003,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://10.2.189.50:8300",
        authUrl: "http://10.2.189.50:8303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4500,
        requestTimeout: 10000, // 10s
        enabledApiLogs: true,
    },
    mainServerApiSettings: {
        url: "http://10.2.189.50:8888/main/api",
        auth: {
            url: "http://10.2.189.50:8303",
            id: "game-services",
            secret: "gameservices@20luminet&",
        },
        requestTimeout: 10000,
        placeBetTimeout: 4500,
        useAuthenticate: true,
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
            "mongodb://lmn_backend:M7K4ttH%2AtZ3ml%3F%29%7CA%5DjN4%3FLBhwF%266IO%3C@10.99.99.54:27101,10.99.99.53:27102/?replicaSet=SabaMain",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://a983bd0c1502412887e17c2205e8bc70@10.99.99.187:803/110",
        logIdentifier: "blackjack",
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
    roundMaxDuration: 24,
};
