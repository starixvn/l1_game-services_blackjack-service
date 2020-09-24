export default {
    hostingPort: 6001,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://10.99.99.101:6300",
        authUrl: "http://10.99.99.101:6303",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4500,
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
        url: "mongodb://lmn_backend:LmnBackend%40517@10.99.99.187:27301/?replicaSet=SabaSIT",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    sentry: {
        sentryUrl: "http://ad4ae5bf7b34446daddaa328b3c59e47@10.99.99.187:800/121",
        logIdentifier: "vipsedie",
        env: "SIT",
    },
    authenticateSettings: {
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    enableCorsWs: true,
    corsUrls: [
        "http://localhost:7456",
        "http://sit.sabagame.com",
        "https://sit.sabagame.com",
        "https://sit-admg.sabagame.com",
        "http://sit-adm.sabagame.com",
        "https://sit-adm.sabagame.com",
    ],
};
