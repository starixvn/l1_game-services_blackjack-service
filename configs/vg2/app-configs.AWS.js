export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l2_game_api_AWS:5000",
        authUrl: "http://l2_auth_api_AWS:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4000,
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
        url: "mongodb://lmn_backend:ilthODrRz8C4s2%5D%7B%7CLV%3Du%5D2vsf6o%5Ex0m@10.99.99.56:37101/?replicaSet=L2_SabaAWS&appName=Blackjack",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://5e3ac415a1b0485eb78da0e7b0327225@10.99.99.187:803/118",
        logIdentifier: "blackjack",
        env: "AWS",
    },
    authenticateSettings: {
        url: "http://l2_auth_api_AWS:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://localhost:8004/api",
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    roundMaxDuration: 24,
};
