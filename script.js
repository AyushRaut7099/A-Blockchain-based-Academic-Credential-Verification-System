// ========================================
// CONTRACT CONFIGURATION
// ========================================

const CONTRACT_ADDRESS = "0xB3067e8a75348B24894410B6913dcCa5F7f246C8";


// ========================================
// CONTRACT ABI
// Must exactly match CredentialVerification.sol
// ========================================

const CONTRACT_ABI = [

    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_credentialId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_studentName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_courseName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_institution",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_ipfsCid",
                "type": "string"
            }
        ],
        "name": "issueCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_credentialId",
                "type": "string"
            }
        ],
        "name": "verifyCredential",
        "outputs": [
            {
                "internalType": "string",
                "name": "studentName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "courseName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "institution",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "ipfsCid",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "issueDate",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isValid",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },

    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_credentialId",
                "type": "string"
            }
        ],
        "name": "revokeCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }

];


// ========================================
// GLOBAL VARIABLES
// ========================================

const connectWalletBtn =
    document.getElementById("connectWalletBtn");

const issueBtn =
    document.getElementById("issueBtn");

const verifyBtn =
    document.getElementById("verifyBtn");

let provider;
let signer;
let contract;


// ========================================
// CONNECT METAMASK
// ========================================

connectWalletBtn.addEventListener(
    "click",
    async function () {

        if (typeof window.ethereum === "undefined") {

            alert("MetaMask is not installed!");

            return;
        }

        try {

            provider =
                new ethers.BrowserProvider(
                    window.ethereum
                );

            await provider.send(
                "eth_requestAccounts",
                []
            );

            const network =
                await provider.getNetwork();

            if (network.chainId !== 11155111n) {

                alert(
                    "Please switch MetaMask to the Sepolia network."
                );

                return;
            }

            signer =
                await provider.getSigner();

            contract =
                new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );

            const address =
                await signer.getAddress();

            connectWalletBtn.innerText =
                address.substring(0, 6) +
                "..." +
                address.substring(address.length - 4);

            alert("MetaMask connected successfully! ✅");

        } catch (error) {

            console.error(error);

            alert("Failed to connect MetaMask.");

        }

    }
);


// ========================================
// UPLOAD PDF + ISSUE CREDENTIAL
// ========================================

