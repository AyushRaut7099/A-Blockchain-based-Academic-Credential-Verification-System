require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");

const app = express();

const PORT = 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());


// Store uploaded file temporarily in memory
const upload = multer({
    storage: multer.memoryStorage()
});


// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {

    res.send("Backend server is running!");

});


// ========================================
// UPLOAD PDF TO PINATA IPFS
// ========================================

app.post(
    "/upload-certificate",
    upload.single("certificate"),
    async (req, res) => {

        try {

            // Check whether a file was uploaded
            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: "Please upload a certificate PDF."
                });

            }


            // Check PDF type
            if (req.file.mimetype !== "application/pdf") {

                return res.status(400).json({
                    success: false,
                    message: "Only PDF files are allowed."
                });

            }


            console.log(
                "Uploading certificate:",
                req.file.originalname
            );


            // Check whether JWT exists
            if (!process.env.PINATA_JWT) {

                throw new Error(
                    "PINATA_JWT is missing from the .env file."
                );

            }


            // Create form data
            const formData = new FormData();


            // IMPORTANT: Upload to PUBLIC IPFS
            formData.append(
                "network",
                "public"
            );


            // Add PDF file
            formData.append(
                "file",
                req.file.buffer,
                {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                }
            );


            // Add file name
            formData.append(
                "name",
                req.file.originalname
            );


            // ========================================
            // UPLOAD TO PINATA V3 API
            // ========================================

            const response = await axios.post(

                "https://uploads.pinata.cloud/v3/files",

                formData,

                {
                    maxBodyLength: Infinity,

                    headers: {

                        ...formData.getHeaders(),

                        Authorization:
                            `Bearer ${process.env.PINATA_JWT}`

                    }

                }

            );


            // Get IPFS CID from Pinata V3 response
            const cid =
                response.data.data.cid;


            console.log(
                "Successfully uploaded to IPFS!"
            );

            console.log(
                "IPFS CID:",
                cid
            );


            // Send CID back to frontend
            res.json({

                success: true,

                message:
                    "Certificate uploaded successfully to IPFS!",

                cid: cid,

                ipfsUrl:
                    `https://gateway.pinata.cloud/ipfs/${cid}`

            });

        }

        catch (error) {

            console.error(
                "Pinata upload error:",
                error.response?.data || error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to upload certificate to IPFS.",

                error:
                    error.response?.data || error.message

            });

        }

    }
);


// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

    console.log(
        `Backend running at http://localhost:${PORT}`
    );

});