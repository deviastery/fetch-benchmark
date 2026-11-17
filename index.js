const https = require("https");
const http = require("http");

const url = process.argv[2];
const ITERATIONS = 10;

if (!url) {
  console.error("Ошибка: не указан URL.\nИспользование: node index.js <URL>");
  process.exit(1);
}

const client = url.startsWith("https") ? https : http;

function download(targetUrl) {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    client
      .get(targetUrl, (res) => {
        let downloadedBytes = 0;

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP Status Code: ${res.statusCode}`));
        }

        res.on("data", (chunk) => {
          downloadedBytes += chunk.length;
        });

        res.on("end", () => {
          const end = performance.now();
          resolve({
            timeMs: end - start,
            bytes: downloadedBytes,
          });
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function run() {
  console.log(`Начинаем тестирование для: ${url}`);
  let totalBytes = 0;
  let totalTimeMs = 0;

  for (let i = 1; i <= ITERATIONS; i++) {
    process.stdout.write(`[${i}/${ITERATIONS}] Скачивание... `);
    try {
      const result = await download(url);
      totalBytes += result.bytes;
      totalTimeMs += result.timeMs;
      console.log(
        `Готово за ${(result.timeMs / 1000).toFixed(2)} с. (${(result.bytes / 1024 / 1024).toFixed(2)} МБ)`,
      );
    } catch (e) {
      console.log(`Ошибка: ${e.message}`);
      return;
    }
  }

  const avgTimeMs = totalTimeMs / ITERATIONS;
  const totalTimeSec = totalTimeMs / 1000;
  const totalMegabytes = totalBytes / (1024 * 1024);
  const speedMBps = totalMegabytes / totalTimeSec;

  console.log("\n--- Результаты ---");
  console.log(`Общий объём скачанных данных: ${totalMegabytes.toFixed(2)} МБ`);
  console.log(`Среднее время запроса: ${(avgTimeMs / 1000).toFixed(2)} с.`);
  console.log(
    `Средняя скорость скачивания: ${speedMBps.toFixed(2)} МБ/с (Мегабайт в секунду)`,
  );
}

run();
