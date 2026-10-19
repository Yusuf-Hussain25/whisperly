import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";

// --------- Image upload provider is chosen in .env with VITE_UPLOAD_PROVIDER ---------
// cloudinary : free Cloudinary account, unsigned upload preset (default)
// firebase   : Firebase Storage (requires the Blaze plan on new projects)
// inline     : compressed image saved straight into Firestore as a data URL (no extra service)

const provider = (import.meta.env.VITE_UPLOAD_PROVIDER || "cloudinary").toLowerCase();

const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "whisperly");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Image upload failed");
    }
    return data.secure_url;
};

const uploadToFirebase = (file) => {
    const storage = getStorage();
    const storageRef = ref(storage, `images/${Date.now() + file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress =
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
            },
            (error) => {
                reject(new Error("Something went wrong! " + error.code));
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve, reject);
            }
        );
    });
};

// Shrinks the image and returns it as a JPEG data URL. Firestore documents are
// capped at 1 MB, so images are kept small (max 512px side).
const uploadInline = (file, maxSize = 512, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read the image file"));
        };
        img.src = objectUrl;
    });
};

const providers = {
    cloudinary: uploadToCloudinary,
    firebase: uploadToFirebase,
    inline: uploadInline
};

const upload = async (file) => {
    const uploadFn = providers[provider];
    if (!uploadFn) {
        throw new Error(`Unknown VITE_UPLOAD_PROVIDER "${provider}". Use cloudinary, firebase or inline`);
    }
    return uploadFn(file);
};

export default upload;
