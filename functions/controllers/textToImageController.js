const { GoogleGenAI, Modality } = require("@google/genai");

const crypto = require("crypto");
const axios = require("axios");
var fs = require("fs");
const FormData = require("form-data");
const { log } = require("console");

exports.createTextToImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    const YOUR_API_KEY = "i9sli6k9ap5194s8o51hqwisf14ixdpp";
    const YOUR_API_SECRET =
      "36d281c62bb2e2606c5036b2fac1a1e6dd704783d865b6b4b62b9f3a5268c42e";

    const plainNonce = new Date().getTime();
    const hmac = crypto
      .createHmac("sha256", YOUR_API_KEY)
      .update(YOUR_API_SECRET + plainNonce);
    const signatureHex = hmac.digest("hex");

    //request options
    const options = {
      headers: {
        "x-api-key": YOUR_API_KEY,
        "x-nonce": plainNonce,
        "x-signature": signatureHex,
        "Content-Type": "application/json",
      },
    };

    //prepare request object (if you are going to send a file please use form data)
    let requestObject = {
      selectedModel: "664",
      selectedModelPrivate: "",
      selectedLoraModel: "853",
      selectedLoraModelPrivate: [],
      selectedLoraModelPrivateUrl: "",
      prompt: `<lora:Modern-Cartoon:1.0>, ${prompt}`,
      steps: "25",
      scale: "3.5",
      samples: "1",
      seed: "3768227685",
      width: "1024",
      height: "1024",
      callbackUrl:
        "YOU CAN WRITE A CALLBACK URL WIRO WILL MAKE A POST REQUEST WHEN THE TASK COMPLETED",
    };

    //make HTTP post request
    const response1 = await axios.post(
      "https://api.wiro.ai/v1/Run/wiro/text-to-image-flux-lora",
      requestObject,
      options
    );

    const token = response1?.data?.socketaccesstoken;

    let requestObject1 = {
      tasktoken: token,
    };

    const response2 = await axios.post(
      "https://api.wiro.ai/v1/Task/Detail",
      requestObject1,
      options
    );

    const imageData = response2?.data?.tasklist[0]?.parameters?.inputImage;
    console.log(response2?.data);
    console.log("b", response2?.data?.tasklist[0].outputs);
    console.log(imageData);

    res.status(201).json({
      message: "Image created successfully",
      data: imageData,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Video creation failed", error: err.message });
  }
};

// exports.createTextToImage = async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     let imageData;

//     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//     // Set responseModalities to include "Image" so the model can generate  an image
//     const response = await ai.models.generateContent({
//       model: "gemini-2.0-flash-exp-image-generation",
//       contents: prompt,
//       config: {
//         responseModalities: [Modality.TEXT, Modality.IMAGE],
//       },
//     });
//     for (const part of response.candidates[0].content.parts) {
//       // Based on the part type, either show the text or save the image
//       if (part.text) {
//         console.log(part.text);
//       } else if (part.inlineData) {
//         imageData = part.inlineData.data;
//         console.log(imageData);
//       }
//     }
//     res.status(201).json({
//       message: "Image created successfully",
//       data: imageData,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Video creation failed", error: err.message });
//   }
// };
