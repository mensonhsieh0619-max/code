// Dev-only lint config — catches bugs like accidentally redeclaring a
// function twice in shared.js, where only the last declaration ever runs.
// Does not affect the app itself: it still runs by opening index.html directly.
module.exports = [
    {
        files: ["shared.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                window: "readonly",
                document: "readonly",
                localStorage: "readonly",
                navigator: "readonly",
                console: "readonly",
                fetch: "readonly",
                crypto: "readonly",
                URL: "readonly",
                Blob: "readonly",
                Chart: "readonly",
                qrcode: "readonly",
                self: "readonly",
                caches: "readonly"
            }
        },
        rules: {
            "no-redeclare": ["error", { builtinGlobals: false }],
            "no-dupe-keys": "error",
            "no-func-assign": "error"
        }
    }
];