issueBtn.addEventListener(
    "click",
    async function () {

        if (!contract) {

            alert("Please connect MetaMask first.");

            return;
        }


        // Get form values

        const certificateId =
            document
                .getElementById("certificateId")
                .value
                .trim();

        const studentName =
            document
                .getElementById("studentName")
                .value
                .trim();

        const course =
            document
                .getElementById("course")
                .value
                .trim();

        const institution =
            document
                .getElementById("institution")
                .value
                .trim();

        const certificateFile =
            document
                .getElementById("certificateFile")
                .files[0];


        // Validate fields

        if (
            !certificateId ||
            !studentName ||
            !course ||
            !institution ||
            !certificateFile
        ) {

            alert(
                "Please fill all fields and select a certificate PDF."
            );

            return;

        }


        // Validate PDF

        if (
            certificateFile.type !== "application/pdf"
        ) {

            alert("Please upload a PDF file only.");

            return;

        }


        try {

            // ========================================
            // STEP 1: UPLOAD PDF TO BACKEND
            // ========================================

            issueBtn.disabled = true;

            issueBtn.innerText =
                "Uploading to IPFS...";


            const formData = new FormData();

            formData.append(
                "certificate",
                certificateFile
            );


            const uploadResponse =
                await fetch(
                    "http://localhost:3000/upload-certificate",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const uploadData =
                await uploadResponse.json();


            if (!uploadResponse.ok) {

                throw new Error(
                    uploadData.message ||
                    "Failed to upload certificate to IPFS."
                );

            }


            // ========================================
            // STEP 2: GET REAL IPFS CID
            // ========================================

            const ipfsCid =
                uploadData.cid;


            console.log(
                "Real IPFS CID:",
                ipfsCid
            );


            // ========================================
            // STEP 3: STORE DATA ON BLOCKCHAIN
            // ========================================

            issueBtn.innerText =
                "Waiting for MetaMask...";


            const transaction =
                await contract.issueCredential(
                    certificateId,
                    studentName,
                    course,
                    institution,
                    ipfsCid
                );


            console.log(
                "Transaction Hash:",
                transaction.hash
            );


            issueBtn.innerText =
                "Confirming on Blockchain...";


            await transaction.wait();


            // ========================================
            // SUCCESS
            // ========================================

            alert(
                "Credential successfully issued! 🎉\n\n" +
                "PDF stored on IPFS\n" +
                "Credential stored on Blockchain"
            );


            console.log(
                "IPFS URL:",
                uploadData.ipfsUrl
            );


            // Clear form

            document
                .getElementById("certificateId")
                .value = "";

            document
                .getElementById("studentName")
                .value = "";

            document
                .getElementById("course")
                .value = "";

            document
                .getElementById("institution")
                .value = "";

            document
                .getElementById("certificateFile")
                .value = "";


        } catch (error) {

            console.error(
                "Issue credential error:",
                error
            );

            alert(
                "Failed to issue credential.\n\n" +
                error.message
            );

        } finally {

            issueBtn.disabled = false;

            issueBtn.innerText =
                "Upload & Issue Credential";

        }

    }
);


// ========================================
// VERIFY CREDENTIAL
// ========================================

verifyBtn.addEventListener(
    "click",
    async function () {

        const certificateId =
            document
                .getElementById(
                    "verifyCertificateId"
                )
                .value
                .trim();


        const resultContainer =
            document.getElementById(
                "verificationResult"
            );


        if (!certificateId) {

            resultContainer.innerHTML =
                "<p>Please enter a Certificate ID.</p>";

            return;

        }


        try {

            // Create read-only provider

            const readProvider =
                new ethers.BrowserProvider(
                    window.ethereum
                );


            const readContract =
                new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    readProvider
                );


            // Read credential from blockchain

            const credential =
                await readContract.verifyCredential(
                    certificateId
                );


            const studentName =
                credential[0];

            const courseName =
                credential[1];

            const institution =
                credential[2];

            const ipfsCid =
                credential[3];

            const issueDate =
                credential[4];

            const isValid =
                credential[5];


            // Convert timestamp

            const date =
                new Date(
                    Number(issueDate) * 1000
                ).toLocaleDateString();


            // IPFS certificate URL

            const certificateLink =
                `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;


            // Display result

            resultContainer.innerHTML = `

                <div style="
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow:
                        0 5px 20px rgba(0,0,0,0.1);
                ">

                    <h3>
                        ${isValid
                            ? "✅ Credential Verified Successfully"
                            : "❌ Credential Revoked"
                        }
                    </h3>

                    <p>
                        <strong>Certificate ID:</strong>
                        ${certificateId}
                    </p>

                    <p>
                        <strong>Student Name:</strong>
                        ${studentName}
                    </p>

                    <p>
                        <strong>Course:</strong>
                        ${courseName}
                    </p>

                    <p>
                        <strong>Institution:</strong>
                        ${institution}
                    </p>

                    <p>
                        <strong>Issue Date:</strong>
                        ${date}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${isValid
                            ? "VALID ✅"
                            : "REVOKED ❌"
                        }
                    </p>

                    <p>
                        <strong>Certificate:</strong>

                        <a
                            href="${certificateLink}"
                            target="_blank"
                        >
                            View Certificate PDF
                        </a>
                    </p>

                </div>

            `;


        } catch (error) {

            console.error(
                "Verification error:",
                error
            );


            resultContainer.innerHTML = `

                <div style="
                    background: #fee2e2;
                    padding: 25px;
                    border-radius: 10px;
                ">

                    <h3>❌ Credential Not Found</h3>

                    <p>
                        This Certificate ID does not exist
                        on the blockchain.
                    </p>

                </div>

            `;

        }

    }
);