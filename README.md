# 🕷️ Xcrap Axios Client

**Xcrap Axios Client** is a package of the Xcrap framework that implements an HTTP client using the [Axios](https://www.npmjs.com/package/axios) library.

## 📦 Installation

There are no secrets to installing it, just use your favorite dependency manager. Here is an example using NPM:

```cmd
npm i @xcrap/axios-client @xcrap/core @xcrap/parser
```

> You need to install `@xcrap/core` and `@xcrap/parser` as well because I left them as `peerDependencies`, which means that the package needs `@xcrap/core` and `@xcrap/parser` as dependencies, however, the ones that the user has installed in the project will be used.

## 🚀 Usage

Like any HTTP client, `AxiosClient` has two methods: `fetch()` to make a request for a specific URL and `fetchMany()` to make requests for multiple URLs at the same time, being able to control concurrency and delays between requests. #### Example usage

```ts
import { AxiosClient } from "@xcrap/axios-client"
import { extract } from "@xcrap/parser"

;(async() => { 
    const client = new AxiosClient() 
    const url = "https://example.com" 
    const response = await client.fetch({ url: url }) 
    const parser = response.asHtmlParser() 
    const pageTitle = await parser.parseFist({ query: "title", extractor: extract("innerText") }) 

    console.log("Page Title:", pageTitle)
})();
```

Adding a proxy

In an HTTP client that extends `BaseClient` we can add a proxy in the constructor as we can see in the following example:

1. **Providing a `proxy` object:

```ts
const client = new AxiosClient({
    proxy: {
        host: "47.251.122.81",
        port: "8888",
        protocol: "http"
    }
})
```

2. **Providing a function that will generate a `proxy`:**

```ts
function randomProxy() {
    const proxies = [
        {
            host: "47.251.122.81",
            port: "8888",
            protocol: "http"
        },
        {
            host: "159.203.61.169",
            port: "3128",
            protocol: "http"
        }
    ]

    const randomIndex = Math.floor(Math.random() * proxies.length)

    return proxies[randomIndex]
}

const client = new AxiosClient({ proxy: randomProxy })
```
#### Using a custom User Agent

In a client that extends `BaseClient` we can also customize the `User-Agent` of the requests. We can do this in two ways:

1. **By providing a `userAgent` string:

```ts
const client = new AxiosClient({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" })
```

2. **By providing a function that will generate a `userAgent`:**

```ts
function randomUserAgent() {
    const userAgents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_8_4; like Mac OS X) AppleWebKit/603.37 (KHTML, like Gecko) Chrome/54.0.1244.188 Mobile Safari/601.5", "Mozilla/5.0 (Windows NT 10.3;; en-US) AppleWebKit/537.35 (KHTML, like Gecko) Chrome/47.0.1707.185 Safari/601"
    ]

    const randomIndex = Math.floor(Math.random() * userAgents.length)

    return userAgents[randomIndex]
}

const client = new AxiosClient({ userAgent: randomUserAgent })
```

#### Using custom Proxy URL

In a client that extends `BaseClient` we can use proxy URLs, I don't know how to explain to you how they work, but I kind of discovered this kind of porxy when I was trying to solve the CORS problem by making a request on the client side, and then I met the *CORS Proxy*. Here I have a [template](https://gist.github.com/marcuth/9fbd321b011da44d1287faae31a8dd3a) for one for CloudFlare Workers in case you want to roll your own.

Well, we can do it the same way we did with `userAgent`:

1. **Providing a `proxyUrl` string:

```ts
const client = new AxiosClient({ proxyUrl: "https://my-proxy-app.my-username.workers.dev" })
```

2. **Providing a function that will generate a `proxyUrl`:**

```ts
function randomProxyUrl() {
    const proxyUrls = [
        "https://my-proxy-app.my-username-1.workers.dev",
        "https://my-proxy-app.my-username-2.workers.dev"
    ]

    const randomIndex = Math.floor(Math.random() * proxyUrls.length)

    return proxyUrls[randomIndex]
}

const client = new AxiosClient({ proxyUrl: randomProxyUrl })
```

## 🤝 Contributing

- Want to contribute? Follow these steps:
- Fork the repository.
- Create a new branch (git checkout -b feature-new).
- Commit your changes (git commit -m 'Add new feature').
- Push to the branch (git push origin feature-new).
- Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.