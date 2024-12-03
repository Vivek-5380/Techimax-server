// server/controllers/imageController.js
require('dotenv').config();
const axios = require('axios');
const Image = require('../models/imageModel');

const generateImage = async (req, res) => {
    const { content } = req.body;

    console.log(req.body);
    

    try {
        // Split content into paragraphs
        const paragraphs = content.split(/\n\n+/);
        const images = [];

        // Helper function to create and wait for prediction
        const createPrediction = async (prompt) => {
            // Create a new prediction
            const predictionResponse = await axios.post(
                'https://api.replicate.com/v1/predictions',
                {
                    version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
                    input: { prompt },
                },
                {
                    headers: {
                        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            let prediction = predictionResponse.data;

            // Poll the prediction endpoint until the prediction is complete
            while (
                prediction.status === 'starting' ||
                prediction.status === 'processing'
            ) {
                // Wait for 1 second before polling again
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Get the updated prediction status
                const predictionResult = await axios.get(
                    `https://api.replicate.com/v1/predictions/${prediction.id}`,
                    {
                        headers: {
                            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
                        },
                    }
                );
                prediction = predictionResult.data;
            }

            if (prediction.status === 'succeeded') {
                return prediction.output;
            } else {
                throw new Error(`Prediction failed: ${prediction.error}`);
            }
        };

        // Generate image for each paragraph
        for (const paragraph of paragraphs) {
            const output = await createPrediction(paragraph);

            // Save image data to MongoDB
            const image = new Image({
                paragraph,
                imageUrl: output[0], // Assuming output is an array of image URLs
            });
            await image.save();
            images.push(image);
        }

        // Generate overall image
        const overallOutput = await createPrediction(content);

        res.status(200).json({
            paragraphImages: images,
            overallImage: overallOutput[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Image generation failed' });
    }
};

module.exports = { generateImage };
