const ImageKit = require("imagekit");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadImage(buffer, fileName) {
  if (!imagekit) {
    throw new Error(
      "ImageKit not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables."
    );
  }

  try {
    const result = await imagekit.upload({
      file: buffer,
      fileName: uuidv4(),
      folder: "/products",
    });

    return {
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      fileId: result.fileId,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image");
  }
}

async function deleteImage(fileId) {
  const client = initClient();
  if (!client) {
    throw new Error(
      "ImageKit not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables."
    );
  }

  try {
    await client.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw new Error("Failed to delete image");
  }
}

module.exports = {
  uploadImage,
  deleteImage,
};
