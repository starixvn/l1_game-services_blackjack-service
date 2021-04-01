export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l1_game_api_uat:5000",
        authUrl: "http://l1_auth_api_uat:5000",
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
        url: "http://l1_games_server_uat:5000/api",
        auth: {
            url: "http://l1_auth_api_uat:5000",
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
        url: "mongodb://lmn_backend:LmnBackend%4022027@10.99.99.187:27201/?replicaSet=SabaUAT",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://84728a26e6d64d499bcb8e99fa9bce9b@10.99.99.187:800/133",
        logIdentifier: "blackjack",
        env: "UAT",
    },
    authenticateSettings: {
        audiences: ["api", "admin-api"],
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    enableCorsWs: true,
    corsUrls: ["http://uat.sabagame.com", "https://uat.sabagame.com", "http://uat-adm.sabagame.com", "https://uat-adm.sabagame.com"],
    roundMaxDuration: 24,
};
