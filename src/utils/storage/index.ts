import AWS from "aws-sdk";
import { PutObjectRequest, DeleteObjectRequest } from "aws-sdk/clients/s3";
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
import mime from "mime-types";
import multer from "multer";
import path from "path";
import fs from "fs";
const awsConfig = {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.REGION as string,
};

const s3 = new AWS.S3(awsConfig);

async function uploadFile(fileName: string, fileData: any): Promise<string> {
    try {
        const contentType = mime.lookup(fileName);
        let fileNameMod: any = `arkchat_${new Date().getTime()}_${fileName}`;
        const cdnUrl = process.env.S3_BASE_URL;

        fileNameMod = fileNameMod?.replaceAll(" ", "_");

        const params: PutObjectRequest = {
            Key: fileNameMod,
            Body: fileData,
            Bucket: process.env.BUCKET_NAME ?? "",
            ContentType: contentType ? contentType : "",
        };

        const data = await s3.upload(params).promise();

        const fileUrl = cdnUrl + fileNameMod;
        return Promise.resolve(fileUrl);

    } catch (err) {
        return Promise.reject(err);
    }
}

async function deleteFile(fileUrl: string): Promise<any> {
    try {
        const cdnUrl: string = process.env.S3_BASE_URL as string;
        const filedKey = fileUrl.replace(cdnUrl, "");

        const params: DeleteObjectRequest = {
            Key: filedKey,
            Bucket: process.env.BUCKET_NAME as string
        };

        const data = await s3.deleteObject(params).promise();
      
        return Promise.resolve(true);
    } catch (err) {
        return Promise.reject(err);
    }
}

// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdirSync(process.env.UPLOAD_PATH as string, { recursive: true });
        cb(null, process.env.UPLOAD_PATH as string);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, path.parse(file.originalname).name.replaceAll(" ", "-").toLowerCase() + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, });

export { uploadFile, upload, deleteFile };
