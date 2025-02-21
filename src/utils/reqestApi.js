// cronJob.js
import cron from "cron";
import fetch from "node-fetch";

export async function fetchDataAndPrint(apiEndpoint) {
  try {
    const response = await fetch(apiEndpoint, {
      method: "GET",
    });
    const data = await response.json();

    console.log("request done");
  } catch (error) {
    console.error("حدث خطأ في الاتصال بالـ API:", error.message);
  }
}
export const startjob = () => {
  const job = new cron.CronJob("*/8 * * * *", () => {
    fetchDataAndPrint("https://mohamed-e-commerce-z8yi.onrender.com/user");
  });
  job.start();
};
