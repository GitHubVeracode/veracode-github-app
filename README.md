# veracode-probot-app

> A GitHub App built with [Probot](https://github.com/probot/probot) that Veracode Github app in probot framework

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t veracode-probot-app .

# 2. Start container
#For new Github application 
docker run -dp 127.0.0.1:3000:3000 veracode-probot-app

#For existing Github application 
docker run -e APP_ID=<app-id> -e WEBHOOK_SECRET=<webhook-secret> -e GITHUB_CLIENT_ID=<github-client-id> -e GITHUB_CLIENT_SECRET=<github-client-secret> -e PRIVATE_KEY=<pem-value> -dp 127.0.0.1:3000:3000 veracode-probot-app
```

## Contributing

If you have suggestions for how veracode-probot-app could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2023 Shailesh Hande