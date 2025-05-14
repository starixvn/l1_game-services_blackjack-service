export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://l2_game_api_awsdr:5000",
        authUrl: "http://l2_auth_api_awsdr:5000",
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
        url: "mongodb://lmn_backend:ilthODrRz8C4s2%5D%7B%7CLV%3Du%5D2vsf6o%5Ex0m@10.88.127.158:37101/?replicaSet=SabaL2DR",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "https://8ac47fca6d3e4a41908896a64ef201ac@scsentry.sgamesuat.com/53",
        logIdentifier: "blackjack",
        env: "UAT",
    },
    authenticateSettings: {
        url: "http://l2_auth_api_awsdr:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://l2_user_service_awsdr:5000",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    roundMaxDuration: 24,
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    enableMsgpackParser: true,
};
