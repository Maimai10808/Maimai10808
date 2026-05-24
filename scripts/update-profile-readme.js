const fs = require("fs");
const https = require("https");

const README_PATH = "README.md";

const BLOG_FEED_URL =
  "https://raw.githubusercontent.com/Maimai10808/blog_pages/main/blog-feed.json";

const START = "<!-- BLOG-POST-LIST:START -->";
const END = "<!-- BLOG-POST-LIST:END -->";

const MAX_POSTS = 5;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}. Status code: ${res.statusCode}`));
          return;
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function updateReadme() {
  if (!fs.existsSync(README_PATH)) {
    throw new Error("README.md not found.");
  }

  const readme = fs.readFileSync(README_PATH, "utf8");

  if (!readme.includes(START) || !readme.includes(END)) {
    throw new Error("README blog markers not found.");
  }

  const feed = await fetchJson(BLOG_FEED_URL);

  const posts = Array.isArray(feed.posts) ? feed.posts : [];

  const latestPosts = posts.slice(0, MAX_POSTS);

  const blogList = latestPosts
    .map((post) => {
      return `- [${post.title}](${post.githubUrl})`;
    })
    .join("\n");

  const updatedReadme = readme.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    `${START}\n${blogList}\n${END}`
  );

  fs.writeFileSync(README_PATH, updatedReadme);

  console.log(`Updated README with ${latestPosts.length} latest blog posts.`);
}

updateReadme().catch((error) => {
  console.error(error);
  process.exit(1);
});
