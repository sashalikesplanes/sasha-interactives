import { ApiHandler } from "sst/node/api";
import OpenAI from "openai";
import { Config } from "sst/node/config";
import mqtt from "mqtt";
import { S3, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { Bucket } from "sst/node/bucket";
import crypto from "crypto";
import sharp from "sharp";

const openaiClient = new OpenAI({
  apiKey: Config.OPENAI_SECRET_KEY
});

const mqttClient = await mqtt.connectAsync(`mqtt://${Config.HIVEMQ_URL}`, {
  username: Config.HIVEMQ_USERNAME,
  protocol: 'mqtts',
  port: 8883,
  password: Config.HIVEMQ_PASSWORD,
});

const s3Client = new S3({ region: "eu-west-1" });

export const handler = ApiHandler(async (_evt) => {
  const res = await openaiClient.images.generate({
    n: 1,
    size: "256x256",
    prompt: "An abstract representation of your interpretation of the feeling of sadness. Design it so that it would look good scaled down to a 64x64 pixel display. MAKE IT PIXELATED",
    model: "dall-e-2",
    style: "vivid",
    quality: "standard",
    response_format: "b64_json",
  });
  const b64 = res.data[0].b64_json;
  if (!b64) throw new Error("no image data returned by openai");

  const b64Buffer = Buffer.from(b64, "base64url");
  const resizedB64 = await sharp(b64Buffer).resize(64, 64).toFormat("webp").toBuffer();
  const bucketName = Bucket["generated-images"].bucketName;
  const key = crypto.randomUUID();
  const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
  await s3Client.putObject({
    Bucket: bucketName,
    Key: key,
    ACL: "public-read",
    Body: resizedB64,
    ContentType: "image/webp"
  })

  console.log(`Image uploaded: ${url}`);

  mqttClient.publish("test", "test");
  console.log("Published to mqtt")


  console.log("Hello from the API handler");
  return {
    statusCode: 200,
    body: `Hello sasha!!!. The time is ${new Date().toISOString()}, the url is : ${url}`,
  };
});
