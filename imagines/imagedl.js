const fs = require("fs-extra");
const axios = require("axios");
const cheerio = require("cheerio");

const HTML_FILE = "index.html";
const OUTPUT_DIR = "./downloads/images";

function extractImages(html) {
    const $ = cheerio.load(html);
    const images = new Set();

    // ambil img src
    $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (src) images.add(src);
    });

    // ambil background-image dari style inline
    $("[style]").each((_, el) => {
        const style = $(el).attr("style");
        const match = style && style.match(/url\(["']?(.*?)["']?\)/);
        if (match) images.add(match[1]);
    });

    return [...images];
}

async function downloadImage(url, filepath) {
    const res = await axios({ url, responseType: "stream" });

    await fs.ensureDir(require("path").dirname(filepath));

    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filepath);
        res.data.pipe(stream);

        stream.on("finish", resolve);
        stream.on("error", reject);
    });
}

async function run() {
    if (!fs.existsSync(HTML_FILE)) {
        console.log("index.html tidak ditemukan!");
        return;
    }

    const html = fs.readFileSync(HTML_FILE, "utf8");
    const images = extractImages(html);

    console.log("Total gambar ditemukan:", images.length);

    for (let i = 0; i < images.length; i++) {
        const url = images[i];

        try {
            const filename = url.split("/").pop().split("?")[0];
            const path = `${OUTPUT_DIR}/${filename}`;

            console.log("Download:", url);
            await downloadImage(url, path);
        } catch (err) {
            console.log("Gagal:", url);
        }
    }

    console.log("Selesai!");
}

run();