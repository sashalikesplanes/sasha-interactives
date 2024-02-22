import { ApiHandler } from "sst/node/api";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import mqtt from "mqtt";
import { S3, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { Bucket } from "sst/node/bucket";
import crypto from "crypto";
import sharp from "sharp";
import Jimp from "jimp";

const DALLE_USE_HQ = Config.DALLE_USE_HQ === "true";
const openaiClient = new OpenAI({
  apiKey: Config.OPENAI_SECRET_KEY
});

const mqttClient = await mqtt.connectAsync(`mqtt://${Config.HIVEMQ_URL}`, {
  username: Config.HIVEMQ_USERNAME,
  protocol: 'mqtts',
  port: 8883,
  password: Config.HIVEMQ_PASSWORD,
});

const FINAL_WIDTH = 64;
const FINAL_HEIGHT = 64;

const EMOTIONS = "admiration, adoration, appreciation of beauty, amusement, anger, anxiety, awe, awkwardness, boredom, calmness, confusion, craving, disgust, empathic pain, entrancement, excitement, fear, horror, interest, joy, nostalgia, relief, sadness, satisfaction, surprise".split(",");

const s3Client = new S3({ region: "eu-west-1" });

export const generateAndDispatch = ApiHandler(async (_evt) => {
  const req = _evt.body ? JSON.parse(_evt.body) : {};
  const emotion = req.emotion || EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  console.log(`Generating image for emotion: ${emotion}`);
  const res = await openaiClient.images.generate({
    n: 1,
    size: DALLE_USE_HQ ? "1024x1024" : "256x256",
    prompt: `An abstract representation of your interpretation of the feeling of ${emotion}. Design it so that it would look good scaled down to a 64x64 pixel display. MAKE IT PIXELATED. MAKE THE IMAGE SMALL AND ICONIC. MAKE IT DARK.`,
    model: DALLE_USE_HQ ? "dall-e-3" : "dall-e-2",
    style: "vivid",
    quality: DALLE_USE_HQ ? "hd" : "standard",
    response_format: "b64_json",
  });
  const b64 = res.data[0].b64_json;
  if (!b64) throw new Error("no image data returned by openai");

  const b64Buffer = Buffer.from(b64, "base64url");
  const resizedB64png = await sharp(b64Buffer).resize(FINAL_WIDTH, FINAL_HEIGHT).toFormat("png").toBuffer();
  const bmpBuffer = await (await Jimp.read(resizedB64png)).getBufferAsync("image/bmp");

  const bucketName = Bucket["generated-images"].bucketName;
  const key = crypto.randomUUID();
  const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
  await s3Client.putObject({
    Bucket: bucketName,
    Key: `${key}-og.webp`,
    ACL: "public-read",
    Body: b64Buffer,
    ContentType: "image/webp"
  })
  await s3Client.putObject({
    Bucket: bucketName,
    Key: `${key}.bmp`,
    ACL: "public-read",
    Body: bmpBuffer,
    ContentType: "image/bmp"
  })

  console.log(`Image uploaded: ${url}`);

  mqttClient.publish("test/image", bmpBuffer.toString("base64"));
  console.log("Published to mqtt")


  console.log("Hello from the API handler");
  return {
    statusCode: 200,
    body: `<ul><img src="${url}-og.webp" alt="generated image"></ul>`,
  };
});

export const test = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: "<ul>hello from api</ul>",
  };
});
